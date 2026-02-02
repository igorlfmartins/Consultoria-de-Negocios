import { useEffect, useRef, useState, useCallback } from 'react';

// @ts-ignore
import pcmProcessorUrl from '../audio-processor.js?url';

interface UseLiveAudioProps {
  systemInstruction: string;
  token?: string;
}

export function useLiveAudio({ systemInstruction, token }: UseLiveAudioProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Inicializando...');
  const [debugUrl, setDebugUrl] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(isMuted);

  // Sync isMuted ref to state without re-running audio setup
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const stopAudioPlayback = useCallback(() => {
    activeNodesRef.current.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    activeNodesRef.current = [];
    
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  const handleAudioChunk = useCallback((base64: string) => {
    if (!audioContextRef.current) return;

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    
    const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) {
      channelData[i] = pcm16[i] / 32768;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    const currentTime = audioContextRef.current.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime + 0.05;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
    
    activeNodesRef.current.push(source);
    
    setIsSpeaking(true);
    source.onended = () => {
      activeNodesRef.current = activeNodesRef.current.filter(n => n !== source);
      if (audioContextRef.current && nextStartTimeRef.current <= audioContextRef.current.currentTime + 0.1) {
        setIsSpeaking(false);
      }
    };
  }, []);

  // Initialize Microphone
  useEffect(() => {
    let mounted = true;

    const initMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000
          } 
        });
        
        if (!mounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }
        streamRef.current = stream;
        
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        }

        await audioContextRef.current.audioWorklet.addModule(pcmProcessorUrl);

        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'pcm-processor');
        
        workletNodeRef.current.port.onmessage = (event) => {
          if (!mounted) return;
          const inputData = event.data;
          
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          setVolume(Math.sqrt(sum / inputData.length));

          if (isMutedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
             return;
          }

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
      } catch (err) {
        console.error('Error accessing microphone:', err);
        if (mounted) setConnectionStatus("Permissão de Mic Negada");
      }
    };

    setConnectionStatus("Aguardando Microfone...");
    initMicrophone();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      sourceRef.current?.disconnect();
      workletNodeRef.current?.disconnect();
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []); // Removed isMuted dependency to prevent microphone restart

  // WebSocket Connection
  useEffect(() => {
    const getWebSocketUrl = () => {
      let baseUrl = '';
      if (window.location.hostname.includes('railway.app')) {
        baseUrl = 'wss://clarity-machine-backend.up.railway.app/api/live';
      } else if ((window as any).ENV?.VITE_API_URL) {
         const url = new URL((window as any).ENV.VITE_API_URL);
         const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
         baseUrl = `${protocol}//${url.host}/api/live`;
      } else {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl) {
          try {
            const url = new URL(apiUrl);
            const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
            baseUrl = `${protocol}//${url.host}/api/live`;
          } catch {
            let wsUrl = apiUrl.replace(/^http/, 'ws');
            if (wsUrl.endsWith('/')) wsUrl = wsUrl.slice(0, -1);
            baseUrl = `${wsUrl}/api/live`;
          }
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          baseUrl = `${protocol}//${window.location.host}/api/live`;
        }
      }

      if (token) {
        return `${baseUrl}?token=${encodeURIComponent(token)}`;
      }
      
      // Safety fix for old backend URL
      if (baseUrl.includes('consultoria-backend.up.railway.app')) {
        baseUrl = baseUrl.replace('consultoria-backend.up.railway.app', 'clarity-machine-backend.up.railway.app');
      }

      return baseUrl;
    };

    const url = getWebSocketUrl();
    setDebugUrl(url);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setConnectionStatus("Conectando...");

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus("Sistema Online");
      const setupMsg = {
        setup: {
          model: "models/gemini-2.0-flash",
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
      };
      ws.send(JSON.stringify(setupMsg));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.serverContent?.modelTurn?.parts) {
          for (const part of data.serverContent.modelTurn.parts) {
            if (part.inlineData?.mimeType === 'audio/pcm;rate=16000') {
              handleAudioChunk(part.inlineData.data);
            }
          }
        }

        if (data.serverContent?.interrupted) {
          stopAudioPlayback();
        }
      } catch (e) {
        console.error("Error parsing websocket message", e);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
      setConnectionStatus("Erro de Conexão");
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      setConnectionStatus(event.code === 1000 ? "Finalizado" : `Erro ${event.code}`);
    };

    return () => ws.close();
  }, [systemInstruction, handleAudioChunk, stopAudioPlayback, token]);

  return {
    isSpeaking,
    volume,
    isMuted,
    setIsMuted,
    isConnected,
    connectionStatus,
    debugUrl
  };
}
