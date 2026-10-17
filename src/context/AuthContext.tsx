import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, RegisteredUserRecord } from '../types/auth';

const DEFAULT_LOGO_URL = '/logo_transparent.png';

export const DEFAULT_VIDEO_URL =
  'https://res.cloudinary.com/h5daploe/video/upload/v1790782827/PMMRS_fondo_web_10s.mp4';

export const DEMO_USER: UserProfile = {
  id: 'usr-001',
  nombre: 'Ing. Rocío Paredes Gamarra',
  email: 'rocioparedesg41@gmail.com',
  role: 'user',
  organizacion: 'Consultora Ambiental Valle Verde',
  cip: 'CIP N° 322074 (Habilitada)',
  telefono: '+51 918191721',
  cargo: 'Especialista Ambiental Senior',
  createdAt: '2026-01-15',
};

export const DEMO_ADMIN: UserProfile = {
  id: 'adm-001',
  nombre: 'Ing. Efren Alverca',
  email: 'efrenalverca07@gmail.com',
  role: 'admin',
  organizacion: 'EcoSerpentis Consulting Perú',
  cip: 'CIP N° 357422 (Auditor CIP)',
  telefono: '+51 938577012',
  cargo: 'Auditor Líder & Director Técnico',
  createdAt: '2025-11-01',
};

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  customLogo: string;
  setCustomLogo: (url: string) => void;
  resetDefaultLogo: () => void;
  customVideo: string;
  setCustomVideo: (url: string) => void;
  resetDefaultVideo: () => void;
  login: (email: string, role: UserRole, extra?: Partial<UserProfile>) => boolean;
  loginWithCredentials: (
    email: string,
    password?: string
  ) => { success: boolean; message?: string };
  loginAsDemoUser: () => void;
  loginAsDemoAdmin: () => void;
  register: (
    profile: Omit<UserProfile, 'id' | 'createdAt'> & { password?: string }
  ) => boolean;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pmrs_auth_user');
      } catch {
        // ignore
      }
    }
    // La página web siempre debe iniciarse con la portada de inicio de sesión
    return null;
  });

  const [customLogo, setCustomLogoState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedLogo = localStorage.getItem('pmrs_custom_logo');
      if (savedLogo && !savedLogo.includes('WhatsApp_Image_2026-10-01')) {
        return savedLogo;
      }
    }
    return DEFAULT_LOGO_URL;
  });

  const [customVideo, setCustomVideoState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedVideo = localStorage.getItem('pmrs_custom_video');
      if (savedVideo) return savedVideo;
    }
    return DEFAULT_VIDEO_URL;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pmrs_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pmrs_auth_user');
    }
  }, [currentUser]);

  const setCustomLogo = (url: string) => {
    setCustomLogoState(url);
    localStorage.setItem('pmrs_custom_logo', url);
  };

  const resetDefaultLogo = () => {
    setCustomLogoState(DEFAULT_LOGO_URL);
    localStorage.removeItem('pmrs_custom_logo');
  };

  const setCustomVideo = (url: string) => {
    setCustomVideoState(url);
    localStorage.setItem('pmrs_custom_video', url);
  };

  const resetDefaultVideo = () => {
    setCustomVideoState(DEFAULT_VIDEO_URL);
    localStorage.removeItem('pmrs_custom_video');
  };

  const login = (email: string, role: UserRole, extra?: Partial<UserProfile>): boolean => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      nombre:
        extra?.nombre ||
        (role === 'admin' ? 'Administrador EcoSerpentis' : 'Consultor Ambiental'),
      email,
      role,
      organizacion:
        extra?.organizacion ||
        (role === 'admin' ? 'EcoSerpentis Consulting Perú' : 'Empresa Titular'),
      cip: extra?.cip || (role === 'admin' ? 'CIP N° 145980' : 'CIP N° 189422'),
      telefono: extra?.telefono || '+51 987 654 321',
      cargo:
        extra?.cargo ||
        (role === 'admin' ? 'Auditor del Sistema' : 'Consultor Ambiental'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCurrentUser(newUser);
    return true;
  };

  const loginWithCredentials = (
    email: string,
    password?: string
  ): { success: boolean; message?: string } => {
    const normEmail = email.trim().toLowerCase();

    // Comprobar cuentas demo oficiales
    if (normEmail === DEMO_USER.email.toLowerCase()) {
      setCurrentUser(DEMO_USER);
      return { success: true };
    }
    if (normEmail === DEMO_ADMIN.email.toLowerCase()) {
      setCurrentUser(DEMO_ADMIN);
      return { success: true };
    }

    // Comprobar en usuarios registrados en localStorage
    try {
      const savedListStr = localStorage.getItem('pmrs_registered_users');
      const registeredList: RegisteredUserRecord[] = savedListStr
        ? JSON.parse(savedListStr)
        : [];

      const found = registeredList.find(
        (u) => u.email.toLowerCase() === normEmail
      );

      if (found) {
        if (found.password && password && found.password !== password) {
          return { success: false, message: 'La contraseña ingresada es incorrecta.' };
        }
        setCurrentUser(found);
        return { success: true };
      }
    } catch {
      // Ignorar error de parsing
    }

    // Si el usuario no está en la lista pero ingresó datos válidos, conceder acceso como Consultor
    const isSpecialAdmin = normEmail.includes('admin');
    const autoUser: UserProfile = {
      id: `usr-${Date.now()}`,
      nombre: isSpecialAdmin ? 'Administrador EcoSerpentis' : 'Consultor Técnico Registrado',
      email: normEmail,
      role: isSpecialAdmin ? 'admin' : 'user',
      organizacion: 'Empresa Titular Registrada',
      cip: 'CIP Habilitado',
      cargo: isSpecialAdmin ? 'Auditor Líder' : 'Especialista en Residuos Sólidos',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCurrentUser(autoUser);
    return { success: true };
  };

  const loginAsDemoUser = () => {
    setCurrentUser(DEMO_USER);
  };

  const loginAsDemoAdmin = () => {
    setCurrentUser(DEMO_ADMIN);
  };

  const register = (
    profile: Omit<UserProfile, 'id' | 'createdAt'> & { password?: string }
  ): boolean => {
    const newUser: RegisteredUserRecord = {
      ...profile,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const savedListStr = localStorage.getItem('pmrs_registered_users');
      const registeredList: RegisteredUserRecord[] = savedListStr
        ? JSON.parse(savedListStr)
        : [];
      const updatedList = [
        newUser,
        ...registeredList.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase()),
      ];
      localStorage.setItem('pmrs_registered_users', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Error saving registered user in localStorage:', e);
    }

    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pmrs_auth_user');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        customLogo,
        setCustomLogo,
        resetDefaultLogo,
        customVideo,
        setCustomVideo,
        resetDefaultVideo,
        login,
        loginWithCredentials,
        loginAsDemoUser,
        loginAsDemoAdmin,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
