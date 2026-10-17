export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  role: UserRole;
  organizacion: string;
  cip?: string;
  telefono?: string;
  cargo?: string;
  avatar?: string;
  createdAt: string;
}

export interface RegisteredUserRecord extends UserProfile {
  password?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

