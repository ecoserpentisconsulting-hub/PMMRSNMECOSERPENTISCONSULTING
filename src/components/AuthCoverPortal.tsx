import React, { useState, useRef } from 'react';
import {
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  Building,
  Award,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SOCIAL_LINKS } from './SocialLinks';
import { LogoPreviewModal } from './LogoPreviewModal';

const LOGIN_VIDEO_URL =
  'https://res.cloudinary.com/h5daploe/video/upload/v1792207462/VIDEO_SERPENTIS.mp4';

const HOME_VIDEO_URL =
  'https://res.cloudinary.com/h5daploe/video/upload/v1790782827/PMMRS_fondo_web_10s.mp4';

interface AuthCoverPortalProps {
  onSuccessLogin?: () => void;
}

export const AuthCoverPortal: React.FC<AuthCoverPortalProps> = ({ onSuccessLogin }) => {
  const {
    customLogo,
    customVideo,
    loginWithCredentials,
    loginAsDemoUser,
    loginAsDemoAdmin,
    register,
  } = useAuth();

  const safeLogo = customLogo && customLogo.includes('WhatsApp_Image_2026-10-01') ? '/logo_transparent.png' : customLogo;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'image' | 'video'>('image');

  // Video playback states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regOrganizacion, setRegOrganizacion] = useState('');
  const [regCip, setRegCip] = useState('');
  const [regCargo, setRegCargo] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Video controls
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico.');
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage('Por favor ingrese su contraseña.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = loginWithCredentials(loginEmail.trim(), loginPassword.trim());
      setIsSubmitting(false);

      if (result.success) {
        setSuccessMessage('¡Inicio de sesión exitoso! Ingresando al sistema...');
        setTimeout(() => {
          if (onSuccessLogin) onSuccessLogin();
        }, 500);
      } else {
        setErrorMessage(result.message || 'Credenciales no válidas.');
      }
    }, 400);
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regNombre.trim()) {
      setErrorMessage('Ingrese su nombre y apellidos completos.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Ingrese un correo electrónico válido.');
      return;
    }
    if (!regOrganizacion.trim()) {
      setErrorMessage('Ingrese la empresa, consultora o titular del proyecto.');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifique nuevamente.');
      return;
    }
    if (!acceptTerms) {
      setErrorMessage('Debe declarar el compromiso de cumplimiento ético y normativo.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const ok = register({
        nombre: regNombre.trim(),
        email: regEmail.trim(),
        role: 'user',
        organizacion: regOrganizacion.trim(),
        cip: regCip.trim() ? `CIP N° ${regCip.replace(/\D/g, '')}` : undefined,
        cargo: regCargo.trim() || 'Especialista Ambiental',
        telefono: regTelefono.trim() || undefined,
        password: regPassword.trim(),
      });
      setIsSubmitting(false);

      if (ok) {
        setSuccessMessage('¡Registro completado con éxito! Bienvenido al sistema.');
        setTimeout(() => {
          if (onSuccessLogin) onSuccessLogin();
        }, 600);
      } else {
        setErrorMessage('No se pudo completar el registro. Intente con otro correo.');
      }
    }, 450);
  };

  const handleQuickDemoUser = () => {
    loginAsDemoUser();
    if (onSuccessLogin) onSuccessLogin();
  };

  const handleQuickDemoAdmin = () => {
    loginAsDemoAdmin();
    if (onSuccessLogin) onSuccessLogin();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#102F27] text-white flex flex-col justify-between overflow-x-hidden select-none">
      {/* ====================================================
          FONDO CORPORATIVO ESTÁTICO (LOGIN)
          El video animado no es global: se ubica exclusivamente en el panel izquierdo
      ==================================================== */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(16, 47, 39, 0.98) 0%, rgba(24, 88, 68, 0.90) 45%, rgba(10, 34, 28, 0.96) 100%)',
        }}
      />

      {/* ====================================================
          BARRA SUPERIOR DE ENCABEZADO Y CONTROLES DEL VIDEO MP4
      ==================================================== */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3 sm:py-4 flex flex-wrap items-center justify-between border-b border-white/10 bg-[#102F27]/70 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsLogoModalOpen(true)}
            className="relative group focus:outline-none cursor-pointer"
            title="Haz clic para ver el logotipo en grande"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#B68A4F] ring-2 ring-[#185844] overflow-hidden bg-black shadow-md hover-logo-motion">
              <img
                src={safeLogo}
                alt="EcoSerpentis Consulting Perú"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                PMMRS
              </span>
              <span className="px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider bg-[#102F27] text-[#B68A4F] border border-[#B68A4F]">
                NO MUNICIPALES
              </span>
            </div>
            <p className="text-[11px] text-[#B68A4F] font-bold leading-tight">
              EcoSerpentis Consulting Perú
            </p>
          </div>
        </div>

        {/* Controles interactivos del video MP4 en la cabecera */}
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-black/40 border border-[#B68A4F]/40 text-[#F2EBDD] text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Video MP4 en reproducción</span>
          </div>

          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex items-center space-x-1 px-2.5 py-1 bg-[#185844]/80 hover:bg-[#185844] border border-[#B68A4F]/60 text-[#F2EBDD] text-xs font-semibold cursor-pointer transition-colors"
            title={isPlaying ? 'Pausar video de fondo' : 'Reproducir video'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#B68A4F]" />
                <span className="hidden md:inline">Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#B68A4F]" />
                <span className="hidden md:inline">Reproducir</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            className="flex items-center space-x-1 px-2.5 py-1 bg-[#185844]/80 hover:bg-[#185844] border border-[#B68A4F]/60 text-[#F2EBDD] text-xs font-semibold cursor-pointer transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden md:inline">{isMuted ? 'Silenciado' : 'Con audio'}</span>
          </button>
        </div>
      </header>

      {/* ====================================================
          CUERPO PRINCIPAL: PORTADA DE INICIO DE SESIÓN Y REGISTRO
      ==================================================== */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* ====================================================
              COLUMNA IZQUIERDA: PANEL AUDIOVISUAL CON VIDEO_SERPENTIS.mp4
              Muestra exclusivamente el video de fondo limpio sin textos ni tarjetas superpuestas
          ==================================================== */}
          <div className="lg:col-span-6 relative overflow-hidden rounded-none border-2 border-[#B68A4F]/80 bg-[#102F27] shadow-2xl min-h-[300px] sm:min-h-[380px] lg:min-h-full">
            {/* Video de fondo exclusivo para el panel izquierdo del login */}
            <video
              ref={videoRef}
              src={LOGIN_VIDEO_URL}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: 'center 35%' }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                // Fallback: Si VIDEO_SERPENTIS.mp4 no carga, ocultar video para mostrar el fondo estático corporativo
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* COLUMNA DERECHA: TARJETA DE ACCESO (INICIAR SESIÓN / REGISTRARSE) */}
          <div className="lg:col-span-6 w-full">
            <div className="w-full bg-[#102F27]/95 border-2 border-[#B68A4F]/80 shadow-2xl backdrop-blur-md overflow-hidden">
              
              {/* Pestañas superiores: Iniciar Sesión vs Registrarse */}
              <div className="grid grid-cols-2 border-b border-[#B68A4F]/40 bg-[#0A221C]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`py-3.5 sm:py-4 px-4 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-[#185844] text-[#F2EBDD] border-b-2 border-[#B68A4F]'
                      : 'text-[#F2EBDD]/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LogIn className="w-4 h-4 text-[#B68A4F]" />
                  <span>Iniciar Sesión</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`py-3.5 sm:py-4 px-4 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-[#185844] text-[#F2EBDD] border-b-2 border-[#B68A4F]'
                      : 'text-[#F2EBDD]/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-[#B68A4F]" />
                  <span>Registrarse</span>
                </button>
              </div>

              {/* Mensajes de Alerta / Éxito */}
              <div className="p-5 sm:p-7 space-y-5">
                {errorMessage && (
                  <div className="p-3 bg-red-950/80 border border-red-500/70 text-red-200 text-xs flex items-start space-x-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 text-xs flex items-start space-x-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* ====================================================
                    PESTAÑA 1: FORMULARIO DE INICIO DE SESIÓN
                ==================================================== */}
                {activeTab === 'login' && (
                  <div className="space-y-4">
                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      {/* Correo Electrónico */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#F2EBDD] uppercase tracking-wider">
                          Correo Profesional / Corporativo
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="consultor@empresa.com"
                            className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs sm:text-sm focus:outline-none placeholder:text-slate-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Contraseña */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-[#F2EBDD] uppercase tracking-wider">
                            Contraseña
                          </label>
                          <span className="text-[10px] text-[#B68A4F]">
                            (Mínimo 6 caracteres)
                          </span>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-10 py-2.5 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs sm:text-sm focus:outline-none placeholder:text-slate-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Opciones adicionales: Recordar sesión */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <label className="flex items-center space-x-2 text-[#F2EBDD]/80 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded-none border-[#185844] text-[#B68A4F] focus:ring-0"
                          />
                          <span>Recordar mi sesión</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail('lucia.paredes@consultoria.pe');
                            setLoginPassword('demo1234');
                          }}
                          className="text-[#B68A4F] hover:underline text-[11px] font-semibold"
                        >
                          Cargar credenciales sugeridas
                        </button>
                      </div>

                      {/* Botón Principal de Iniciar Sesión */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[#B68A4F] hover:bg-[#c79857] text-[#102F27] font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all transform active:scale-98 shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>{isSubmitting ? 'Verificando...' : 'Iniciar Sesión en el Sistema'}</span>
                      </button>
                    </form>

                    {/* Divisor */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#185844]" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#102F27] px-2 text-[10px] text-[#B68A4F] font-bold tracking-widest">
                          o acceso demo inmediato
                        </span>
                      </div>
                    </div>

                    {/* Botones de Acceso Rápido con 1 clic */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleQuickDemoUser}
                        className="w-full py-2.5 px-3 bg-[#185844] hover:bg-[#124233] border border-[#B68A4F]/60 text-[#F2EBDD] text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-left shadow-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-[#B68A4F]" />
                          <span>Ingresar como Consultor Senior (Ing. Rocío Paredes)</span>
                        </div>
                        <span className="text-[10px] text-[#B68A4F] uppercase font-mono">
                          CIP 322074
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleQuickDemoAdmin}
                        className="w-full py-2.5 px-3 bg-[#102F27] hover:bg-[#185844] border border-[#185844] text-[#F2EBDD] text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-[#B68A4F]" />
                          <span>Ingresar como Auditor CIP (Ing. Efrén Alverca)</span>
                        </div>
                        <span className="text-[10px] text-[#B68A4F] uppercase font-mono">
                          CIP 1357422
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleQuickDemoUser}
                        className="w-full py-2 bg-transparent hover:bg-white/5 border border-dashed border-white/20 text-[#F2EBDD]/80 text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#B68A4F]" />
                        <span>Explorar plataforma sin registrarme (Modo Demostración)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ====================================================
                    PESTAÑA 2: FORMULARIO DE REGISTRO DE USUARIO
                ==================================================== */}
                {activeTab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Nombre y Apellidos */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#F2EBDD] uppercase tracking-wider">
                          Nombres y Apellidos *
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={regNombre}
                            onChange={(e) => setRegNombre(e.target.value)}
                            placeholder="Ing. Carlos Vega"
                            className="w-full pl-8 pr-2.5 py-2 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs focus:outline-none placeholder:text-slate-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Correo Electrónico */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#F2EBDD] uppercase tracking-wider">
                          Correo Electrónico *
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="carlos.vega@empresa.com"
                            className="w-full pl-8 pr-2.5 py-2 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs focus:outline-none placeholder:text-slate-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Empresa / Organización Titular */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#F2EBDD] uppercase tracking-wider">
                          Empresa u Organización *
                        </label>
                        <div className="relative">
                          <Building className="w-3.5 h-3.5 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={regOrganizacion}
                            onChange={(e) => setRegOrganizacion(e.target.value)}
                            placeholder="Minera / Planta / Consultora"
                            className="w-full pl-8 pr-2.5 py-2 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs focus:outline-none placeholder:text-slate-500"
                            required
                          />
                        </div>
                      </div>

                      {/* N° CIP (Colegio de Ingenieros del Perú) */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#F2EBDD] uppercase tracking-wider">
                          N° Colegiatura CIP (Opcional)
                        </label>
                        <div className="relative">
                          <Award className="w-3.5 h-3.5 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={regCip}
                            onChange={(e) => setRegCip(e.target.value)}
                            placeholder="Ej. 195430"
                            className="w-full pl-8 pr-2.5 py-2 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs focus:outline-none placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Cargo o Rol */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#F2EBDD] uppercase tracking-wider">
                          Cargo / Especialidad
                        </label>
                        <input
                          type="text"
                          value={regCargo}
                          onChange={(e) => setRegCargo(e.target.value)}
                          placeholder="Especialista Ambiental"
                          className="w-full px-3 py-2 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs focus:outline-none placeholder:text-slate-500"
                        />
                      </div>

                      {/* Teléfono / WhatsApp */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#F2EBDD] uppercase tracking-wider">
                          Teléfono de Contacto
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={regTelefono}
                            onChange={(e) => setRegTelefono(e.target.value)}
                            placeholder="+51 987 654 321"
                            className="w-full pl-8 pr-2.5 py-2 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs focus:outline-none placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contraseñas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#F2EBDD] uppercase tracking-wider">
                          Contraseña *
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Mín. 6 caracteres"
                            className="w-full pl-8 pr-8 py-2 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs focus:outline-none placeholder:text-slate-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showRegPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-[#F2EBDD] uppercase tracking-wider">
                          Confirmar Contraseña *
                        </label>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-[#B68A4F] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            placeholder="Repita la contraseña"
                            className="w-full pl-8 pr-2.5 py-2 bg-black/40 border border-[#185844] focus:border-[#B68A4F] text-white text-xs focus:outline-none placeholder:text-slate-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Términos y compromiso ético ambiental */}
                    <div className="pt-1">
                      <label className="flex items-start space-x-2 text-[11px] text-[#F2EBDD]/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 rounded-none border-[#185844] text-[#B68A4F] focus:ring-0 shrink-0"
                        />
                        <span>
                          Declaro conocer el marco de la <strong>R.M. 089-2023-MINAM</strong> y el{' '}
                          <strong>D.L. 1278</strong> para la formulación de planes técnicos ambientales.
                        </span>
                      </label>
                    </div>

                    {/* Botón de Registro */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#B68A4F] hover:bg-[#c79857] text-[#102F27] font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all transform active:scale-98 shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Registrando...' : 'Completar Registro y Entrar'}</span>
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className="text-xs text-[#B68A4F] hover:underline"
                      >
                        ¿Ya tienes cuenta registrada? Inicia sesión aquí
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Pie de la tarjeta */}
              <div className="px-5 py-3 bg-black/40 border-t border-[#185844] text-center">
                <p className="text-[10px] text-[#F2EBDD]/60">
                  EcoSerpentis Consulting Perú · Plataforma de Ingeniería y Gestión de Residuos No Municipales
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ====================================================
          PIE DE PÁGINA INFERIOR
      ==================================================== */}
      <footer className="relative z-20 w-full px-4 sm:px-8 py-3 border-t border-white/10 bg-[#102F27]/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#F2EBDD]/70 gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-white">EcoSerpentis Consulting Perú</span>
          <span>·</span>
          <span>R.M. 089-2023-MINAM · D.L. 1278 · NTP 900.058:2019</span>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href={SOCIAL_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#B68A4F] transition-colors"
          >
            WhatsApp
          </a>
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#B68A4F] transition-colors"
          >
            Instagram
          </a>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#B68A4F] transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </footer>

      {/* Modal de visualización de captura y video institucional */}
      <LogoPreviewModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        logoUrl={customLogo}
        videoUrl={customVideo}
        initialTab={modalInitialTab}
      />
    </div>
  );
};
