/**
 * Renderiza los mails institucionales y los empaqueta en UN solo archivo HTML
 * para revisarlos sin levantar nada:
 *
 *   pnpm mails:preview            → ~/Escritorio/mails-manso.html
 *   pnpm mails:preview /otra/ruta.html
 *
 * Cada mail va dentro de un iframe con su HTML embebido (srcdoc), que es la
 * única forma de que los estilos de una pieza no se pisen con los de la de al
 * lado ni con los de la página que las contiene: el mail real también se abre
 * en su propio documento.
 */
import { render } from "react-email";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import Bienvenida from "../emails/institucionales/bienvenida";
import Descuento from "../emails/institucionales/descuento";
import Fecha from "../emails/institucionales/fecha";
import Curso from "../emails/institucionales/curso";
import { SITE, BANNER_PATH, FOOTER_PATH } from "../emails/layout/Institucional";

const UNSUB = "https://mansoclub.com.ar/api/mailing/unsubscribe?email=ejemplo%40mail.com";

// Datos de ejemplo. Cambiar acá para ver cómo responde cada pieza a un texto
// más largo o más corto — es la prueba que importa antes de conectar nada.
const PIEZAS = [
  {
    nombre: "Bienvenida",
    asunto: "Bienvenido a Manso Club",
    cuando: "Al registrarse en la página",
    element: <Bienvenida nombre="Ana" unsubscribeUrl={UNSUB} />,
  },
  {
    nombre: "Descuento",
    asunto: "20% en la tienda, hasta el 31 de agosto",
    cuando: "Cuando el admin activa una promo",
    element: (
      <Descuento
        nombre="Ana"
        codigo="MANSO20"
        beneficio="20%"
        vigencia="31 de agosto"
        unsubscribeUrl={UNSUB}
      />
    ),
  },
  {
    nombre: "Fecha",
    asunto: "Noche de vinilos — Viernes 5 de septiembre",
    cuando: "Cuando el admin marca un evento como promocionado",
    element: (
      <Fecha
        titulo="Noche de vinilos"
        fecha="Viernes 5 de septiembre, 21hs"
        lugar="Manso Club — Av. Siempre Viva 1234"
        descripcion="Tres horas de selección en vinilo, barra abierta hasta las 23 y la terraza a pleno."
        unsubscribeUrl={UNSUB}
      />
    ),
  },
  {
    nombre: "Curso",
    asunto: "Abrió la inscripción: Serigrafía textil",
    cuando: "Cuando el cron detecta un curso próximo en la agenda",
    element: (
      <Curso
        titulo="Serigrafía textil"
        fecha="Arranca el lunes 8 de septiembre"
        horario="Lunes de 18 a 21hs, 4 encuentros"
        docente="Taller Manso"
        descripcion="Desde el revelado del cuadro hasta la estampa final. Se trabaja sobre prenda propia."
        unsubscribeUrl={UNSUB}
      />
    ),
  },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function main() {
  const destino = process.argv[2] ?? join(homedir(), "Escritorio", "mails-manso.html");

  // Banner y footer apuntan a la URL pública, que en un HTML local no
  // resuelve hasta que el asset esté deployado. Para la preview se embeben
  // desde /public en base64: es lo único que se toca del HTML renderizado.
  const embebido = (ruta: string) => ({
    url: `${SITE}${ruta}`,
    dataUri: `data:image/jpeg;base64,${readFileSync(
      join(process.cwd(), "public", ruta)
    ).toString("base64")}`,
  });
  const imagenes = [embebido(BANNER_PATH), embebido(FOOTER_PATH)];

  const renderizadas = await Promise.all(
    PIEZAS.map(async (p) => ({
      ...p,
      html: imagenes.reduce(
        // split/join y no replaceAll: el lib de TS del proyecto es previo a es2021.
        (html, img) => html.split(img.url).join(img.dataUri),
        await render(p.element)
      ),
    }))
  );

  const tabs = renderizadas
    .map(
      (p, i) =>
        `<button class="tab${i === 0 ? " activa" : ""}" data-i="${i}">${esc(p.nombre)}</button>`
    )
    .join("");

  const paneles = renderizadas
    .map(
      (p, i) => `
    <section class="panel${i === 0 ? " activa" : ""}" data-i="${i}">
      <header>
        <div><span class="etiqueta">Asunto</span> ${esc(p.asunto)}</div>
        <div><span class="etiqueta">Se dispara</span> ${esc(p.cuando)}</div>
      </header>
      <iframe srcdoc="${esc(p.html)}" title="${esc(p.nombre)}"></iframe>
    </section>`
    )
    .join("");

  const pagina = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mails institucionales — Manso Club</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #1D1D1B; color: #FFFCDC;
         font: 14px/1.5 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 32px 20px 64px; }
  h1 { font-size: 20px; text-transform: uppercase; letter-spacing: .12em; margin: 0 0 4px; }
  .sub { color: rgba(255,252,220,.5); font-size: 12px; margin: 0 0 24px; }
  .tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
  .tab { background: transparent; color: rgba(255,252,220,.6); cursor: pointer;
         border: 1px solid rgba(255,252,220,.2); border-radius: 999px;
         padding: 8px 18px; font: inherit; font-size: 11px; font-weight: 700;
         text-transform: uppercase; letter-spacing: .1em; }
  .tab.activa { background: #BC2915; border-color: #BC2915; color: #FFFCDC; }
  .panel { display: none; }
  .panel.activa { display: block; }
  header { border: 1px solid rgba(255,252,220,.15); border-bottom: 0;
           border-radius: 12px 12px 0 0; padding: 14px 18px;
           display: grid; gap: 6px; font-size: 13px; }
  .etiqueta { color: rgba(255,252,220,.45); font-size: 10px; text-transform: uppercase;
              letter-spacing: .12em; margin-right: 8px; }
  iframe { width: 100%; height: 720px; border: 1px solid rgba(255,252,220,.15);
           border-radius: 0 0 12px 12px; background: #FFFFFF; display: block; }
  @media (max-width: 640px) { iframe { height: 560px; } }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Mails institucionales</h1>
    <p class="sub">Generado el ${new Date().toLocaleString("es-AR")} · pnpm mails:preview</p>
    <div class="tabs">${tabs}</div>
    ${paneles}
  </div>
<script>
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var i = tab.dataset.i;
      document.querySelectorAll('.tab').forEach(function (t) {
        t.classList.toggle('activa', t.dataset.i === i);
      });
      document.querySelectorAll('.panel').forEach(function (p) {
        p.classList.toggle('activa', p.dataset.i === i);
      });
    });
  });
</script>
</body>
</html>`;

  writeFileSync(destino, pagina, "utf8");
  console.log(`✓ ${renderizadas.length} mails en ${destino}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
