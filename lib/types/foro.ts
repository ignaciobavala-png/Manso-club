export interface ForoCategoria {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  orden: number
  activo: boolean
}

export interface ForoThread {
  id: string
  titulo: string
  cuerpo: string
  categoria_id: string | null
  autor_id: string
  autor_nombre: string | null
  autor_avatar: string | null
  pinned: boolean
  cerrado: boolean
  views: number
  reply_count: number
  created_at: string
  updated_at: string
}

export interface ForoThreadConCategoria extends ForoThread {
  categoria: Pick<ForoCategoria, 'nombre' | 'slug'> | null
}

export interface ForoReaccion {
  emoji: string
  autor_id: string
  thread_id: string | null
  reply_id: string | null
}

export interface ForoReply {
  id: string
  thread_id: string
  cuerpo: string
  autor_id: string
  autor_nombre: string | null
  autor_avatar: string | null
  created_at: string
  updated_at: string
}
