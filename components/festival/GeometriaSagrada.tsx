'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /** Color de las líneas y los puntos. */
  color: string;
  className?: string;
}

/** Ángulo dorado en radianes: el de las semillas de un girasol. */
const ANGULO_DORADO = Math.PI * (3 - Math.sqrt(5));

/**
 * Hero animado del festival: geometría sagrada + naturaleza, en línea fina de
 * un solo color.
 *
 * - Semilla de la vida: siete círculos entrelazados, más un segundo anillo de
 *   seis (a distancia r·√3) que la abre hacia la flor de la vida. Los dos
 *   anillos giran en sentidos opuestos, muy despacio.
 * - Filotaxis: puntos en ángulo dorado, la espiral de un girasol, que respira.
 *
 * Nació del patrón "Lissajous Field" de bookofshapes.com; la curva de color se
 * sacó y quedaron estas dos capas.
 *
 * Canvas y no SVG porque se redibuja a 60 fps. Se pausa fuera de pantalla y,
 * con "reducir movimiento", dibuja un solo cuadro quieto.
 */
export function GeometriaSagrada({ color, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ancho = 0;
    let alto = 0;
    let frame = 0;
    let visible = true;
    const inicio = performance.now();

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      ancho = rect.width;
      alto = rect.height;
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const circulo = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    };

    const dibujar = (ms: number) => {
      const t = (ms - inicio) / 1000;
      const mobile = ancho < 768;

      ctx.clearRect(0, 0, ancho, alto);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      // En desktop la figura se corre a la derecha para dejarle aire al título.
      const cx = ancho * (mobile ? 0.5 : 0.64);
      const cy = alto * 0.5;
      const radio = Math.min(ancho * (mobile ? 0.2 : 0.13), alto * 0.17);
      const respiro = 1 + Math.sin(t * 0.5) * 0.03;

      // ── Filotaxis ────────────────────────────────────────────────────
      const semillas = mobile ? 320 : 520;
      const escala = (radio * 3.1) / Math.sqrt(semillas);
      for (let n = 1; n < semillas; n++) {
        const r = escala * Math.sqrt(n) * respiro;
        const a = n * ANGULO_DORADO + t * 0.03;
        ctx.globalAlpha = 0.1 + 0.3 * (1 - n / semillas);
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, mobile ? 1 : 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Semilla de la vida y su segundo anillo ───────────────────────
      ctx.lineWidth = 1;
      const r = radio * respiro;

      ctx.globalAlpha = 0.18;
      const giroExterior = -t * 0.015 + Math.PI / 6;
      for (let k = 0; k < 6; k++) {
        const a = giroExterior + (k * Math.PI) / 3;
        circulo(cx + Math.cos(a) * r * Math.sqrt(3), cy + Math.sin(a) * r * Math.sqrt(3), r);
      }

      ctx.globalAlpha = 0.45;
      const giro = t * 0.02;
      circulo(cx, cy, r);
      for (let k = 0; k < 6; k++) {
        const a = giro + (k * Math.PI) / 3;
        circulo(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r);
      }

      ctx.globalAlpha = 0.3;
      circulo(cx, cy, r * 2);
      circulo(cx, cy, r * 3);

      ctx.globalAlpha = 1;
    };

    const bucle = (ms: number) => {
      if (visible) dibujar(ms);
      frame = requestAnimationFrame(bucle);
    };

    medir();
    if (quieto) dibujar(inicio + 6000);
    else frame = requestAnimationFrame(bucle);

    const alRedimensionar = () => {
      medir();
      if (quieto) dibujar(inicio + 6000);
    };

    const observador = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
    });
    observador.observe(canvas);
    window.addEventListener('resize', alRedimensionar);

    return () => {
      cancelAnimationFrame(frame);
      observador.disconnect();
      window.removeEventListener('resize', alRedimensionar);
    };
  }, [color]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}

/**
 * La misma semilla de la vida, quieta y en SVG: para sellos chicos (el footer)
 * donde no hace falta un canvas animado.
 */
export function SemillaDeLaVida({ className }: { className?: string }) {
  const r = 20;
  const centros = [
    [0, 0],
    ...Array.from({ length: 6 }, (_, k) => [
      Math.cos((k * Math.PI) / 3) * r,
      Math.sin((k * Math.PI) / 3) * r,
    ]),
  ];
  return (
    <svg viewBox="-62 -62 124 124" aria-hidden className={className}>
      <g fill="none" stroke="currentColor" strokeWidth={0.6}>
        {centros.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
        <circle r={r * 2} />
        <circle r={r * 3} strokeOpacity={0.5} />
      </g>
    </svg>
  );
}
