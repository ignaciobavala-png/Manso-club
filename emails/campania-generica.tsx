import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";

type Separacion = "pegado" | "poco" | "normal" | "mucho";

const PX_POR_SEPARACION: Record<Separacion, number> = {
  pegado: 0,
  poco: 10,
  normal: 20,
  mucho: 40,
};

// Zona clickeable dibujada por la diseñadora sobre la imagen (coords en %)
export type Hotspot = { x: number; y: number; w: number; h: number; link: string };

// Rebanadas generadas al enviar (ver lib/email-canvas.ts). `colspan` ubica la
// celda dentro de la grilla maestra de columnas compartida por todas las filas.
export type SliceCell = {
  url: string;
  width: number;
  link: string | null;
  colspan?: number;
  /** Color promedio de la rebanada; pinta el <td> para tapar costuras de 1px. */
  bg?: string;
};
export type SliceRow = { cells: SliceCell[] };

export type BloqueMailing =
  | { tipo: "imagen"; url: string; alt?: string }
  | { tipo: "boton"; texto: string; link: string; color?: string; separacion?: Separacion }
  | { tipo: "texto"; contenido: string }
  | { tipo: "canvas"; url: string; alt?: string; hotspots: Hotspot[] }
  | { tipo: "canvas-procesado"; rows: SliceRow[]; alt?: string }
  | {
      tipo: "redes";
      items: ItemRed[];
      /** "iconos" dibuja la imagen de cada ítem; "texto" dibuja su etiqueta. */
      modo?: "iconos" | "texto";
      separacion?: Separacion;
    };

/** Un link del pie: red social, web o contacto. */
export type ItemRed = { etiqueta: string; link: string; icono?: string };

interface CampaniaGenericaProps {
  asunto: string;
  bloques: BloqueMailing[];
  unsubscribeUrl: string;
  /** Fondo del mail (marco alrededor del arte). Default: manso-cream. */
  colorFondo?: string;
  /** Texto de vista previa que la casilla muestra al lado del asunto. Fallback: asunto. */
  preheader?: string;
}

const FONDO_DEFAULT = "#FFFCDC";

/** Luminancia percibida: decide si el texto del pie va claro u oscuro. */
function esFondoOscuro(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

const imgSliceStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
  border: 0,
};

export default function CampaniaGenerica({ asunto, bloques, unsubscribeUrl, colorFondo, preheader }: CampaniaGenericaProps) {
  const fondo = colorFondo?.trim() || FONDO_DEFAULT;
  const colorPie = esFondoOscuro(fondo) ? "#FFFCDC" : "#1D1D1B";
  return (
    <Html>
      <Head />
      <Preview>{preheader?.trim() || asunto}</Preview>
      {/* El fondo va también en una tabla al 100% (bgcolor + style): varios
          clientes móviles (Gmail app entre ellos) ignoran el background del
          <body>, y sin esto el marco y el pie quedaban blancos en celular. */}
      <Body style={{ backgroundColor: fondo, fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          bgcolor={fondo}
          style={{ backgroundColor: fondo, width: "100%" }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: 0 }}>
        <Container style={{ maxWidth: "600px", padding: "0", backgroundColor: fondo }}>
          {bloques.map((bloque, i) => {
            if (bloque.tipo === "imagen") {
              return (
                <Img
                  key={i}
                  src={bloque.url}
                  alt={bloque.alt ?? ""}
                  width="600"
                  style={{ display: "block", width: "100%" }}
                />
              );
            }
            // Canvas sin procesar (preview / fallback): imagen entera sin links
            if (bloque.tipo === "canvas") {
              return (
                <Img
                  key={i}
                  src={bloque.url}
                  alt={bloque.alt ?? ""}
                  width="600"
                  style={{ display: "block", width: "100%" }}
                />
              );
            }
            // Canvas procesado: la imagen rebanada, con las zonas marcadas
            // envueltas en <a>. Una ÚNICA tabla con grilla de columnas
            // compartida (colspan): si cada franja fuera su propia tabla, el
            // cliente las escala y redondea por separado en el celular y
            // aparecen líneas finas entre filas.
            if (bloque.tipo === "canvas-procesado") {
              return (
                <table
                  key={i}
                  width="600"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  role="presentation"
                  style={{ borderCollapse: "collapse", width: "100%", maxWidth: "600px" }}
                >
                  <tbody>
                    {bloque.rows.map((row, r) => (
                      <tr key={r}>
                        {row.cells.map((cell, c) => (
                          <td
                            key={c}
                            width={cell.width}
                            colSpan={cell.colspan ?? 1}
                            // bgcolor (atributo legacy) además del style: Outlook
                            // ignora backgroundColor en <td> en varios modos.
                            // Va por spread porque no está en los tipos de React.
                            {...{ bgcolor: cell.bg }}
                            style={{
                              padding: 0,
                              lineHeight: 0,
                              fontSize: 0,
                              verticalAlign: "top",
                              backgroundColor: cell.bg,
                            }}
                          >
                            {cell.link ? (
                              <a href={cell.link} target="_blank" style={{ display: "block" }}>
                                <img
                                  src={cell.url}
                                  width={cell.width}
                                  alt={bloque.alt ?? ""}
                                  style={imgSliceStyle}
                                />
                              </a>
                            ) : (
                              <img
                                src={cell.url}
                                width={cell.width}
                                alt=""
                                style={imgSliceStyle}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            }
            // Fila de links (redes, web, contacto). Cada ítem es su propia
            // imagen con su propio <a>, así que NO hace falta recortar nada:
            // el recorte solo es necesario cuando varios links viven dentro de
            // una misma pieza gráfica. Sin recorte no hay costuras posibles.
            //
            // Va como tabla y no como flex/inline-block: Outlook ignora ambos y
            // apilaría los iconos uno debajo del otro.
            if (bloque.tipo === "redes") {
              const items = bloque.items.filter((it) => it.link.trim());
              if (items.length === 0) return null;
              const px = PX_POR_SEPARACION[bloque.separacion ?? "normal"];
              const porIconos = (bloque.modo ?? "iconos") === "iconos";

              return (
                <Section key={i} style={{ padding: `${px}px 20px` }}>
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    align="center"
                    style={{ margin: "0 auto", borderCollapse: "collapse" }}
                  >
                    <tbody>
                      <tr>
                        {items.map((it, n) => (
                          <td key={n} style={{ padding: "0 8px", verticalAlign: "middle" }}>
                            <a
                              href={it.link.trim()}
                              target="_blank"
                              style={{
                                color: colorPie,
                                textDecoration: porIconos ? "none" : "underline",
                                fontSize: "13px",
                              }}
                            >
                              {porIconos && it.icono ? (
                                <img
                                  src={it.icono}
                                  alt={it.etiqueta}
                                  width="28"
                                  height="28"
                                  style={{ display: "block", border: 0, width: "28px", height: "28px" }}
                                />
                              ) : (
                                it.etiqueta
                              )}
                            </a>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </Section>
              );
            }
            if (bloque.tipo === "boton") {
              const px = PX_POR_SEPARACION[bloque.separacion ?? "normal"];
              return (
                <Section key={i} style={{ padding: `${px}px 0`, textAlign: "center" }}>
                  <Button
                    href={bloque.link}
                    style={{
                      background: bloque.color ?? "#BC2915",
                      color: "#FFFCDC",
                      padding: "12px 32px",
                      borderRadius: "6px",
                      fontSize: "16px",
                    }}
                  >
                    {bloque.texto}
                  </Button>
                </Section>
              );
            }
            // Un <Text> por párrafo: en un solo bloque los saltos de línea se
            // colapsan y el texto queda en un chorizo corrido.
            return (
              <Section key={i} style={{ padding: "10px 20px" }}>
                {bloque.contenido
                  .split(/\n{2,}/)
                  .map((parrafo) => parrafo.trim())
                  .filter(Boolean)
                  .map((parrafo, p) => (
                    <Text key={p} style={{ color: colorPie, fontSize: "16px", lineHeight: "1.5" }}>
                      {parrafo.split("\n").map((linea, l, todas) => (
                        <React.Fragment key={l}>
                          {linea}
                          {l < todas.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </Text>
                  ))}
              </Section>
            );
          })}
          <Section style={{ padding: "20px", textAlign: "center" }}>
            <Text style={{ color: colorPie, fontSize: "11px", opacity: 0.6 }}>
              Recibiste este mail porque estás suscripto a Manso Club.{" "}
              <a href={unsubscribeUrl} style={{ color: colorPie, textDecoration: "underline" }}>
                Darme de baja
              </a>
            </Text>
          </Section>
        </Container>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}
