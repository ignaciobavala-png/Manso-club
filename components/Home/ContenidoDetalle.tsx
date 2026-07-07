function esSubtitulo(linea: string) {
  const letras = linea.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letras.length < 3) return false;
  return letras === letras.toUpperCase() && letras !== letras.toLowerCase();
}

function esBullet(linea: string) {
  return /^[.\-]\s*/.test(linea);
}

type Bloque =
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'lista'; items: string[] };

function parsear(texto: string): Bloque[] {
  const lineas = texto.split('\n');
  const bloques: Bloque[] = [];
  let parrafoActual: string[] = [];
  let listaActual: string[] = [];

  const cerrarParrafo = () => {
    if (parrafoActual.length > 0) {
      bloques.push({ tipo: 'parrafo', texto: parrafoActual.join(' ') });
      parrafoActual = [];
    }
  };
  const cerrarLista = () => {
    if (listaActual.length > 0) {
      bloques.push({ tipo: 'lista', items: listaActual });
      listaActual = [];
    }
  };

  for (const linea of lineas) {
    const trimmed = linea.trim();

    if (trimmed === '') {
      cerrarParrafo();
      cerrarLista();
      continue;
    }

    if (esBullet(trimmed)) {
      cerrarParrafo();
      listaActual.push(trimmed.replace(/^[.\-]\s*/, ''));
      continue;
    }

    if (esSubtitulo(trimmed)) {
      cerrarParrafo();
      cerrarLista();
      bloques.push({ tipo: 'subtitulo', texto: trimmed });
      continue;
    }

    cerrarLista();
    parrafoActual.push(trimmed);
  }

  cerrarParrafo();
  cerrarLista();

  return bloques;
}

export function ContenidoDetalle({ texto }: { texto: string }) {
  const bloques = parsear(texto);

  return (
    <div className="space-y-6">
      {bloques.map((bloque, i) => {
        if (bloque.tipo === 'subtitulo') {
          return (
            <h3
              key={i}
              className="text-sm font-black uppercase tracking-widest text-manso-terra mt-10 first:mt-0"
            >
              {bloque.texto}
            </h3>
          );
        }
        if (bloque.tipo === 'lista') {
          return (
            <ul key={i} className="space-y-2">
              {bloque.items.map((item, j) => (
                <li
                  key={j}
                  className="text-sm md:text-base text-manso-cream/70 leading-relaxed font-light flex gap-2"
                >
                  <span className="text-manso-terra">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className="text-base md:text-lg text-manso-cream/70 leading-relaxed font-light"
          >
            {bloque.texto}
          </p>
        );
      })}
    </div>
  );
}
