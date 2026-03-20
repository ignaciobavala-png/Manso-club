'use client';

import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#@&%$';

interface Props {
  text: string;
  className?: string;
}

export const ScrambleText = ({ text, className }: Props) => {
  const [displayed, setDisplayed] = useState<string[]>(() =>
    text.split('').map(() => '')
  );
  const ref        = useRef<HTMLSpanElement>(null);
  // No se resetea entre invocaciones — clave para Strict Mode
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          observer.disconnect();
          runScramble();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      // Intencionalmente NO se limpia el interval aquí.
      // El interval se auto-termina cuando frame > totalFrames.
      // Limpiar el interval en el cleanup mataría la animación en Strict Mode.
    };
  }, []);

  const runScramble = () => {
    const letters      = text.split('');
    const startDelay   = 6;
    const resolveAfter = 22;
    const totalFrames  = letters.length * startDelay + resolveAfter + 4;
    let frame = 0;
    let id: ReturnType<typeof setInterval>;

    id = setInterval(() => {
      setDisplayed(
        letters.map((letter, i) => {
          const start   = i * startDelay;
          const resolve = start + resolveAfter;
          if (frame < start)    return '';
          if (frame >= resolve) return letter;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
      );

      frame++;

      if (frame > totalFrames) {
        clearInterval(id);
        setDisplayed(letters);
      }
    }, 70);
  };

  return (
    <span ref={ref} className={className} aria-label={text}>
      {displayed.map((char, i) => (
        <span key={i} className={char !== '' && char !== text[i] ? 'text-manso-olive' : ''}>
          {char || '\u00A0'}
        </span>
      ))}
    </span>
  );
};
