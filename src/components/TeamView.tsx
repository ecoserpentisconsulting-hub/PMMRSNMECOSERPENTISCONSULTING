import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types/team';
import { INITIAL_TEAM_MEMBERS, INITIAL_TEAM_UPDATED_AT } from '../data/teamData';
import {
  Users,
  UserPlus,
  ExternalLink,
  Mail,
  Phone,
  Edit2,
  Trash2,
  X,
  Search,
  CheckCircle2,
  Upload,
  Download,
  Share2,
  Copy,
  Link as LinkIcon,
  RefreshCw,
  Award,
  BookOpen,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface TeamViewProps {
  onGoToCreate?: () => void;
  onGoToReview?: () => void;
  onGoToManual?: () => void;
}

const PRESET_AVATARS = [
  {
    label: 'Consultor Ambiental Sénior (M)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Especialista en Biología / Toxicología (F)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Ingeniero Sanitario & Residuos (M)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Consultora en Economía Circular (F)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Auditor Líder de Planta (M)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Especialista en Normativa MINAM (F)',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
  },
];

// Utilidad para redimensionar y comprimir imágenes de avatar a un tamaño óptimo (~20KB)
// evitando problemas de saturación de cuota en localStorage o retardos en la red.
function compressAvatarImage(file: File, maxDim = 320, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        reject(new Error('Lectura de imagen vacía'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => reject(new Error('No se pudo decodificar el archivo de imagen.'));
      img.src = src;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

// Guardar de manera segura en localStorage con timestamp para sincronización consistente
function safeSaveToLocalStorage(data: TeamMember[], timestamp?: number): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem('pmrs_team_members', JSON.stringify(data));
    if (timestamp !== undefined) {
      localStorage.setItem('pmrs_team_updated_at', String(timestamp));
    }
    return true;
  } catch (err) {
    console.warn('Advertencia al guardar en localStorage:', err);
    try {
      localStorage.setItem('pmrs_team_members', JSON.stringify(data));
      if (timestamp !== undefined) {
        localStorage.setItem('pmrs_team_updated_at', String(timestamp));
      }
      return true;
    } catch (e2) {
      console.error('No se pudo persistir en localStorage:', e2);
      return false;
    }
  }
}

// Sincronizar cambios en el backend para persistencia permanente en el servidor
async function syncTeamToServer(data: TeamMember[], timestamp?: number): Promise<boolean> {
  try {
    const updatedAt = timestamp || Date.now();
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members: data, updatedAt }),
    });
    if (res.ok) {
      const resJson = await res.json();
      return Boolean(resJson?.ok);
    }
    return false;
  } catch (err) {
    console.warn('Sincronización con el servidor diferida:', err);
    return false;
  }
}

// Helper para normalizar URLs de LinkedIn, corrigiendo errores de tipeo comunes (httlinkedin, http//, sin https, @usuario, etc.)
export function normalizeLinkedinUrl(raw?: string): string {
  let val = (raw || '').trim();
  if (!val) return '';

  // Quitar espacios, comillas o etiquetas
  val = val.replace(/^["'<]+|[>"']+$/g, '').trim();

  // Corregir errores tipográficos frecuentes en prefijos (ej: 'httlinkedin', 'https://httlinkedin', 'http//linkedin')
  val = val.replace(/^https?:\/\/+htt+linkedin/i, 'https://www.linkedin');
  val = val.replace(/^htt+linkedin/i, 'linkedin');
  val = val.replace(/^https?:?\/*\/*/i, ''); // Remueve cualquier http:, https://, http/, etc.
  val = val.replace(/^www\./i, ''); // Remueve www. temporalmente

  // Si el usuario ingresó ruta directa /in/ o in/ o @usuario
  if (val.startsWith('/in/')) {
    val = val.slice(4).replace(/^\/+/, '');
    return `https://www.linkedin.com/in/${val}`;
  }
  if (val.startsWith('in/')) {
    val = val.slice(3).replace(/^\/+/, '');
    return `https://www.linkedin.com/in/${val}`;
  }
  if (val.startsWith('@')) {
    val = val.slice(1);
    return `https://www.linkedin.com/in/${val}`;
  }

  // Si empieza con linkedin.com o subdominios (ej. pe.linkedin.com)
  if (/(?:^[a-z]{2}\.)?linkedin\.com/i.test(val)) {
    if (/^[a-z]{2}\.linkedin\.com/i.test(val)) {
      return `https://${val}`;
    }
    return `https://www.${val}`;
  }

  // Si sólo ingresó el nombre de usuario (ej. 'efrenalverca' o 'usuario-123')
  if (!val.includes('/') && !val.includes('.')) {
    return `https://www.linkedin.com/in/${val}`;
  }

  return `https://${val}`;
}

// Helper para normalizar URLs de páginas web de CV (sitios web, Drive, CTI Vitae, colegios profesionales)
export function normalizeWebUrl(raw?: string): string {
  let val = (raw || '').trim();
  if (!val) return '';

  val = val.replace(/^["'<]+|[>"']+$/g, '').trim();

  // Corregir errores tipográficos en el protocolo (ej: "htt...", "http//", "https//", "https:/", etc.)
  val = val.replace(/^https?:\/\/+htt+/i, 'https://');
  val = val.replace(/^htt+:\/\//i, 'https://');
  val = val.replace(/^https?:\/\/*/i, '');
  val = val.replace(/^http:\/*/i, '');
  val = val.replace(/^https:\/*/i, '');
  val = val.replace(/^htt\/*/i, '');

  val = val.trim();
  if (!val) return '';

  return `https://${val}`;
}

// Helper para sanear automáticamente miembros existentes (limpiando errores antiguos como httlinkedin)
function sanitizeMembers(list: TeamMember[]): TeamMember[] {
  return list.map((m) => {
    let cleanLinkedin = m.linkedinUrl ? normalizeLinkedinUrl(m.linkedinUrl) : undefined;
    let cleanCv = m.cvUrl ? normalizeWebUrl(m.cvUrl) : undefined;

    // Si cvUrl contenía un enlace exclusivo a linkedin y linkedinUrl estaba vacío, asignarlo
    if (!cleanLinkedin && cleanCv && cleanCv.toLowerCase().includes('linkedin.com')) {
      cleanLinkedin = normalizeLinkedinUrl(cleanCv);
    }

    return {
      ...m,
      linkedinUrl: cleanLinkedin,
      cvUrl: cleanCv,
    };
  });
}

// IDs oficiales inmutables de los profesionales de EcoSerpentis Consulting
const OFFICIAL_TEAM_IDS = [
  'team-01',
  'team-02',
  'team-03',
  'team-04',
  'team-05',
  'team-06',
  'team-07',
  'team-08',
];

// Garantizar que todos los miembros oficiales de EcoSerpentis estén presentes y con sus datos oficiales actualizados
function ensureOfficialMembers(list: any[]): TeamMember[] {
  if (!Array.isArray(list) || list.length === 0) return sanitizeMembers(INITIAL_TEAM_MEMBERS);
  const currentMap = new Map<string, any>();
  list.forEach((m) => {
    if (m && m.id) currentMap.set(m.id, m);
  });
  // Asegurar que cada miembro oficial esté presente y que sus campos clave (CV, LinkedIn, colegiatura, datos de contacto)
  // nunca queden vacíos o desactualizados por datos residuales de localStorage
  INITIAL_TEAM_MEMBERS.forEach((off) => {
    const existing = currentMap.get(off.id);
    if (!existing) {
      currentMap.set(off.id, off);
    } else {
      currentMap.set(off.id, {
        ...off,
        ...existing,
        nombre: existing.nombre || off.nombre,
        cargo: existing.cargo || off.cargo,
        especialidad: existing.especialidad || off.especialidad,
        colegiatura: existing.colegiatura || off.colegiatura,
        avatar: (existing.avatar && existing.avatar.length > 50) ? existing.avatar : off.avatar,
        cvUrl: existing.cvUrl || off.cvUrl,
        linkedinUrl: existing.linkedinUrl || off.linkedinUrl,
        email: existing.email || off.email,
        telefono: existing.telefono || off.telefono,
        resumen: (existing.resumen && existing.resumen.length > 20) ? existing.resumen : off.resumen,
        areas: (Array.isArray(existing.areas) && existing.areas.length > 0) ? existing.areas : off.areas,
        destacado: existing.destacado !== undefined ? existing.destacado : off.destacado,
      });
    }
  });
  return sanitizeMembers(Array.from(currentMap.values()));
}

export const TeamView: React.FC<TeamViewProps> = ({
  onGoToCreate,
  onGoToReview,
  onGoToManual,
}) => {
  const [members, setMembers] = useState<TeamMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const localUpdatedAt = Number(localStorage.getItem('pmrs_team_updated_at')) || 0;
        const saved = localStorage.getItem('pmrs_team_members');

        // Si la versión guardada en localStorage es anterior a la versión del código (INITIAL_TEAM_UPDATED_AT)
        // o no existe caché local, cargar inmediatamente la versión oficial más reciente
        if (!saved || localUpdatedAt < INITIAL_TEAM_UPDATED_AT) {
          const fresh = sanitizeMembers(INITIAL_TEAM_MEMBERS);
          safeSaveToLocalStorage(fresh, INITIAL_TEAM_UPDATED_AT);
          return fresh;
        }

        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ensureOfficialMembers(parsed);
        }
      } catch (e) {
        console.error('Error al cargar equipo desde localStorage:', e);
      }
    }
    return sanitizeMembers(INITIAL_TEAM_MEMBERS);
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states con soporte para dos enlaces (LinkedIn y Página Web CV)
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    especialidad: '',
    colegiatura: '',
    avatar: PRESET_AVATARS[0].url,
    cvUrl: '',
    linkedinUrl: '',
    email: '',
    telefono: '',
    resumen: '',
    areasStr: '',
  });
  const [avatarUploadMode, setAvatarUploadMode] = useState<'url' | 'upload' | 'preset'>('preset');
  const [formError, setFormError] = useState<string | null>(null);

  // Al montar, sincronizar bidireccionalmente con el servidor o endpoint estático para Netlify
  useEffect(() => {
    let isMounted = true;

    const fetchTeamData = async () => {
      let resJson: any = null;
      try {
        const res = await fetch('/api/team');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          resJson = await res.json();
        } else {
          // Si es un entorno estático (como Netlify) donde /api/team retorna HTML por el rewrite SPA,
          // cargar el endpoint estático /api/team.json
          const fallbackRes = await fetch('/api/team.json').catch(() => null);
          if (fallbackRes && fallbackRes.ok) {
            const fallbackType = fallbackRes.headers.get('content-type') || '';
            if (fallbackType.includes('application/json')) {
              resJson = await fallbackRes.json();
            }
          }
        }
      } catch (e) {
        // Intento secundario hacia /api/team.json
        try {
          const fallbackRes = await fetch('/api/team.json');
          if (fallbackRes && fallbackRes.ok) {
            resJson = await fallbackRes.json();
          }
        } catch (e2) {}
      }

      if (!isMounted) return;

      if (resJson?.ok && Array.isArray(resJson.data) && resJson.data.length > 0) {
        const serverMembers = ensureOfficialMembers(resJson.data as TeamMember[]);
        const serverUpdatedAt = Number(resJson.updatedAt) || INITIAL_TEAM_UPDATED_AT;
        const localSaved = localStorage.getItem('pmrs_team_members');
        const localUpdatedAt = Number(localStorage.getItem('pmrs_team_updated_at')) || 0;

        if (!localSaved || serverUpdatedAt > localUpdatedAt) {
          // Adoptar datos del servidor o archivo estático actualizado
          setMembers(serverMembers);
          safeSaveToLocalStorage(serverMembers, serverUpdatedAt);
          return;
        }

        let parsedLocal: TeamMember[] = serverMembers;
        try {
          parsedLocal = ensureOfficialMembers(JSON.parse(localSaved));
        } catch (e) {
          parsedLocal = serverMembers;
        }

        if (localUpdatedAt > serverUpdatedAt) {
          setMembers(parsedLocal);
          syncTeamToServer(parsedLocal, localUpdatedAt);
        } else {
          setMembers(serverMembers);
          safeSaveToLocalStorage(serverMembers, serverUpdatedAt);
        }
      } else {
        // Si no hay respuesta de API (despliegue estático desconectado),
        // verificar que localStorage no esté desactualizado respecto a INITIAL_TEAM_MEMBERS
        const localUpdatedAt = Number(localStorage.getItem('pmrs_team_updated_at')) || 0;
        if (localUpdatedAt < INITIAL_TEAM_UPDATED_AT) {
          const fresh = sanitizeMembers(INITIAL_TEAM_MEMBERS);
          setMembers(fresh);
          safeSaveToLocalStorage(fresh, INITIAL_TEAM_UPDATED_AT);
        }
      }
    };

    fetchTeamData().catch((err) => {
      console.warn('Verificación de equipo diferida:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const updateFormField = (field: string, val: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      if (!editingMember) {
        try {
          localStorage.setItem('pmrs_team_form_draft', JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    let initialDraft = {
      nombre: '',
      cargo: '',
      especialidad: '',
      colegiatura: '',
      avatar: PRESET_AVATARS[0].url,
      cvUrl: '',
      linkedinUrl: '',
      email: '',
      telefono: '',
      resumen: '',
      areasStr: 'PMMRS, D.L. 1278, MINAM',
    };
    try {
      const saved = localStorage.getItem('pmrs_team_form_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          initialDraft = { ...initialDraft, ...parsed };
        }
      }
    } catch (e) {}

    setFormData(initialDraft);
    setAvatarUploadMode('preset');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    let lUrl = member.linkedinUrl ? normalizeLinkedinUrl(member.linkedinUrl) : '';
    let cUrl = member.cvUrl ? normalizeWebUrl(member.cvUrl) : '';
    // Si sólo existía cvUrl pero contenía linkedin, clasificarlo a linkedinUrl
    if (!lUrl && cUrl && cUrl.toLowerCase().includes('linkedin.com')) {
      lUrl = normalizeLinkedinUrl(cUrl);
      cUrl = '';
    }

    setFormData({
      nombre: member.nombre,
      cargo: member.cargo,
      especialidad: member.especialidad,
      colegiatura: member.colegiatura || '',
      avatar: member.avatar,
      cvUrl: cUrl,
      linkedinUrl: lUrl,
      email: member.email || '',
      telefono: member.telefono || '',
      resumen: member.resumen,
      areasStr: Array.isArray(member.areas) ? member.areas.join(', ') : '',
    });
    setAvatarUploadMode(member.avatar.startsWith('data:') ? 'upload' : 'url');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleShareLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}${window.location.pathname}#team`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            showToast('¡Enlace del equipo copiado al portapapeles! Al compartirlo, los datos guardados se mantienen intactos.');
          })
          .catch(() => {
            showToast(`Enlace: ${shareUrl}`);
          });
      } else {
        showToast(`Enlace: ${shareUrl}`);
      }
    }
  };

  const OFFICIAL_MEMBER_IDS = new Set([
    'team-01',
    'team-02',
    'team-03',
    'team-04',
    'team-05',
    'team-06',
    'team-07',
    'team-08',
  ]);

  const handleDeleteMember = (id: string, nombre: string) => {
    if (OFFICIAL_MEMBER_IDS.has(id)) {
      showToast(`El profesional ${nombre} forma parte del equipo oficial y está blindado contra eliminación.`);
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${nombre} del equipo?`)) {
      const now = Date.now();
      const updatedList = members.filter((m) => m.id !== id);
      setMembers(updatedList);
      safeSaveToLocalStorage(updatedList, now);
      syncTeamToServer(updatedList, now);
      showToast(`Profesional ${nombre} eliminado.`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar la lista del equipo con los especialistas oficiales de EcoSerpentis?')) {
      const now = Date.now();
      setMembers(INITIAL_TEAM_MEMBERS);
      safeSaveToLocalStorage(INITIAL_TEAM_MEMBERS, now);
      syncTeamToServer(INITIAL_TEAM_MEMBERS, now);
      fetch('/api/team/reset', { method: 'POST' }).catch((e) => console.warn(e));
      showToast('Equipo de profesionales oficiales verificado y restaurado.');
    }
  };

  // Manejar carga y compresión de imagen de avatar desde archivo local
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setFormError('La imagen no debe superar los 6 MB.');
      return;
    }

    try {
      const compressedDataUrl = await compressAvatarImage(file, 320, 0.85);
      setFormData((prev) => ({ ...prev, avatar: compressedDataUrl }));
      setFormError(null);
    } catch (err) {
      console.error('Error al procesar avatar:', err);
      setFormError('Error al procesar la imagen seleccionada. Por favor intenta con otra.');
    }
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setFormError('El nombre del profesional es obligatorio.');
      return;
    }

    if (!formData.cargo.trim()) {
      setFormError('El cargo o función técnica es obligatorio.');
      return;
    }

    if (!formData.especialidad.trim()) {
      setFormError('La especialidad es obligatoria.');
      return;
    }

    const rawLinkedin = formData.linkedinUrl.trim();
    const rawCv = formData.cvUrl.trim();

    const formattedLinkedin = rawLinkedin ? normalizeLinkedinUrl(rawLinkedin) : undefined;
    const formattedCv = rawCv ? normalizeWebUrl(rawCv) : undefined;

    const areasArray = formData.areasStr
      .split(/[,\n]+/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    let updatedList: TeamMember[];

    if (editingMember) {
      // Actualizar existente manteniendo campos inalterados
      updatedList = members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              nombre: formData.nombre.trim(),
              cargo: formData.cargo.trim(),
              especialidad: formData.especialidad.trim(),
              colegiatura: formData.colegiatura.trim() || undefined,
              avatar: formData.avatar.trim() || PRESET_AVATARS[0].url,
              cvUrl: formattedCv,
              linkedinUrl: formattedLinkedin,
              email: formData.email.trim() || undefined,
              telefono: formData.telefono.trim() || undefined,
              resumen: formData.resumen.trim() || m.resumen || 'Especialista en consultoría ambiental y manejo de residuos.',
              areas: areasArray.length > 0 ? areasArray : m.areas,
            }
          : m
      );
      showToast(`Profesional ${formData.nombre} actualizado exitosamente.`);
    } else {
      // Crear nuevo profesional
      const newMember: TeamMember = {
        id: `team-${Date.now()}`,
        nombre: formData.nombre.trim(),
        cargo: formData.cargo.trim(),
        especialidad: formData.especialidad.trim(),
        colegiatura: formData.colegiatura.trim() || undefined,
        avatar: formData.avatar.trim() || PRESET_AVATARS[0].url,
        cvUrl: formattedCv,
        linkedinUrl: formattedLinkedin,
        email: formData.email.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        resumen: formData.resumen.trim() || 'Especialista en consultoría ambiental y manejo de residuos.',
        areas: areasArray.length > 0 ? areasArray : ['Gestión Integral de Residuos'],
        destacado: false,
      };
      updatedList = [newMember, ...members];
      showToast(`¡Profesional ${formData.nombre} añadido exitosamente!`);
    }

    // Persistir con marca de tiempo precisa en estado, localStorage y backend
    const now = Date.now();
    setMembers(updatedList);
    safeSaveToLocalStorage(updatedList, now);
    syncTeamToServer(updatedList, now);
    try {
      localStorage.removeItem('pmrs_team_form_draft');
    } catch (e) {}

    setIsModalOpen(false);
  };

  // Filtrado
  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.nombre.toLowerCase().includes(q) ||
      m.cargo.toLowerCase().includes(q) ||
      m.especialidad.toLowerCase().includes(q) ||
      (m.colegiatura && m.colegiatura.toLowerCase().includes(q)) ||
      m.areas.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Toast de confirmación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-[#102F27] border-2 border-[#B68A4F] text-[#F2EBDD] shadow-2xl animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#B68A4F]" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ====================================================
          BANNER PRINCIPAL: EQUIPO DE PROFESIONALES
      ==================================================== */}
      <div className="bg-[#102F27] text-[#F2EBDD] p-6 sm:p-8 border-b-4 border-[#B68A4F] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#185844] text-[#B68A4F] border border-[#B68A4F]/60">
                Equipo Multidisciplinario
              </span>
              <span className="text-xs text-[#78947F]">·</span>
              <span className="text-xs text-[#78947F] font-medium">EcoSerpentis Consulting Perú</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
              <Users className="w-8 h-8 text-[#B68A4F]" />
              <span>Equipo de Profesionales Especializados</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#F2EBDD]/80 max-w-3xl leading-relaxed">
              Especialistas colegiados y habilitados en ingeniería ambiental, biología, toxicología e higiene industrial,
              responsables de la elaboración, auditoría y conformidad técnica de Planes de Minimización y Manejo de Residuos
              Sólidos No Municipales según la R.M. 089-2023-MINAM y D.L. 1278.
            </p>
          </div>

          {/* Acciones principales: Añadir y Restaurar */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F] text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#B68A4F]" />
              <span>Añadir Profesional</span>
            </button>
            <button
              type="button"
              onClick={handleShareLink}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-[#102F27] hover:bg-[#185844] text-[#F2EBDD] border border-[#B68A4F] text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              title="Copiar enlace permanente para compartir el equipo guardado"
            >
              <Share2 className="w-4 h-4 text-[#B68A4F]" />
              <span>Compartir Equipo</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-[#102F27] hover:bg-[#185844] text-[#F2EBDD]/80 hover:text-white border border-[#B68A4F]/40 text-xs font-semibold transition-colors cursor-pointer"
              title="Restaurar especialistas predeterminados"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#B68A4F]" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================
          BARRA DE BÚSQUEDA Y ESTADÍSTICAS
      ==================================================== */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, cargo, especialidad, CIP o área técnica..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#185844] focus:border-[#185844]"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs text-slate-600 shrink-0">
          <span>
            Mostrando <strong className="text-slate-900 font-bold">{filteredMembers.length}</strong> de{' '}
            <strong className="text-slate-900 font-bold">{members.length}</strong> profesionales
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[#185844] hover:underline font-semibold cursor-pointer"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* ====================================================
          GRILLA DE PROFESIONALES
      ==================================================== */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 text-slate-400 flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No se encontraron profesionales</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            No hay especialistas que coincidan con &ldquo;{searchTerm}&rdquo;. Puedes ajustar tu búsqueda o añadir un nuevo
            profesional manualmente.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#185844] text-[#F2EBDD] font-bold text-xs"
          >
            <UserPlus className="w-4 h-4 text-[#B68A4F]" />
            <span>Añadir profesional ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-slate-200 hover:border-[#B68A4F]/60 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              {/* Parte superior de la tarjeta */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar con doble aro oro y esmeralda */}
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={member.avatar}
                        alt={member.nombre}
                        onError={(e) => {
                          // Fallback si la imagen no carga
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                        }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#B68A4F] ring-2 ring-[#185844] object-cover bg-slate-100 shadow-sm"
                      />
                      {member.destacado && (
                        <span
                          className="absolute -bottom-1 -right-1 p-1 bg-[#102F27] border border-[#B68A4F] text-[#B68A4F]"
                          title="Especialista Sénior / Auditor Líder"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-[#102F27] leading-tight truncate">
                        {member.nombre}
                      </h3>
                      <p className="text-xs sm:text-[13px] font-semibold text-[#185844] leading-tight">
                        {member.cargo}
                      </p>
                      {member.colegiatura && (
                        <p className="text-[11px] font-medium text-slate-600 flex items-center space-x-1">
                          <span className="text-[#B68A4F] font-bold">📜</span>
                          <span>{member.colegiatura}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones rápidas (Editar / Eliminar) */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(member)}
                      className="p-1.5 text-slate-500 hover:text-[#185844] hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar información del profesional"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member.id, member.nombre)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar profesional"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Especialidad destacada */}
                <div className="p-2.5 bg-[#FAF8F5] border-l-3 border-[#B68A4F]">
                  <span className="text-[10px] font-bold uppercase text-[#78947F] tracking-wider block">
                    Especialidad Técnica
                  </span>
                  <p className="text-xs font-semibold text-[#102F27] mt-0.5 leading-snug">
                    {member.especialidad}
                  </p>
                </div>

                {/* Resumen / Biografía */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {member.resumen}
                </p>

                {/* Áreas de competencia técnica */}
                {member.areas && member.areas.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Competencias clave:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700">
                      {member.areas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[11px]"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pie de la tarjeta: ENLACE AL CV / PERFIL PROFESIONAL */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Contacto directo si está disponible */}
                <div className="flex items-center space-x-3 text-xs text-slate-600">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="hover:text-[#185844] flex items-center space-x-1"
                      title={`Enviar correo a ${member.email}`}
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{member.email}</span>
                    </a>
                  )}
                  {member.telefono && (
                    <a
                      href={`tel:${member.telefono}`}
                      className="hover:text-[#185844] flex items-center space-x-1"
                      title={`Llamar a ${member.telefono}`}
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.telefono}</span>
                    </a>
                  )}
                </div>

                {/* BOTONES DE ENLACE DIRECTO: LINKEDIN Y/O PÁGINA WEB CV */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {member.linkedinUrl && (
                    <a
                      href={normalizeLinkedinUrl(member.linkedinUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-[#0077B5] hover:bg-[#005f93] text-white text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
                      title={`Abrir perfil de LinkedIn de ${member.nombre} directamente`}
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                      </svg>
                      <span>LinkedIn</span>
                    </a>
                  )}

                  {member.cvUrl && (
                    <a
                      href={normalizeWebUrl(member.cvUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-[#102F27] hover:bg-[#185844] text-[#F2EBDD] hover:text-white border border-[#B68A4F] text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
                      title={`Abrir página web del CV de ${member.nombre} directamente`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#B68A4F]" />
                      <span>Página Web CV</span>
                    </a>
                  )}

                  {!member.linkedinUrl && !member.cvUrl && (
                    <span className="text-[11px] text-slate-400 italic">Sin enlace registrado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================
          MÓDULO INFORMATIVO: CRITERIOS DE HABILITACIÓN TÉCNICA
      ==================================================== */}
      <div className="p-5 sm:p-6 bg-[#FAF8F5] border border-[#B68A4F]/40 space-y-3">
        <div className="flex items-center space-x-2 text-[#102F27]">
          <BookOpen className="w-5 h-5 text-[#B68A4F]" />
          <h3 className="font-bold text-sm sm:text-base">
            Requisitos de los Profesionales Responsables del PMMRS (R.M. 089-2023-MINAM)
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          De acuerdo al marco regulatorio del D.L. 1278 (Ley de Gestión Integral de Residuos Sólidos) y su modificatoria D.L.
          1501, la formulación y suscripción técnica de los Planes de Minimización y Manejo de Residuos Sólidos No Municipales
          debe realizarse por <strong>ingenieros colegiados y habilitados</strong> (Ambientales, Sanitarios, Químicos o afines)
          o especialistas registrados en el padrón de consultores ambientales de la autoridad sectorial competente (PRODUCE,
          MINEM, MIDAGRI, etc.).
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {onGoToCreate && (
            <button
              type="button"
              onClick={onGoToCreate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#185844] text-[#F2EBDD] font-bold text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#B68A4F]" />
              <span>Elaborar Plan con este Equipo</span>
            </button>
          )}
          {onGoToReview && (
            <button
              type="button"
              onClick={onGoToReview}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-800 font-semibold text-xs hover:bg-slate-50"
            >
              <span>Ir al Módulo de Revisión y Dictamen</span>
            </button>
          )}
        </div>
      </div>

      {/* ====================================================
          MODAL: AÑADIR O EDITAR PROFESIONAL MANUALMENTE
      ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-none max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-[#185844] relative my-auto">
            {/* Cabecera del modal */}
            <div className="p-5 bg-[#102F27] text-[#F2EBDD] flex items-center justify-between border-b-2 border-[#B68A4F]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#0A221C] border border-[#B68A4F]/60 text-[#B68A4F]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {editingMember ? 'Editar Profesional' : 'Añadir Profesional Manualmente'}
                  </h2>
                  <p className="text-[11px] text-[#78947F]">
                    Equipo de consultoría técnica EcoSerpentis Consulting Perú
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-[#185844] transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveMember} className="p-5 sm:p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Datos Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nombre Completo del Profesional <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => updateFormField('nombre', e.target.value)}
                    placeholder="Ej. Ing. María Alejandra Torres"
                    className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Cargo / Rol en el Proyecto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cargo}
                    onChange={(e) => updateFormField('cargo', e.target.value)}
                    placeholder="Ej. Especialista en Residuos Sólidos"
                    className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Especialidad Técnica <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.especialidad}
                    onChange={(e) => updateFormField('especialidad', e.target.value)}
                    placeholder="Ej. Manejo de Residuos Peligrosos & D.L. 1278"
                    className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Colegiatura / Registro Profesional (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.colegiatura}
                    onChange={(e) => updateFormField('colegiatura', e.target.value)}
                    placeholder="Ej. CIP N° 198420 - Ing. Ambiental"
                    className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                  />
                </div>
              </div>

              {/* 2. ENLACES PROFESIONALES: DOS OPCIONES (LINKEDIN Y PÁGINA WEB CV) */}
              <div className="p-4 bg-[#FAF8F5] border border-[#B68A4F]/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-4 h-4 text-[#B68A4F]" />
                    <label className="block text-xs font-extrabold text-[#102F27]">
                      Enlaces Profesionales y Credenciales (Opcional)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    (Se acepta con o sin https://)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Coloca el perfil de LinkedIn, la página web del CV o ambos. Tus datos se guardan y validan sin bloquear si no cuentas con un enlace al momento.
                </p>

                {/* Opción 1: LinkedIn */}
                <div className="space-y-1.5 p-3 bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-xs bg-[#0077B5] text-white flex items-center justify-center text-[10px] font-bold">
                        in
                      </span>
                      <span>Opción 1: Perfil de LinkedIn</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Ej: linkedin.com/in/usuario o usuario</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      inputMode="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => updateFormField('linkedinUrl', e.target.value)}
                      placeholder="linkedin.com/in/usuario, efrenalverca o https://www.linkedin.com/in/..."
                      className="flex-1 px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0077B5] bg-white text-[12px]"
                    />
                    {formData.linkedinUrl && (
                      <a
                        href={normalizeLinkedinUrl(formData.linkedinUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-[#0077B5] hover:bg-[#005f93] text-white text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer shadow-2xs"
                        title="Abrir directamente el perfil de LinkedIn en nueva pestaña"
                      >
                        <span>Abrir directamente</span>
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                      </a>
                    )}
                  </div>
                  {formData.linkedinUrl && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 pt-0.5">
                      <span className="font-semibold text-slate-700">Destino directo:</span>
                      <span className="font-mono text-[#0077B5] truncate">{normalizeLinkedinUrl(formData.linkedinUrl)}</span>
                    </div>
                  )}
                </div>

                {/* Opción 2: Página Web del CV / Hoja de Vida */}
                <div className="space-y-1.5 p-3 bg-white border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-[#185844]" />
                      <span>Opción 2: Página Web del CV / Hoja de Vida</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Web, CTI Vitae, CIP o Drive</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      inputMode="url"
                      value={formData.cvUrl}
                      onChange={(e) => updateFormField('cvUrl', e.target.value)}
                      placeholder="cv-profesional.pe, drive.google.com/..., cip.org.pe o https://..."
                      className="flex-1 px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844] bg-white text-[12px]"
                    />
                    {formData.cvUrl && (
                      <a
                        href={normalizeWebUrl(formData.cvUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-[#102F27] hover:bg-[#185844] text-[#F2EBDD] text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer border border-[#B68A4F] shadow-2xs"
                        title="Abrir directamente la página web del CV en nueva pestaña"
                      >
                        <span>Abrir directamente</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#B68A4F]" />
                      </a>
                    )}
                  </div>
                  {formData.cvUrl && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 pt-0.5">
                      <span className="font-semibold text-slate-700">Destino directo:</span>
                      <span className="font-mono text-[#185844] truncate">{normalizeWebUrl(formData.cvUrl)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. AVATAR DEL PROFESIONAL (SELECTOR, SUBIDA O URL) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Avatar del Profesional <span className="text-red-500">*</span>
                </label>

                {/* Modos de carga */}
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAvatarUploadMode('preset')}
                    className={`px-3 py-1.5 font-semibold cursor-pointer ${
                      avatarUploadMode === 'preset'
                        ? 'bg-[#185844] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Elegir de Galería
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarUploadMode('upload')}
                    className={`px-3 py-1.5 font-semibold cursor-pointer ${
                      avatarUploadMode === 'upload'
                        ? 'bg-[#185844] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Subir Imagen Local
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarUploadMode('url')}
                    className={`px-3 py-1.5 font-semibold cursor-pointer ${
                      avatarUploadMode === 'url'
                        ? 'bg-[#185844] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Pegar URL de Imagen
                  </button>
                </div>

                {/* Previsualización actual */}
                <div className="flex items-center space-x-4 p-3 bg-slate-50 border border-slate-200">
                  <img
                    src={formData.avatar}
                    alt="Previsualización de avatar"
                    className="w-14 h-14 rounded-full border-2 border-[#B68A4F] ring-2 ring-[#185844] object-cover bg-white shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 block">Avatar Seleccionado</span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {formData.avatar.startsWith('data:')
                        ? 'Imagen cargada desde archivo local'
                        : formData.avatar}
                    </span>
                  </div>
                </div>

                {avatarUploadMode === 'preset' && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: preset.url })}
                        className={`p-1 border transition-all text-center group cursor-pointer ${
                          formData.avatar === preset.url
                            ? 'border-[#B68A4F] bg-[#102F27]/10 ring-2 ring-[#B68A4F]'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={preset.label}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-12 h-12 rounded-full mx-auto object-cover"
                        />
                        <span className="text-[9px] text-slate-600 block truncate mt-1">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {avatarUploadMode === 'upload' && (
                  <div className="p-4 border-2 border-dashed border-slate-300 hover:border-[#185844] text-center space-y-2">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      Selecciona una foto desde tu dispositivo (JPG, PNG, WebP)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[#185844] file:text-white cursor-pointer"
                    />
                  </div>
                )}

                {avatarUploadMode === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      placeholder="https://ejemplo.com/foto-profesional.jpg"
                      className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                    />
                  </div>
                )}
              </div>

              {/* 4. Resumen Profesional */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Resumen de Experiencia / Biografía Técnica <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.resumen}
                  onChange={(e) => updateFormField('resumen', e.target.value)}
                  placeholder="Describe la experiencia relevante del profesional en residuos no municipales, autorizaciones sectoriales, auditorías o elaboración de planes ambientales..."
                  className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                />
              </div>

              {/* 5. Competencias y Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormField('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Teléfono / WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => updateFormField('telefono', e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Áreas Clave (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.areasStr}
                    onChange={(e) => updateFormField('areasStr', e.target.value)}
                    placeholder="PMMRS, MINAM, D.L. 1278"
                    className="w-full px-3 py-2 border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#185844]"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#102F27] hover:bg-[#185844] text-[#F2EBDD] border border-[#B68A4F] text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer"
                >
                  {editingMember ? 'Guardar Cambios' : 'Añadir al Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
