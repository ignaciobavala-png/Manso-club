import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

interface BienvenidaEmailProps {
  nombre: string;
}

export default function BienvenidaEmail({ nombre }: BienvenidaEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a Manso Club</Preview>
      <Body style={{ backgroundColor: "#FFFCDC", fontFamily: "sans-serif", margin: 0 }}>
        <Container style={{ padding: "40px 20px", maxWidth: "560px" }}>
          <Heading style={{ color: "#1D1D1B" }}>Bienvenido, {nombre}</Heading>
          <Text style={{ color: "#1D1D1B", fontSize: "16px" }}>
            Ya sos parte de Manso Club. Pronto vas a recibir novedades de eventos,
            artistas y contenido exclusivo de la comunidad.
          </Text>
          <Section style={{ padding: "20px 0", textAlign: "center" }}>
            <Button
              href="https://mansoclub.com.ar"
              style={{
                background: "#BC2915",
                color: "#FFFCDC",
                padding: "12px 32px",
                borderRadius: "6px",
                fontSize: "16px",
              }}
            >
              Ir a Manso Club
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
