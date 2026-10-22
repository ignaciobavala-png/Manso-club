/** Mismos emojis que permite el CHECK de chat_reacciones: si se cambian acá, cambiarlos allá. */
export const REACCIONES = ['👍', '🔥', '😂', '🙌', '👀', '💜'] as const

const TZ = 'America/Argentina/Buenos_Aires'

export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })

const diaClave = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ })

/** "Hoy", "Ayer" o "22 de octubre" */
export function etiquetaDia(iso: string): string {
  const d = new Date(iso)
  const hoy = new Date()
  const ayer = new Date(hoy.getTime() - 86_400_000)
  if (diaClave(d) === diaClave(hoy)) return 'Hoy'
  if (diaClave(d) === diaClave(ayer)) return 'Ayer'
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: TZ })
}

export const mismoDia = (a: string, b: string) => diaClave(new Date(a)) === diaClave(new Date(b))

/** Hora si es de hoy; si no, "ayer" o día/mes. Para la lista de conversaciones. */
export function fechaCorta(iso: string): string {
  const d = new Date(iso)
  const e = etiquetaDia(iso)
  if (e === 'Hoy') return hora(iso)
  if (e === 'Ayer') return 'Ayer'
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: TZ })
}

/** Clave de sala en grupos de 4 para leerla y dictarla: "MANSO2026ABCD" → "MANS-O202-6ABC-D" */
export const formatearClave = (clave: string) => clave.replace(/(.{4})(?=.)/g, '$1-')

const RE_URL = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g

export type Trozo = { texto: string; url?: string }

/** Parte un mensaje en texto y links. Solo http/https: nada de javascript: ni data:. */
export function trocear(texto: string): Trozo[] {
  const partes = texto.split(RE_URL)
  return partes
    .map((p, i) => (i % 2 === 1 ? { texto: p, url: p } : { texto: p }))
    .filter(t => t.texto !== '')
}

const COLORES_NOMBRE = ['text-[#ff8a6b]', 'text-[#c9c34a]', 'text-[#8fa2ff]', 'text-[#7fd6c2]'] as const
const COLORES_AVATAR = ['bg-manso-terra', 'bg-manso-blue', 'bg-manso-brown', 'bg-manso-olive'] as const

function indiceDe(semilla: string, n: number) {
  let h = 0
  for (let i = 0; i < semilla.length; i++) h = (h * 31 + semilla.charCodeAt(i)) >>> 0
  return h % n
}

export const colorNombre = (id: string) => COLORES_NOMBRE[indiceDe(id, COLORES_NOMBRE.length)]
export const colorAvatar = (id: string) => COLORES_AVATAR[indiceDe(id, COLORES_AVATAR.length)]
