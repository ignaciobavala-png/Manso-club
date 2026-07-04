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

export type BloqueMailing =
  | { tipo: "imagen"; url: string; alt?: string }
  | { tipo: "boton"; texto: string; link: string; color?: string; separacion?: Separacion }
  | { tipo: "texto"; contenido: string };

interface CampaniaGenericaProps {
  asunto: string;
  bloques: BloqueMailing[];
}

export default function CampaniaGenerica({ asunto, bloques }: CampaniaGenericaProps) {
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
        </Container>
      </Body>
    </Html>
  );
}
