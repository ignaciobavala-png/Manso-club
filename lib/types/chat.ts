export interface ChatSala {
  id: string
  tipo: 'general' | 'dm'
  nombre: string | null
}

export interface ChatMensaje {
  id: string
  sala_id: string
  autor_id: string
  autor_nombre: string | null
  cuerpo: string
  created_at: string
}

export interface ChatConversacion {
  sala: ChatSala
  // En un DM, la otra persona; en la sala general, null.
  otro: { id: string; nombre: string; avatar: string | null } | null
}
