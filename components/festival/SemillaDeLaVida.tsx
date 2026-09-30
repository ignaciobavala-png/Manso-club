/**
 * Semilla de la vida quieta, en SVG: sello chico del footer del festival.
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
