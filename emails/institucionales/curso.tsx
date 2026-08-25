import React from "react";
import { Institucional, Titulo, Parrafo, Ficha, Boton, SITE } from "../layout/Institucional";

export interface CursoProps {
  titulo: string;
  /** Ya formateada ("Arranca el lunes 8 de septiembre"). */
  fecha: string;
  horario: string;
  docente?: string;
  descripcion?: string;
  inscripcionUrl?: string;
  unsubscribeUrl?: string;
}

export default function Curso({
  titulo,
  fecha,
  horario,
  docente,
  descripcion,
  inscripcionUrl,
  unsubscribeUrl,
}: CursoProps) {
  const items = [
    { label: "Cuándo", valor: fecha },
    { label: "Horario", valor: horario },
    ...(docente ? [{ label: "A cargo de", valor: docente }] : []),
  ];
  return (
    <Institucional preheader={`${titulo} — ${fecha}`} unsubscribeUrl={unsubscribeUrl}>
      <Titulo>{titulo}</Titulo>
      <Parrafo>Se abrió la inscripción. Los cupos son limitados.</Parrafo>
      <Ficha items={items} />
      {descripcion && <Parrafo>{descripcion}</Parrafo>}
      <Boton href={inscripcionUrl ?? `${SITE}/agenda`}>Inscribirme</Boton>
    </Institucional>
  );
}
