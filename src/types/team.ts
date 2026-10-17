export interface TeamMember {
  id: string;
  nombre: string;
  cargo: string;
  especialidad: string;
  colegiatura?: string;
  avatar: string;
  cvUrl?: string;
  linkedinUrl?: string;
  email?: string;
  telefono?: string;
  resumen: string;
  areas: string[];
  destacado?: boolean;
}
