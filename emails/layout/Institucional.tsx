import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";

/**
 * Layout de los mails institucionales.
 *
 * A diferencia de `campania-generica`, que arma la pieza a partir de los
 * bloques que el admin dibuja en el panel, acá el diseño está cerrado: pieza
 * negra sobre página blanca, 560px de ancho, banner arriba, footer abajo y
 * botón blanco. Los templates que lo usan solo aportan texto y un CTA, y por
 * eso salen de ~15 líneas. Si cambia la identidad, se toca este archivo y no
 * cuatro.
 */

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mansoclub.com.ar";

/** Banner de cabecera, servido desde /public. El script de preview reemplaza
 *  esta ruta por el archivo local en base64 para poder verlo sin publicar. */
export const BANNER_PATH = "/assets/emails/banner-manso.jpg";

/** Cierre de la pieza. Mismo tratamiento que el banner. */
export const FOOTER_PATH = "/assets/emails/footer-manso.jpg";

const COLORES = {
  /** La página que rodea a la pieza. Blanca: es también el fondo que ponen
   *  varios clientes cuando no reconocen el color del body. */
  pagina: "#FFFFFF",
  /** El cuerpo del mail. */
  fondo: "#1D1D1B", // manso-black
  texto: "#FFFCDC", // manso-cream
  textoTenue: "rgba(255,252,220,0.6)",
  acento: "#BC2915", // manso-terra
  boton: "#FFFFFF",
  botonTexto: "#1D1D1B",
} as const;

const FUENTE =
  "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface InstitucionalProps {
  /** Línea que asoma en la bandeja al lado del asunto. */
  preheader: string;
  /** Link de baja. Sin él el mail no debería salir a una lista. */
  unsubscribeUrl?: string;
  children: React.ReactNode;
}

export function Institucional({ preheader, unsubscribeUrl, children }: InstitucionalProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preheader}</Preview>
      <Body
        style={{
          backgroundColor: COLORES.pagina,
          fontFamily: FUENTE,
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            padding: "40px 24px",
            backgroundColor: COLORES.fondo,
          }}
        >
          {/* Banner de cabecera. Se sirve al doble del ancho útil (1120px para
              512 de contenido) porque las pantallas retina lo escalan y a 1x
              se ve el degradé sucio. El alto va explícito: Outlook no calcula
              el alto de una imagen con height:auto y reserva de más. */}
          <Section style={{ paddingBottom: "32px" }}>
            <Img
              src={`${SITE}${BANNER_PATH}`}
              alt="Manso Club"
              width="512"
              height="140"
              style={{ display: "block", width: "100%", maxWidth: "512px", height: "auto" }}
            />
          </Section>

          {children}

          <Section style={{ paddingTop: "40px" }}>
            <Img
              src={`${SITE}${FOOTER_PATH}`}
              alt="Manso Club — Cowork · Cultura · Comunidad"
              width="512"
              height="140"
              style={{ display: "block", width: "100%", maxWidth: "512px", height: "auto" }}
            />
          </Section>

          {/* La baja va como texto real y no dentro del footer dibujado: un
              unsubscribe que solo existe en la imagen no es clickeable, no lo
              leen los filtros anti-spam y para Gmail equivale a no tenerlo. */}
          <Text
            style={{
              color: COLORES.textoTenue,
              fontSize: "12px",
              lineHeight: "18px",
              margin: "16px 0 0",
              textAlign: "center",
            }}
          >
            <Link href={SITE} style={{ color: COLORES.textoTenue }}>
              mansoclub.com.ar
            </Link>
            {unsubscribeUrl && (
              <>
                {" · "}
                <Link href={unsubscribeUrl} style={{ color: COLORES.textoTenue }}>
                  Darme de baja
                </Link>
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/** Título del mail. Uno solo por pieza. */
export function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        color: COLORES.texto,
        fontSize: "28px",
        lineHeight: "34px",
        fontWeight: 700,
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

export function Parrafo({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        color: COLORES.texto,
        fontSize: "16px",
        lineHeight: "26px",
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

/**
 * Ficha de datos (fecha, lugar, horario). Va como texto y no como tabla:
 * en la app de Gmail una tabla de dos columnas a 560px se rompe y termina
 * mostrando la etiqueta y el valor en renglones separados igual.
 */
export function Ficha({ items }: { items: { label: string; valor: string }[] }) {
  return (
    <Section
      style={{
        backgroundColor: "rgba(255,252,220,0.06)",
        borderLeft: `3px solid ${COLORES.acento}`,
        padding: "16px 20px",
        margin: "0 0 24px",
      }}
    >
      {items.map((item) => (
        <Text
          key={item.label}
          style={{ color: COLORES.texto, fontSize: "15px", lineHeight: "24px", margin: 0 }}
        >
          <strong style={{ textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.1em" }}>
            {item.label}
          </strong>
          <br />
          {item.valor}
        </Text>
      ))}
    </Section>
  );
}

/** Código de descuento, en grande y seleccionable. */
export function Codigo({ children }: { children: React.ReactNode }) {
  return (
    <Section
      style={{
        border: `2px dashed ${COLORES.acento}`,
        padding: "20px",
        textAlign: "center",
        margin: "0 0 24px",
      }}
    >
      <Text
        style={{
          color: COLORES.texto,
          fontSize: "26px",
          lineHeight: "32px",
          fontWeight: 700,
          letterSpacing: "0.15em",
          margin: 0,
        }}
      >
        {children}
      </Text>
    </Section>
  );
}

export function Boton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ padding: "8px 0 8px" }}>
      <Button
        href={href}
        style={{
          backgroundColor: COLORES.boton,
          color: COLORES.botonTexto,
          fontSize: "14px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          padding: "14px 32px",
          borderRadius: "999px",
          textDecoration: "none",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}
