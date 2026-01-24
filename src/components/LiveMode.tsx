
import { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import { LiveVisualizer } from './LiveVisualizer';

interface LiveModeProps {
  onClose: () => void;
  systemInstruction: string;
}

export function LiveMode({ onClose, systemInstruction }: LiveModeProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/api/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
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
    };

    ws.onclose = () => setIsConnected(false);

    return () => {
      ws.close();
      stopRecording();
    };
  }, []);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (isMuted) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        setVolume(Math.sqrt(sum / inputData.length));

        // Convert to PCM 16-bit
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }

        // Send to WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          wsRef.current.send(JSON.stringify({
            realtime_input: {
              media_chunks: [{
                mime_type: "audio/pcm;rate=16000",
                data: base64
              }]
            }
          }));
        }
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
  };

  useEffect(() => {
    if (isConnected) {
      startRecording();
    }
    return () => stopRecording();
  }, [isConnected]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 transition-all duration-500">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-900 transition-all"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="w-full max-w-lg flex flex-col items-center space-y-12">
        <LiveVisualizer isSpeaking={isSpeaking} volume={volume} />

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-all ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-sky-400 hover:bg-slate-800'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          
          <div className="px-6 py-3 bg-slate-900 rounded-2xl border border-slate-800">
             <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Status</p>
             <p className={`text-sm font-medium ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
               {isConnected ? 'Conectado' : 'Conectando...'}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
