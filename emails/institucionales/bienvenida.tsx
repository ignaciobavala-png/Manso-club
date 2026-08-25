import React from "react";
import { Institucional, Titulo, Parrafo, Boton, SITE } from "../layout/Institucional";

export interface BienvenidaProps {
  nombre: string;
  unsubscribeUrl?: string;
}

export default function Bienvenida({ nombre, unsubscribeUrl }: BienvenidaProps) {
  return (
    <Institucional preheader="Ya sos parte de Manso Club" unsubscribeUrl={unsubscribeUrl}>
      <Titulo>Bienvenido, {nombre}</Titulo>
      <Parrafo>
        Ya sos parte de Manso Club. Desde acá te vamos a estar avisando de las fechas,
        los cursos y lo que pasa en la casa.
      </Parrafo>
      <Parrafo>
        Si querés arrancar por algún lado, mirá la agenda: siempre hay algo dando vueltas.
      </Parrafo>
      <Boton href={`${SITE}/agenda`}>Ver la agenda</Boton>
    </Institucional>
  );
}
