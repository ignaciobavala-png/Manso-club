// Genera el SQL para cargar en /org el HTML "Plan de Tareas por Zona".
//
//   node scripts/org-importar-tareas.mjs <plan-de-tareas.html> > seed_tareas.sql
//
// El HTML trae los datos en `const DATA=[...]` (JSON válido): una lista de
// zonas, cada una con sus tareas {a: área, t: texto, p: prioridad}. Se corre una
// vez; después las tareas viven en la base y se editan desde /org.
import { readFileSync } from 'node:fs';

const ruta = process.argv[2];
if (!ruta) {
  console.error('Uso: node scripts/org-importar-tareas.mjs <plan-de-tareas.html>');
  process.exit(1);
}
const html = readFileSync(ruta, 'utf8');
const i = html.indexOf('const DATA=') + 'const DATA='.length;
const datos = JSON.parse(html.slice(i, html.indexOf(';\nconst AREAS', i)));

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const out = ['BEGIN;'];
datos.forEach((z, zi) =>
  z.t.forEach((t, ti) =>
    out.push(
      `INSERT INTO org_tareas (zona, zona_orden, area, texto, prioridad, orden) VALUES (${q(z.z)}, ${zi}, ${q(t.a)}, ${q(t.t)}, ${q(t.p)}, ${ti});`,
    ),
  ),
);
out.push('COMMIT;');
console.log(out.join('\n'));
