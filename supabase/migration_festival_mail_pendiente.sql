-- Festival: mail de "pago pendiente" en cripto.
--
-- Quien paga en cripto sale del sitio a su exchange (Lemon, Binance, Bitso) y
-- al volver puede no encontrar la pantalla de pago. Al elegir la red por
-- primera vez se le manda un mail con el monto, la dirección y el link de
-- vuelta a /blur/compra/[id].
--
--   mail_pendiente_enviado  se reclama con un UPDATE condicionado antes de
--                           mandar, así que es un mail por orden aunque la
--                           persona cambie de red o dos pedidos coincidan
--                           (Resend free: 100/día). Si Resend falla se libera.
--
-- Aditiva y con default: las órdenes existentes quedan en false, pero el mail
-- solo se dispara al elegir red, no las recorre.

ALTER TABLE festival_ordenes
  ADD COLUMN IF NOT EXISTS mail_pendiente_enviado BOOLEAN NOT NULL DEFAULT false;
