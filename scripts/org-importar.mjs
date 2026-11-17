// Genera el SQL para cargar en /org los dos mapas HTML de la organización.
//
//   node scripts/org-importar.mjs <completo.html> <por-stage.html> > seed_org.sql
//
// Cada HTML trae los datos en `const PH=[...]` (JSON válido). Se corre una vez:
// después los datos viven en la base y se editan desde /org.
import { readFileSync } from 'node:fs';

const [completo, stage] = process.argv.slice(2);
if (!completo || !stage) {
  console.error('Uso: node scripts/org-importar.mjs <completo.html> <por-stage.html>');
  process.exit(1);
}

const leer = (ruta) => {
  const html = readFileSync(ruta, 'utf8');
  const i = html.indexOf('const PH=') + 'const PH='.length;
  const j = html.indexOf('];\nconst esc', i) + 1;
  return JSON.parse(html.slice(i, j));
};

const q = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const NIVELES = ['staff', 'sen', 'tou', 'nec', 'her', 'des', 'dol', 'emo'];
const out = ['BEGIN;'];
let n = 0;
const id = () => `'00000000-0000-4000-8000-${String(++n).padStart(12, '0')}'`;

const mapas = [
  { id: 'completo', titulo: 'Mapa de experiencia', orden: 0, fases: leer(completo) },
  { id: 'stage', titulo: 'Por stage', orden: 1, fases: leer(stage) },
];

for (const m of mapas) {
  out.push(`INSERT INTO org_mapas (id, titulo, orden) VALUES (${q(m.id)}, ${q(m.titulo)}, ${m.orden});`);
  m.fases.forEach((f, fi) => {
    const faseId = id();
    out.push(`INSERT INTO org_fases (id, mapa_id, nombre, orden) VALUES (${faseId}, ${q(m.id)}, ${q(f.n)}, ${fi});`);
    f.cols.forEach((c, ci) => {
      const espId = id();
      out.push(
        `INSERT INTO org_espacios (id, fase_id, nombre, plano, cerca, orden) VALUES (${espId}, ${faseId}, ${q(c.n)}, ${q(c.pl)}, ${q(c.ce)}, ${ci});`,
      );
      for (const nivel of NIVELES) {
        const v = c[nivel];
        const lista = typeof v === 'string' ? [v] : (v ?? []);
        lista.forEach((texto, oi) => {
          const riesgo = texto.startsWith('⚠');
          out.push(
            `INSERT INTO org_items (espacio_id, nivel, texto, riesgo, orden) VALUES (${espId}, ${q(nivel)}, ${q(texto.replace(/^⚠\s*/, ''))}, ${riesgo}, ${oi});`,
          );
        });
      }
    });
  });
}
out.push('COMMIT;');
console.log(out.join('\n'));
