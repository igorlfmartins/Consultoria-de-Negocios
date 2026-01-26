
import { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import { LiveVisualizer } from './LiveVisualizer';

// @ts-ignore
import pcmProcessorUrl from '../audio-processor.js?url';

interface LiveModeProps {
  onClose: () => void;
  systemInstruction: string;
}

export function LiveMode({ onClose, systemInstruction }: LiveModeProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  // 1. Initialize Microphone immediately on mount
  useEffect(() => {
    let mounted = true;

    const initMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }
        streamRef.current = stream;
        
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        }

        try {
          await audioContextRef.current.audioWorklet.addModule(pcmProcessorUrl);
        } catch (e) {
          console.error("Failed to load audio worklet", e);
        }

        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'pcm-processor');
        
        workletNodeRef.current.port.onmessage = (event) => {
          if (!mounted) return;
          const inputData = event.data;
          
          // Calculate volume for visualizer
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          setVolume(Math.sqrt(sum / inputData.length));

          // Only send if connected, not muted, and WS is open
          if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

          // Convert to PCM 16-bit
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }

          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          wsRef.current.send(JSON.stringify({
            realtime_input: {
              media_chunks: [{
                mime_type: "audio/pcm;rate=16000",
                data: base64
              }]
            }
          }));
        };

        sourceRef.current.connect(workletNodeRef.current);
        workletNodeRef.current.connect(audioContextRef.current.destination);

      } catch (err: any) {
        console.error('Error accessing microphone:', err);
        if (mounted) setConnectionError("Permissão de microfone negada");
      }
    };

    initMicrophone();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      sourceRef.current?.disconnect();
      workletNodeRef.current?.disconnect();
    };
  }, [isMuted]); // Re-bind if muted changes (though logical check is inside callback, this is fine)

  useEffect(() => {
    const getWebSocketUrl = () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      
      if (apiUrl) {
        try {
          const url = new URL(apiUrl);
          const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = url.host;
          return `${protocol}//${host}/api/live`;
        } catch {
          let wsUrl = apiUrl.replace(/^http/, 'ws');
          if (wsUrl.endsWith('/')) {
            wsUrl = wsUrl.slice(0, -1);
          }
          return `${wsUrl}/api/live`;
        }
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/api/live`;
    };

    const ws = new WebSocket(getWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
      // Send initial setup
      ws.send(JSON.stringify({
        setup: {
          model: "models/gemini-2.0-flash-exp",
          generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } }
            }
          },
          system_instruction: {
            parts: [{ text: systemInstruction }]
          }
        }
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.serverContent?.modelTurn?.parts) {
          for (const part of data.serverContent.modelTurn.parts) {
            if (part.inlineData?.mimeType === 'audio/pcm;rate=16000') {
              const base64Audio = part.inlineData.data;
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcm16 = new Int16Array(bytes.buffer);
              audioQueue.current.push(pcm16);
              if (!isPlayingRef.current) {
                playNextChunk();
              }
            }
          }
        }
      } catch (e) {
        console.error("Error parsing websocket message", e);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setIsConnected(false);
      setConnectionError("Erro de conexão com o servidor");
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [systemInstruction]);

  const playNextChunk = async () => {
    if (audioQueue.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const chunk = audioQueue.current.shift()!;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }

    const audioBuffer = audioContextRef.current.createBuffer(1, chunk.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < chunk.length; i++) {
      channelData[i] = chunk[i] / 32768;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      playNextChunk();
    };
    
    source.start();
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 transition-all duration-500 bg-grid-pattern font-sans">
      <button 
        onClick={onClose}
        className="absolute top-12 right-12 text-slate-500 hover:text-white p-3 border border-transparent hover:border-slate-800 transition-all"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="w-full max-w-2xl flex flex-col items-center space-y-16">
        <div className="relative">
          <div className="absolute -inset-4 border border-neon-blue/20 animate-pulse" />
          <div className="absolute -inset-8 border border-neon-magenta/10 animate-pulse delay-75" />
          <LiveVisualizer isSpeaking={isSpeaking} volume={volume} />
        </div>

        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <div className="w-full p-8 bg-navy-900 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-8 bg-neon-blue" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-geometric text-slate-500 font-bold">Modo Voz</p>
                <p className={`text-sm font-bold tracking-geometric ${connectionError ? 'text-neon-magenta' : (isConnected ? 'text-neon-green' : 'text-neon-orange')}`}>
                  {connectionError ? 'ERRO DE CONEXÃO' : (isConnected ? 'SISTEMA ONLINE' : 'INICIALIZANDO...')}
                </p>
              </div>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-5 transition-all border ${
                  isMuted 
                    ? 'bg-neon-magenta/10 border-neon-magenta text-neon-magenta shadow-[0_0_15px_rgba(255,0,255,0.2)]' 
                    : 'bg-navy-950 border-slate-800 text-neon-blue hover:border-neon-blue'
                }`}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex-1 h-1 bg-slate-800">
              <div 
                className="h-full bg-neon-blue transition-all duration-300" 
                style={{ width: isConnected ? '100%' : '30%' }} 
              />
            </div>
            <div className="flex-1 h-1 bg-slate-800">
              <div 
                className="h-full bg-neon-magenta transition-all duration-300" 
                style={{ width: isSpeaking ? '100%' : '0%' }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
