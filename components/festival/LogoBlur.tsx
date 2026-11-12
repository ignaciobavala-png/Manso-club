import Image from 'next/image';

/**
 * Logo primario de BLUR (el de la diseñadora, `public/blurfestival/marca/`): vector,
 * en blanco para fondos oscuros o sobre foto, en negro para fondos claros.
 * `unoptimized` porque next/image no procesa SVG (ya viene liviano, ~5 KB).
 */
export function LogoBlur({
  tono = 'blanco',
  priority = false,
  className,
}: {
  tono?: 'blanco' | 'negro';
  /** Solo el del hero: es lo primero que se pinta. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={tono === 'blanco' ? '/blurfestival/marca/logo_1_b.svg' : '/blurfestival/marca/logo_1_n.svg'}
      alt="BLUR"
      width={1183}
      height={201}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}
