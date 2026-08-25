import React from "react";
import { Institucional, Titulo, Parrafo, Codigo, Boton, SITE } from "../layout/Institucional";

export interface DescuentoProps {
  nombre: string;
  /** Código que se pega en el checkout. */
  codigo: string;
  /** Texto libre: "20%", "2x1", "$5.000". */
  beneficio: string;
  /** Hasta cuándo vale, ya formateado ("31 de agosto"). */
  vigencia: string;
  destinoUrl?: string;
  unsubscribeUrl?: string;
}

export default function Descuento({
  nombre,
  codigo,
  beneficio,
  vigencia,
  destinoUrl,
  unsubscribeUrl,
}: DescuentoProps) {
  return (
    <Institucional preheader={`${beneficio} de descuento en Manso Club`} unsubscribeUrl={unsubscribeUrl}>
      <Titulo>{beneficio} para vos, {nombre}</Titulo>
      <Parrafo>
        Usá este código al momento de pagar y el descuento se aplica solo.
        Vale hasta el {vigencia}.
      </Parrafo>
      <Codigo>{codigo}</Codigo>
      <Boton href={destinoUrl ?? `${SITE}/tienda`}>Usar el descuento</Boton>
    </Institucional>
  );
}
