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

// Rebanadas generadas al enviar (ver lib/email-canvas.ts)
export type SliceCell = { url: string; width: number; link: string | null };
export type SliceRow = { cells: SliceCell[] };

export type BloqueMailing =
  | { tipo: "imagen"; url: string; alt?: string }
  | { tipo: "boton"; texto: string; link: string; color?: string; separacion?: Separacion }
  | { tipo: "texto"; contenido: string }
  | { tipo: "canvas"; url: string; alt?: string; hotspots: Hotspot[] }
  | { tipo: "canvas-procesado"; rows: SliceRow[]; alt?: string };

interface CampaniaGenericaProps {
  asunto: string;
  bloques: BloqueMailing[];
  unsubscribeUrl: string;
}

const imgSliceStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
  border: 0,
};

export default function CampaniaGenerica({ asunto, bloques, unsubscribeUrl }: CampaniaGenericaProps) {
  return (
    <Html>
      <Head />
      <Preview>{asunto}</Preview>
      <Body style={{ backgroundColor: "#FFFCDC", fontFamily: "sans-serif", margin: 0 }}>
        <Container style={{ maxWidth: "600px", padding: "0" }}>
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
            // Canvas procesado: la imagen rebanada en tablas, con las zonas
            // marcadas envueltas en <a>. Una tabla por franja evita desalinear
            // columnas entre filas con distinta cantidad de celdas.
            if (bloque.tipo === "canvas-procesado") {
              return (
                <Section key={i} style={{ padding: 0 }}>
                  {bloque.rows.map((row, r) => (
                    <table
                      key={r}
                      width="600"
                      cellPadding={0}
                      cellSpacing={0}
                      border={0}
                      role="presentation"
                      style={{ borderCollapse: "collapse", width: "100%", maxWidth: "600px" }}
                    >
                      <tbody>
                        <tr>
                          {row.cells.map((cell, c) => (
                            <td
                              key={c}
                              width={cell.width}
                              style={{ padding: 0, lineHeight: 0, fontSize: 0 }}
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
                      </tbody>
                    </table>
                  ))}
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
            return (
              <Section key={i} style={{ padding: "10px 20px" }}>
                <Text style={{ color: "#1D1D1B", fontSize: "16px" }}>{bloque.contenido}</Text>
              </Section>
            );
          })}
          <Section style={{ padding: "20px", textAlign: "center" }}>
            <Text style={{ color: "#1D1D1B", fontSize: "11px", opacity: 0.6 }}>
              Recibiste este mail porque estás suscripto a Manso Club.{" "}
              <a href={unsubscribeUrl} style={{ color: "#1D1D1B", textDecoration: "underline" }}>
                Darme de baja
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
