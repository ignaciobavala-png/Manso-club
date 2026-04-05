export interface Membresia {
  id: string;
  nombre: string;
  precio: number;
  periodo: 'mes' | 'año';
  descripcion: string;
  destacado: boolean;
  activo: boolean;
  orden: number;
  categoria: string;
  created_at: string;
  updated_at: string;
  membresia_beneficios?: MembresiaBeneficio[];
}

export interface MembresiaBeneficio {
  id: string;
  membresia_id: string;
  texto: string;
  incluido: boolean;
  orden: number;
}

export interface MembresiaForm {
  nombre: string;
  precio: number | string;
  periodo: 'mes' | 'año';
  descripcion: string;
  destacado: boolean;
  activo: boolean;
  orden: number | string;
  categoria: string;
  beneficios: MembresiaBeneficio[];
}
