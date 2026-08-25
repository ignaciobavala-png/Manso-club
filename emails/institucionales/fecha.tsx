import React from "react";
import { Institucional, Titulo, Parrafo, Ficha, Boton, SITE } from "../layout/Institucional";

export interface FechaProps {
  /** Nombre del evento. */
  titulo: string;
  /** Ya formateada ("Viernes 5 de septiembre, 21hs"). */
  fecha: string;
  lugar: string;
  /** Bajada opcional que carga el admin en el panel. */
  descripcion?: string;
  entradasUrl?: string;
  unsubscribeUrl?: string;
}

export default function Fecha({
  titulo,
  fecha,
  lugar,
  descripcion,
  entradasUrl,
  unsubscribeUrl,
}: FechaProps) {
  return (
    <Institucional preheader={`${titulo} — ${fecha}`} unsubscribeUrl={unsubscribeUrl}>
      <Titulo>{titulo}</Titulo>
      <Ficha items={[{ label: "Cuándo", valor: fecha }, { label: "Dónde", valor: lugar }]} />
      {descripcion && <Parrafo>{descripcion}</Parrafo>}
      <Boton href={entradasUrl ?? `${SITE}/agenda`}>Sacar entrada</Boton>
    </Institucional>
  );
}
