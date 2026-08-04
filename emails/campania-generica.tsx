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
import { esFondoOscuro } from "../lib/email-colores";

type Separacion = "pegado" | "poco" | "normal" | "mucho";

const PX_POR_SEPARACION: Record<Separacion, number> = {
  pegado: 0,
  poco: 10,
  normal: 20,
  mucho: 40,
};

/** Redondeo del botón. "pastilla" son los bordes completamente redondos. */
type RadioBoton = "recto" | "poco" | "redondeado" | "pastilla";

const PX_POR_RADIO: Record<RadioBoton, number> = {
  recto: 0,
  poco: 6,
  redondeado: 14,
  pastilla: 999,
};

/**
 * Tamaño de los ítems del bloque de redes. Escala nombrada y no un número
 * libre: el ancho útil del mail son 600px y una fila de 5 íconos a mano alzada
 * se desborda enseguida. `gap` acompaña al ícono para que la fila no quede
 * apretada al agrandarlo.
 *
 * El tope es 56px porque los íconos se suben a ~120px (ver la ayuda del
 * editor) y hay que dejar margen para que se vean nítidos en pantallas retina,
 * que los piden al doble.
 */
type TamanoRed = "chico" | "normal" | "grande" | "gigante";

const TAMANO_RED: Record<TamanoRed, { icono: number; fuente: number; gap: number }> = {
  chico:   { icono: 22, fuente: 11, gap: 6 },
  normal:  { icono: 28, fuente: 13, gap: 8 },
  grande:  { icono: 40, fuente: 16, gap: 10 },
  gigante: { icono: 56, fuente: 20, gap: 14 },
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
  | {
      tipo: "boton";
      texto: string;
      link: string;
      color?: string;
      /** Color del texto del botón. Default: manso-cream. */
      colorTexto?: string;
      /** Redondeo de las esquinas. Default: "poco" (6px). */
      radio?: RadioBoton;
      separacion?: Separacion;
    }
  | { tipo: "texto"; contenido: string }
  | { tipo: "canvas"; url: string; alt?: string; hotspots: Hotspot[] }
  | { tipo: "canvas-procesado"; rows: SliceRow[]; alt?: string }
  | {
      tipo: "redes";
      items: ItemRed[];
      /** "iconos" dibuja la imagen de cada ítem; "texto" dibuja su etiqueta. */
      modo?: "iconos" | "texto";
      /** Tamaño de los íconos y de la letra. Default: "normal" (28px). */
      tamano?: TamanoRed;
      /**
       * Color de la etiqueta en modo "texto". Sin esto se usa el color del pie,
       * que se deduce de la luminancia del fondo: sirve como default pero deja
       * sin salida a un mail cuyo arte tiene un color de marca distinto.
       */
      colorTexto?: string;
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
              const escala = TAMANO_RED[bloque.tamano ?? "normal"];
              const colorEtiqueta = bloque.colorTexto?.trim() || colorPie;

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
                          <td key={n} style={{ padding: `0 ${escala.gap}px`, verticalAlign: "middle" }}>
                            <a
                              href={it.link.trim()}
                              target="_blank"
                              style={{
                                color: colorEtiqueta,
                                textDecoration: porIconos ? "none" : "underline",
                                fontSize: `${escala.fuente}px`,
                              }}
                            >
                              {porIconos && it.icono ? (
                                <img
                                  src={it.icono}
                                  alt={it.etiqueta}
                                  width={escala.icono}
                                  height={escala.icono}
                                  style={{
                                    display: "block",
                                    border: 0,
                                    width: `${escala.icono}px`,
                                    height: `${escala.icono}px`,
                                  }}
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
                      color: bloque.colorTexto ?? "#FFFCDC",
                      padding: "12px 32px",
                      borderRadius: `${PX_POR_RADIO[bloque.radio ?? "poco"]}px`,
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
