
import { useEffect, useRef } from 'react';

interface LiveVisualizerProps {
  isSpeaking: boolean;
  volume: number;
}

export function LiveVisualizer({ isSpeaking, volume }: LiveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const particles = useRef<{ x: number; y: number; baseSize: number; angle: number; distance: number }[]>([]);

  useEffect(() => {
    const particleCount = 100;
    const p = [];
    for (let i = 0; i < particleCount; i++) {
      p.push({
        x: 0,
        y: 0,
        baseSize: Math.random() * 2 + 1,
        angle: (i / particleCount) * Math.PI * 2,
        distance: 100 + Math.random() * 20,
      });
    }
    particles.current = p;
  }, []);

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const pulse = isSpeaking ? Math.sin(time / 200) * 10 + volume * 50 : Math.sin(time / 1000) * 5;

    particles.current.forEach((p, i) => {
      const dynamicDistance = p.distance + pulse + (isSpeaking ? Math.sin(time / 100 + i) * 5 : 0);
      const x = centerX + Math.cos(p.angle) * dynamicDistance;
      const y = centerY + Math.sin(p.angle) * dynamicDistance;

      ctx.beginPath();
      ctx.arc(x, y, p.baseSize, 0, Math.PI * 2);
      ctx.fillStyle = isSpeaking ? '#38bdf8' : '#64748b';
      ctx.fill();
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isSpeaking, volume]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full max-w-[400px] h-auto"
      />
      <div className="text-center">
        <p className="text-sky-400 font-medium tracking-widest uppercase text-xs">
          {isSpeaking ? 'IA está falando...' : 'Ouvindo você...'}
        </p>
        <p className="text-slate-500 text-[10px] mt-2">
          Modo Live Ativado • Conversa por Voz
        </p>
      </div>
    </div>
  );
}
