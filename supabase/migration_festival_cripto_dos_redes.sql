-- Cripto en dos redes: USDT en Ethereum (ERC20) y en BNB Smart Chain (BEP20).
--
-- Antes se ofrecían Tron, BSC, Polygon y Base con USDT y USDC. Ana pidió una
-- sola forma de pagar para no marear a la gente: USDT, y solo en las dos redes
-- que cubren a Bitso (saca USDT por ERC20, no por BEP20) y a Lemon (BEP20, la
-- más barata). Al momento del cambio ninguna orden había elegido red.

ALTER TABLE festival_ordenes DROP CONSTRAINT IF EXISTS festival_ordenes_red_check;
ALTER TABLE festival_ordenes ADD CONSTRAINT festival_ordenes_red_check CHECK (red IN ('ethereum', 'bsc'));

DELETE FROM festival_cripto_redes WHERE red NOT IN ('ethereum', 'bsc');
INSERT INTO festival_cripto_redes (red) VALUES ('ethereum'), ('bsc')
ON CONFLICT (red) DO NOTHING;
