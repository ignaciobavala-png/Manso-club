export type TipoSala = 'general' | 'dm' | 'publica' | 'privada'

export interface ChatSala {
  id: string
  tipo: TipoSala
  nombre: string | null
  descripcion: string | null
  retencion_dias: number | null
  creada_por: string | null
}

export interface ChatMensaje {
  id: string
  sala_id: string
  autor_id: string
  autor_nombre: string | null
  cuerpo: string
  created_at: string
  responde_a: string | null
  /** Solo en el cliente: el mensaje todavía no confirmó el servidor, o falló. */
  estado?: 'enviando' | 'error'
}

export interface ChatReaccion {
  mensaje_id: string
  user_id: string
  emoji: string
}

export interface ChatConversacion {
  sala: ChatSala
  /** En un DM, la otra persona; en el resto, null. */
  otro: { id: string; nombre: string; avatar: string | null } | null
  ultimo: { cuerpo: string; autor_nombre: string | null; created_at: string } | null
}

/** Fila de chat_admin_salas() */
export interface ChatSalaAdmin {
  id: string
  tipo: TipoSala
  nombre: string
  descripcion: string | null
  retencion_dias: number | null
  created_at: string
  clave: string | null
  miembros: number
  mensajes: number
}
