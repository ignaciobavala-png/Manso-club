'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface Point {
  x: number;
  y: number;
  time: number;
}

const MAX_POINTS = 100;
const TRAIL_DURATION = 700;

// En touch el trazo sigue al dedo y tapa lo que la persona está tocando:
// Ana pidió que en mobile no aparezca.
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

export const CursorTrail = () => {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/mansoadm');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const mouseRef = useRef({ x: -200, y: -200 });
  const hiddenRef = useRef(false);
  // Arranca apagado: se prende recién en el cliente si el puntero es fino.
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER);
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isAdmin || !finePointer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      hiddenRef.current = document
        .elementsFromPoint(e.clientX, e.clientY)
        .some((el) => (el as HTMLElement).dataset?.cursorHidden === 'true');
    };

    const draw = (now: number) => {
      const points = pointsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      if (hiddenRef.current) {
        points.length = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationId = requestAnimationFrame(draw);
        return;
      }

      if (mx > 0 && my > 0) {
        points.push({ x: mx, y: my, time: now });
      }

      while (points.length > 0 && now - points[0].time > TRAIL_DURATION) {
        points.shift();
      }
      while (points.length > MAX_POINTS) {
        points.shift();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (points.length < 3) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      for (let pass = 0; pass < 3; pass++) {
        const jitter = pass * 0.6;

        for (let i = 2; i < points.length; i++) {
          const p = points[i];
          const age = now - p.time;
          const life = 1 - age / TRAIL_DURATION;
          if (life <= 0) continue;

          const p0 = points[i - 2];
          const p1 = points[i - 1];

          const alpha = life * (0.35 - pass * 0.08);
          if (alpha <= 0) continue;

          const width = life * (2.5 - pass * 0.5);

          ctx.beginPath();
          ctx.moveTo(p0.x + jitter, p0.y + jitter * (i % 2 === 0 ? 1 : -1));
          ctx.lineTo(p1.x - jitter, p1.y + jitter * (i % 2 === 0 ? -1 : 1));
          ctx.lineTo(p.x + jitter * 0.5, p.y - jitter * 0.5);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }

      for (let i = 0; i < points.length; i += 2) {
        const p = points[i];
        const age = now - p.time;
        const life = 1 - age / TRAIL_DURATION;
        if (life <= 0.15) continue;

        for (let d = 0; d < 3; d++) {
          const dx = (Math.random() - 0.5) * 5;
          const dy = (Math.random() - 0.5) * 5;
          const size = Math.random() * 1.5 + 0.3;

          ctx.beginPath();
          ctx.arc(p.x + dx, p.y + dy, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${life * 0.12})`;
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, [isAdmin, finePointer]);

  if (isAdmin || !finePointer) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: 'none', touchAction: 'none' }}
    />
  );
};
