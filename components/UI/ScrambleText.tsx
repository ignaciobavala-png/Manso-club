'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#@&%$';

interface Props {
  text: string;
  className?: string;
}

export const ScrambleText = ({ text, className }: Props) => {
  const [displayed, setDisplayed] = useState<string[]>(() =>
    text.split('').map(() => '')
  );
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isInView || hasRun.current) return;
    hasRun.current = true;

    const letters = text.split('');
    const startDelay = 6;   // frames antes de que empiece a scramble cada letra
    const resolveAfter = 22; // frames scrambliando hasta resolverse
    const totalFrames = letters.length * startDelay + resolveAfter + 4;
    let frame = 0;

    const interval = setInterval(() => {
      setDisplayed(
        letters.map((letter, i) => {
          const start   = i * startDelay;
          const resolve = start + resolveAfter;
          if (frame < start)   return '';
          if (frame >= resolve) return letter;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
      );

      frame++;
      if (frame > totalFrames) {
        clearInterval(interval);
        setDisplayed(letters);
      }
    }, 70);

    return () => clearInterval(interval);
  }, [isInView, text]);

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
