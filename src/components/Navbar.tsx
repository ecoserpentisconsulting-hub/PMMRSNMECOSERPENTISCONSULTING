import React, { useState, useEffect } from 'react';
import {
  Home,
  FileText,
  SearchCheck,
  ClipboardCheck,
  BookOpen,
  HelpCircle,
  Menu,
  Sparkles,
  Users,
  BookCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SocialLinks } from './SocialLinks';
import { LogoPreviewModal } from './LogoPreviewModal';

export type NavTabType =
  | 'home'
  | 'create'
  | 'review'
  | 'commitments'
  | 'matrix'
  | 'team'
  | 'manual';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  onOpenHelp?: () => void;
  isHelpOpen?: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  onStartDemo?: () => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenHelp,
  isHelpOpen = false,
  isSidebarOpen,
  setIsSidebarOpen,
  toggleSidebar,
  onStartDemo,
  onOpenAuth,
}) => {
  const { currentUser, customLogo, customVideo, isAdmin, logout } = useAuth();
  const safeLogo = customLogo && customLogo.includes('WhatsApp_Image_2026-10-01') ? '/logo_transparent.png' : customLogo;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 480);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (tab: NavTabType) => {
    setActiveTab(tab);
    // En teléfonos y tabletas (< 1024px), cerrar al seleccionar una opción
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleHelpClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    if (onOpenHelp) {
      onOpenHelp();
    }
  };

  const handleDemoClick = () => {
    if (onStartDemo) {
      onStartDemo();
    } else {
      setActiveTab('create');
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    {
      id: 'home' as const,
      label: 'Inicio',
      icon: Home,
      isActive: activeTab === 'home' && !isHelpOpen,
      onClick: () => handleNavClick('home'),
    },
    {
      id: 'create' as const,
      label: 'Elaborar PMMRS',
      icon: FileText,
      isActive: activeTab === 'create' && !isHelpOpen,
      onClick: () => handleNavClick('create'),
    },
    {
      id: 'review' as const,
      label: 'Revisar PMMRS',
      icon: SearchCheck,
      isActive: activeTab === 'review' && !isHelpOpen,
      onClick: () => handleNavClick('review'),
    },
    {
      id: 'commitments' as const,
      label: 'Compromisos',
      icon: ClipboardCheck,
      isActive: activeTab === 'commitments' && !isHelpOpen,
      onClick: () => handleNavClick('commitments'),
    },
    {
      id: 'matrix' as const,
      label: 'Marco normativo',
      icon: BookOpen,
      isActive: activeTab === 'matrix' && !isHelpOpen,
      onClick: () => handleNavClick('matrix'),
    },
    {
      id: 'team' as const,
      label: 'Equipo Profesional',
      icon: Users,
      isActive: activeTab === 'team' && !isHelpOpen,
      onClick: () => handleNavClick('team'),
    },
    {
      id: 'manual' as const,
      label: 'Manual de uso',
      icon: BookCheck,
      isActive: activeTab === 'manual' && !isHelpOpen,
      onClick: () => handleNavClick('manual'),
    },
  ];

  // EN LA PÁGINA DE INICIO: Barra lateral fija transparente sobre el video
  if (activeTab === 'home') {
    return (
      <>
        <aside
          className="fixed top-0 bottom-0 left-0 z-40 h-screen w-60 text-white flex flex-col justify-between select-none rounded-none shadow-none bg-slate-950/40 md:bg-transparent border-r border-white/10 overflow-y-auto"
          aria-label="Navegación principal de PMMRS"
        >
          {/* PARTE SUPERIOR: IDENTIDAD Y MARCA */}
          <div className="flex flex-col">
            <div className="p-5 pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3 text-left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLogoModalOpen(true);
                  }}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] p-0.5 shrink-0 cursor-pointer"
                  title="Haz clic para ver el logotipo en grande (Pasa el cursor para animar)"
                  aria-label="Ver logotipo corporativo en grande"
                >
                  <img
                    src={safeLogo}
                    alt="EcoSerpentis Consulting"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#B68A4F] ring-2 ring-[#185844] object-cover bg-black shrink-0 shadow-md hover-logo-motion"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className="flex flex-col min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] cursor-pointer"
                  aria-label="Ir a Inicio - PMMRS EcoSerpentis Consulting Perú"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-base tracking-tight text-white leading-tight drop-shadow-xs">
                      PMMRS
                    </span>
                    <span className="px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider bg-[#102F27] text-[#B68A4F] border border-[#B68A4F] rounded-none">
                      NO MUNICIPALES
                    </span>
                  </div>
                  <span className="text-[#B68A4F] font-bold text-xs leading-tight tracking-tight mt-0.5 truncate drop-shadow-xs max-w-[130px]">
                    EcoSerpentis Consulting ...
                  </span>
                </button>
              </div>

              <p className="mt-3 text-[10px] text-[#F2EBDD]/70 leading-tight">
                R.M. 089-2023-MINAM · D.L. 1278
              </p>
            </div>

          {/* LISTA DE NAVEGACIÓN VERTICAL */}
          <nav className="p-3 space-y-1" aria-label="Secciones del sistema">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`w-full flex items-center space-x-3 py-2.5 px-3 rounded-none text-xs sm:text-sm font-medium transition-colors duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] cursor-pointer ${
                    item.isActive
                      ? 'border-l-[3px] border-[#B68A4F] bg-[#185844]/60 text-[#F2EBDD] font-semibold backdrop-blur-xs'
                      : 'border-l-[3px] border-transparent text-[#F2EBDD]/80 hover:text-white hover:bg-white/10'
                  }`}
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      item.isActive ? 'text-[#B68A4F]' : 'text-[#78947F]'
                    }`}
                  />
                  <span className="truncate drop-shadow-xs">{item.label}</span>
                </button>
              );
            })}

            {/* OPCIÓN: AYUDA */}
            <button
              onClick={handleHelpClick}
              className={`w-full flex items-center space-x-3 py-2.5 px-3 rounded-none text-xs sm:text-sm font-medium transition-colors duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] cursor-pointer ${
                isHelpOpen
                  ? 'border-l-[3px] border-[#B68A4F] bg-[#185844]/60 text-[#F2EBDD] font-semibold backdrop-blur-xs'
                  : 'border-l-[3px] border-transparent text-[#F2EBDD]/80 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Abrir guía de ayuda técnica"
            >
              <HelpCircle
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isHelpOpen ? 'text-[#B68A4F]' : 'text-[#78947F]'
                }`}
              />
              <span className="truncate drop-shadow-xs">Ayuda Rápida</span>
            </button>
          </nav>
        </div>

        {/* PARTE INFERIOR: REDES SOCIALES, DEMO Y PRUEBAS */}
        <div className="p-4 space-y-2.5 border-t border-white/10 bg-black/30 shrink-0">
          {currentUser && (
            <div className="p-2.5 bg-[#185844]/80 border border-[#B68A4F]/60 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#B68A4F] font-bold uppercase tracking-wider">
                  Usuario Activo
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {currentUser.nombre}
              </p>
              {currentUser.cip && (
                <p className="text-[10px] text-[#F2EBDD]/80 font-mono truncate">
                  {currentUser.cip}
                </p>
              )}
            </div>
          )}

          <SocialLinks variant="sidebar" />

          <button
            type="button"
            onClick={handleDemoClick}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-none bg-[#185844] hover:bg-[#102F27] text-[#F2EBDD] border border-[#B68A4F] font-bold text-xs shadow-md transition-all transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#B68A4F]" />
            <span>Probar demo</span>
          </button>
        </div>
      </aside>

      {/* PARTE SUPERIOR DERECHA (INICIO): Usuario activo y Cerrar sesión */}
      <div className="fixed top-3.5 right-4 z-50 flex items-center space-x-2">
        {currentUser && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#102F27]/90 border border-[#B68A4F]/60 text-xs shadow-md backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[#F2EBDD] truncate max-w-[140px]" title={currentUser.nombre}>
              {currentUser.nombre.split(' ')[0]} {currentUser.nombre.split(' ')[1] || ''}
            </span>
          </div>
        )}
        {currentUser && (
          <button
            type="button"
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#102F27]/90 hover:bg-[#185844] border border-[#B68A4F]/60 text-xs text-[#F2EBDD] transition-colors cursor-pointer shadow-md backdrop-blur-xs"
            title="Cerrar sesión e ir a la portada de inicio de sesión"
          >
            <LogOut className="w-3.5 h-3.5 text-[#B68A4F]" />
            <span className="hidden md:inline font-medium">Cerrar sesión</span>
          </button>
        )}
      </div>

      <LogoPreviewModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        logoUrl={customLogo}
        videoUrl={customVideo}
      />
    </>
  );
}

  return (
    <>
      {/* ====================================================
          1. BARRA SUPERIOR FIJA (MÓDULOS INTERNOS)
          Ocupa todo el ancho, z-50, h-14 (56px).
      ==================================================== */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-[#102F27] border-b border-[#185844] text-[#F2EBDD] flex items-center justify-between px-3 sm:px-4 shadow-sm">
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
          {/* BOTÓN HAMBURGUESA */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 sm:p-2 rounded-none text-[#F2EBDD] hover:text-white hover:bg-[#185844] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] cursor-pointer shrink-0"
            aria-label={isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
            title={isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
          >
            <Menu className="w-5 h-5 text-[#F2EBDD]" />
          </button>

          {/* Logotipo e Identidad de la Plataforma */}
          <div className="flex items-center space-x-2.5 text-left p-1 truncate">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLogoModalOpen(true);
              }}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] p-0.5 shrink-0 cursor-pointer"
              title="Haz clic para ver el logotipo en grande (Pasa el cursor para animar)"
              aria-label="Ver logotipo corporativo en grande"
            >
              <img
                src={safeLogo}
                alt="EcoSerpentis Consulting"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#B68A4F] ring-2 ring-[#185844] object-cover bg-black shrink-0 shadow-md hover-logo-motion"
              />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="flex flex-col truncate text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] cursor-pointer"
              aria-label="Ir a Inicio"
            >
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white leading-tight">PMMRS</span>
                <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-[#102F27] text-[#B68A4F] border border-[#B68A4F] rounded-none truncate">
                  NO MUNICIPALES
                </span>
              </div>
              <span className="text-[#B68A4F] font-bold text-[11px] leading-tight truncate">
                EcoSerpentis Consulting Perú
              </span>
            </button>
          </div>
        </div>

        {/* Extremo derecho: Usuario activo, Salir, Acceso a Equipo, Botón Demo */}
        <div className="flex items-center space-x-2 shrink-0">
          {currentUser && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-[#185844]/60 border border-[#B68A4F]/40 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-[#F2EBDD] truncate max-w-[130px]" title={currentUser.nombre}>
                {currentUser.nombre.split(' ')[0]} {currentUser.nombre.split(' ')[1] || ''}
              </span>
            </div>
          )}

          {currentUser && (
            <button
              type="button"
              onClick={logout}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#102F27] hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-xs text-[#F2EBDD] transition-colors cursor-pointer"
              title="Cerrar sesión e ir a la portada de acceso"
            >
              <LogOut className="w-3.5 h-3.5 text-[#B68A4F]" />
              <span className="hidden md:inline">Cerrar sesión</span>
            </button>
          )}

          {/* Botón de Acceso Rápido al Equipo Profesional */}
          <button
            type="button"
            onClick={() => handleNavClick('team')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 border text-xs transition-colors cursor-pointer ${
              activeTab === 'team'
                ? 'bg-[#185844] border-[#B68A4F] text-[#F2EBDD]'
                : 'bg-[#185844]/60 hover:bg-[#185844] border-[#B68A4F]/40 text-[#F2EBDD]'
            }`}
            title="Ver equipo de profesionales especializados"
          >
            <Users className="w-3.5 h-3.5 text-[#B68A4F]" />
            <span className="font-semibold text-xs text-[#F2EBDD]">Equipo</span>
          </button>

          {onStartDemo && (
            <button
              type="button"
              onClick={handleDemoClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-none bg-[#185844] hover:bg-[#124233] text-[#F2EBDD] border border-[#B68A4F] text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow-xs"
              title="Cargar datos de demostración (Valle Verde S.A.C.)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B68A4F]" />
              <span className="hidden sm:inline">Demo</span>
            </button>
          )}

          <span className="hidden md:inline-flex items-center px-2.5 py-1 text-[11px] font-medium text-[#F2EBDD]/80 bg-[#185844]/40 border border-[#185844] rounded-none">
            Ámbito No Municipal
          </span>
        </div>
      </header>

      {/* ====================================================
          2. CAPA OSCURA SEMITRANSPARENTE (CELULAR / TABLETA < 1024px)
      ==================================================== */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed top-14 bottom-0 left-0 right-0 z-20 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-[250ms]"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ====================================================
          3. MENÚ LATERAL (MÓDULOS INTERNOS)
      ==================================================== */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-30 h-[calc(100vh-3.5rem)] w-60 bg-[#102F27] border-r border-[#185844] text-[#F2EBDD] flex flex-col justify-between select-none shadow-xl transition-all duration-[250ms] ease-in-out ${
          isSidebarOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        aria-label="Navegación principal de PMMRS"
      >
        {/* PARTE SUPERIOR: CABECERA TÉCNICA Y OPCIONES */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-4 py-3 border-b border-[#185844]/70">
            <span className="text-[11px] font-bold text-[#B68A4F] uppercase tracking-wider">
              Navegación del Plan
            </span>
            <p className="text-[10px] text-[#F2EBDD]/70 leading-tight mt-0.5">
              R.M. 089-2023-MINAM · D.L. 1278
            </p>
          </div>

          {/* LISTA DE NAVEGACIÓN VERTICAL */}
          <nav className="p-3 space-y-1" aria-label="Secciones del sistema">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`w-full flex items-center space-x-3 py-2.5 px-3 rounded-none text-xs sm:text-sm font-medium transition-colors duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] cursor-pointer ${
                    item.isActive
                      ? 'border-l-[3px] border-[#B68A4F] bg-[#185844] text-[#F2EBDD] font-semibold'
                      : 'border-l-[3px] border-transparent text-[#F2EBDD]/80 hover:text-white hover:bg-[#185844]/50'
                  }`}
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      item.isActive ? 'text-[#B68A4F]' : 'text-[#78947F]'
                    }`}
                  />
                  <span className="truncate drop-shadow-xs">{item.label}</span>
                </button>
              );
            })}

            {/* OPCIÓN: AYUDA RÁPIDA */}
            <button
              onClick={handleHelpClick}
              className={`w-full flex items-center space-x-3 py-2.5 px-3 rounded-none text-xs sm:text-sm font-medium transition-colors duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68A4F] cursor-pointer ${
                isHelpOpen
                  ? 'border-l-[3px] border-[#B68A4F] bg-[#185844] text-[#F2EBDD] font-semibold'
                  : 'border-l-[3px] border-transparent text-[#F2EBDD]/80 hover:text-white hover:bg-[#185844]/50'
              }`}
              aria-label="Abrir guía de ayuda técnica"
            >
              <HelpCircle
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isHelpOpen ? 'text-[#B68A4F]' : 'text-[#78947F]'
                }`}
              />
              <span className="truncate drop-shadow-xs">Ayuda Rápida</span>
            </button>
          </nav>
        </div>

        {/* PARTE INFERIOR: USUARIO, REDES SOCIALES, DEMO Y PRUEBAS */}
        <div className="p-4 space-y-2.5 border-t border-[#185844]/70 bg-[#0A221C] shrink-0">
          {currentUser && (
            <div className="p-2.5 bg-[#185844]/80 border border-[#B68A4F]/60 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#B68A4F] font-bold uppercase tracking-wider">
                  Usuario Activo
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {currentUser.nombre}
              </p>
              {currentUser.cip && (
                <p className="text-[10px] text-[#F2EBDD]/80 font-mono truncate">
                  {currentUser.cip}
                </p>
              )}
            </div>
          )}

          <SocialLinks variant="sidebar" />

          <button
            type="button"
            onClick={handleDemoClick}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-none bg-[#185844] hover:bg-[#124233] text-[#F2EBDD] border border-[#B68A4F] font-bold text-xs transition-all transform active:scale-95 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#B68A4F]" />
            <span>Probar demo</span>
          </button>
        </div>
      </aside>

      <LogoPreviewModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        logoUrl={customLogo}
        videoUrl={customVideo}
      />
    </>
  );
};
