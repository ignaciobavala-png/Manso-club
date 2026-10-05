'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Props {
  mode?: 'dark' | 'light';
  radiusScale?: number;
  opacity?: number;
}

const LINK_DIST = 110;
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

export const ParticleBackground = ({ mode = 'dark', radiusScale = 1, opacity = 0.3 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let particles: Particle[] = [];
    // El loop corre solo con el canvas en pantalla y la pestaña visible. Antes
    // seguía dibujando siempre, en las 28 páginas que lo usan: era lo que más
    // bloqueaba el hilo principal en mobile (Lighthouse, oct-2026).
    let enPantalla = false;
    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const esMobile = window.matchMedia('(max-width: 767px)').matches;

    const initParticles = () => {
      // Las líneas entre partículas son O(n²): en mobile se usa la mitad.
      const tope = esMobile ? 40 : 85;
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 11000), tope);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        radius: (Math.random() * 1.2 + 0.4) * radiusScale,
      }));
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth || canvas.parentElement?.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || canvas.parentElement?.offsetHeight || window.innerHeight;
      initParticles();
      if (!animationId) drawFrame();
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = mode === 'light' ? 'rgba(0,0,0,0.35)' : `rgba(255,255,255,${opacity})`;
      for (const p of particles) {
        if (!reducirMovimiento) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < LINK_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = (1 - dist / LINK_DIST) * (mode === 'light' ? 0.13 : 0.1);
            ctx.strokeStyle = mode === 'light' ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
            ctx.stroke();
          }
        }
      }
    };

    const loop = () => {
      drawFrame();
      animationId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (animationId || reducirMovimiento || !enPantalla || document.hidden) return;
      animationId = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(animationId);
      animationId = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      enPantalla = entry.isIntersecting;
      if (enPantalla) start();
      else stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    // Esperar al primer paint para que el canvas tenga dimensiones reales
    const firstFrame = requestAnimationFrame(() => {
      resize();
      start();
    });

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(firstFrame);
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [mode, radiusScale, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full z-0"
      style={{ pointerEvents: 'none', height: '100%', minHeight: '100vh' }}
    />
  );
};
