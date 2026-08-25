/**
 * Lógica pura de los datos de transferencia. Va aparte de `getBankConfig`
 * para que el checkout, que es un componente cliente y trae la config por
 * fetch, pueda usarla sin arrastrar los clientes de Supabase.
 */

export interface DatoBancario {
  label: string;
  value: string;
}

/**
 * Un campo de la config cuenta como dato real solo si tiene alguna letra o
 * algún dígito distinto de cero. Los `--------`, `-------` y `0000000000` que
 * quedaron cargados en el panel son relleno, pero son strings no vacíos: con
 * un filtro por truthy pasan y se muestran como si fueran el CBU y el titular
 * de la cuenta.
 */
export const esDatoBancario = (valor?: string) => /[\p{L}1-9]/u.test(valor?.trim() ?? '');

/**
 * Los campos que hay que mostrar en la tarjeta de transferencia, en orden.
 *
 * Sin un CBU cargado no se puede transferir por datos de cuenta, así que lo
 * único que le sirve a quien paga es el alias: banco, titular y CUIT sueltos
 * solo llenan la tarjeta con información que no lleva a ningún lado. Por eso
 * cuando falta el CBU se devuelve el alias y nada más.
 *
 * Si tampoco hay alias, la lista vuelve vacía y la pantalla no dibuja la
 * tarjeta: es preferible mandar a la persona por WhatsApp que mostrarle un
 * recuadro vacío titulado "Datos para transferencia".
 */
export function datosParaTransferencia(bank: Record<string, string | undefined>): DatoBancario[] {
  const dato = (key: string) => (esDatoBancario(bank[key]) ? bank[key]!.trim() : '');

  const cbu = dato('banco_cbu');
  const alias = dato('banco_alias');

  if (!cbu) return alias ? [{ label: 'Alias', value: alias }] : [];

  return [
    { label: 'Banco', value: dato('banco_nombre') },
    { label: 'Titular', value: dato('banco_titular') },
    { label: 'CUIT', value: dato('banco_cuit') },
    { label: 'CBU', value: cbu },
    { label: 'Alias', value: alias },
  ].filter(({ value }) => value);
}
