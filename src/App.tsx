import React, { useState, useEffect } from 'react';
import { Navbar, NavTabType } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CreatePlanWizard } from './components/CreatePlanWizard';
import { ReviewPlanModule } from './components/ReviewPlanModule';
import { CommitmentsMatrixView } from './components/CommitmentsMatrixView';
import { NormativeMatrixView } from './components/NormativeMatrixModal';
import { ManualDeUsoView } from './components/ManualDeUsoView';
import { TeamView } from './components/TeamView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthCoverPortal } from './components/AuthCoverPortal';
import { SocialLinks, SOCIAL_LINKS } from './components/SocialLinks';
import { FICTITIOUS_DEMO_PMMRS } from './data/demoData';
import {
  X,
  HelpCircle,
  FileText,
  SearchCheck,
  BookOpen,
  ClipboardCheck,
  Sparkles,
  BookCheck,
} from 'lucide-react';

const VALID_TABS: NavTabType[] = ['home', 'create', 'review', 'commitments', 'matrix', 'manual', 'team'];

function PmmrsAppContent() {
  const [activeTab, setActiveTabState] = useState<NavTabType>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as NavTabType;
      if (VALID_TABS.includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('pmrs_active_tab') as NavTabType;
      if (saved && VALID_TABS.includes(saved)) {
        return saved;
      }
    }
    return 'home';
  });

  const setActiveTab = (tab: NavTabType) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pmrs_active_tab', tab);
        if (window.location.hash.replace('#', '') !== tab) {
          window.location.hash = tab === 'home' ? '' : tab;
        }
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '') as NavTabType;
        if (VALID_TABS.includes(hash)) {
          setActiveTabState(hash);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Estado de la barra lateral: abierta inicialmente en computadoras (>= 1024px), cerrada en teléfonos y tabletas (< 1024px)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        const saved = sessionStorage.getItem('pmrs_desktop_sidebar_open');
        return saved !== null ? saved === 'true' : true;
      }
      return false;
    }
    return true;
  });

  // Manejar tecla Escape para cerrar en teléfonos y tabletas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Manejar redimensionamiento de ventana
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const isDesktop = window.innerWidth >= 1024;
        if (isDesktop) {
          const saved = sessionStorage.getItem('pmrs_desktop_sidebar_open');
          setIsSidebarOpen(saved !== null ? saved === 'true' : true);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        sessionStorage.setItem('pmrs_desktop_sidebar_open', String(next));
      }
      return next;
    });
  };

  // Check server health and Gemini API key status
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerOnline(true);
        setHasGeminiKey(Boolean(data.hasGeminiKey));
      })
      .catch((err) => {
        console.warn('Backend local check:', err);
        setServerOnline(false);
      });
  }, []);

  const { currentUser, isAuthenticated } = useAuth();

  const handleStartDemo = () => {
    try {
      localStorage.setItem('pmrs_form_data', JSON.stringify(FICTITIOUS_DEMO_PMMRS));
      window.dispatchEvent(new CustomEvent('pmrs_load_demo_event', { detail: FICTITIOUS_DEMO_PMMRS }));
    } catch (e) {
      console.error('Error al guardar datos demo:', e);
    }
    setActiveTab('create');
  };

  // Si el usuario no ha iniciado sesión o no se ha registrado, mostrar la Portada de Inicio de Sesión con el video MP4
  if (!isAuthenticated) {
    return <AuthCoverPortal onSuccessLogin={() => setActiveTab('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans text-[#102F27] selection:bg-[#F2EBDD] selection:text-[#102F27] overflow-x-hidden">
      {/* Sidebar de navegación vertical fija (Desktop) y menú colapsable (Móvil) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHelp={() => setIsHelpOpen(true)}
        isHelpOpen={isHelpOpen}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        toggleSidebar={toggleSidebar}
        onStartDemo={handleStartDemo}
      />

      {/* Contenedor del contenido principal: Se expande fluidamente (250ms) al ocultar la barra */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-[margin] duration-[250ms] ease-in-out ${
          activeTab === 'home'
            ? 'ml-0'
            : isSidebarOpen
            ? 'lg:ml-60 ml-0 pt-14'
            : 'ml-0 pt-14'
        }`}
      >
        <main className="flex-1 w-full">
          <div className={activeTab === 'home' ? 'block' : 'hidden'}>
            <HomeView
              onStartCreate={() => setActiveTab('create')}
              onStartReview={() => setActiveTab('review')}
              onOpenNormativeMatrix={() => setActiveTab('matrix')}
              onOpenManual={() => setActiveTab('manual')}
              onOpenTeam={() => setActiveTab('team')}
            />
          </div>

          <div
            className={`max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${
              activeTab !== 'home' ? 'block' : 'hidden'
            }`}
          >
            <div className={activeTab === 'create' ? 'block' : 'hidden'}>
              <CreatePlanWizard />
            </div>

            <div className={activeTab === 'review' ? 'block' : 'hidden'}>
              <ReviewPlanModule
                serverOnline={serverOnline}
                hasGeminiKey={hasGeminiKey}
              />
            </div>

            <div className={activeTab === 'commitments' ? 'block' : 'hidden'}>
              <CommitmentsMatrixView
                onNavigateToCreate={() => setActiveTab('create')}
                onNavigateToReview={() => setActiveTab('review')}
              />
            </div>

            <div className={activeTab === 'matrix' ? 'block' : 'hidden'}>
              <NormativeMatrixView />
            </div>

            <div className={activeTab === 'team' ? 'block' : 'hidden'}>
              <TeamView
                onGoToCreate={() => setActiveTab('create')}
                onGoToReview={() => setActiveTab('review')}
                onGoToManual={() => setActiveTab('manual')}
              />
            </div>

            <div className={activeTab === 'manual' ? 'block' : 'hidden'}>
              <ManualDeUsoView
                onGoToCreate={() => setActiveTab('create')}
                onGoToReview={() => setActiveTab('review')}
                onGoToCommitments={() => setActiveTab('commitments')}
              />
            </div>
          </div>
        </main>

        {/* Footer: Visible en módulos de trabajo e informativo, con enlaces a redes oficiales */}
        <footer
          className={`bg-[#102F27] border-t border-[#185844] text-[#F2EBDD]/80 text-xs py-6 mt-auto ${
            activeTab === 'home' ? 'hidden' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-sm">PMMRS</span>
                <span className="text-[#B68A4F] font-extrabold text-sm">EcoSerpentis Consulting Perú</span>
                <span className="text-[#78947F] text-xs hidden sm:inline">| R.M. 089-2023-MINAM</span>
              </div>

              {/* Redes Sociales Oficiales */}
              <SocialLinks variant="footer" />
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
              <p>
                Gestión Integral de Residuos No Municipales · Asesoría técnica ambiental especializada.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveTab('manual')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Manual de uso
                </button>
                <span>·</span>
                <button
                  onClick={() => setActiveTab('team')}
                  className="hover:text-[#B68A4F] font-semibold transition-colors cursor-pointer"
                >
                  Equipo de Profesionales
                </button>
                <span>·</span>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  WhatsApp Soporte
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* MODAL DE AYUDA Y GUÍA TÉCNICA */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-none text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-none bg-[#102F27] text-[#B68A4F] border border-[#B68A4F]/40">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Guía de Uso de PMMRS EcoSerpentis Consulting Perú
                </h3>
                <p className="text-xs text-slate-500">
                  Herramienta de ingeniería ambiental para generadores no municipales.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-2">
                  <BookCheck className="w-4 h-4 text-[#185844]" />
                  <span>Manual de Uso Completo del Sistema</span>
                </div>
                <p className="text-xs text-slate-600">
                  Hemos incorporado una guía detallada con los 12 pasos oficiales de la R.M. 089-2023-MINAM, código de colores de la NTP 900.058:2019, plazos de reporte SIGERSOL y roles de usuario.
                </p>
                <button
                  onClick={() => {
                    setIsHelpOpen(false);
                    setActiveTab('manual');
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#185844] hover:text-[#102F27] underline underline-offset-2 cursor-pointer pt-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Abrir Manual de Uso Oficial</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#185844]" />
                  <span>Módulo 1: Elaborar un PMMRS</span>
                </div>
                <p className="text-xs text-slate-600">
                  Guía al usuario en 12 pasos oficiales estructurados según la <strong>R.M. N.º 089-2023-MINAM</strong>. Incluye validaciones en tiempo real (unidades, balances, códigos Basilea, código de colores NTP 900.058:2019) y genera un documento formal editable en <strong>Word (.docx)</strong> y <strong>PDF</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-2">
                  <SearchCheck className="w-4 h-4 text-sky-600" />
                  <span>Módulo 2: Revisar un PMMRS</span>
                </div>
                <p className="text-xs text-slate-600">
                  Permite cargar un PDF con texto seleccionable, extrae el texto página por página, evalúa el cumplimiento normativo preliminar, detecta inconsistencias cuantitativas entre cuadros y genera un informe técnico de observaciones editable y descargable en Word y PDF.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center space-x-2">
                  <ClipboardCheck className="w-4 h-4 text-[#185844]" />
                  <span>Módulo 3: Matriz de Compromisos</span>
                </div>
                <p className="text-xs text-slate-600">
                  Identifica, organiza, audita la calidad de formulación y detecta posibles contradicciones en los compromisos asumidos por el titular dentro del PMMRS. Permite exportar a <strong>Excel / CSV</strong>, <strong>Word (.docx)</strong> y <strong>PDF</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
                <strong>Alerta crítica en plaguicidas:</strong>
                <p>
                  Conforme al D.S. 014-2017-MINAM (Art. 72) y D.L. 1278 (Art. 30), los envases de plaguicidas tras triple lavado son residuos peligrosos y no deben reutilizarse para uso general.
                </p>
              </div>

              {/* Redes y Contacto */}
              <div className="p-3 bg-[#102F27] border border-[#185844] text-[#F2EBDD] space-y-2">
                <span className="text-[11px] font-bold text-[#B68A4F] uppercase tracking-wider block">
                  Redes Oficiales & Soporte EcoSerpentis
                </span>
                <SocialLinks variant="footer" className="text-[#F2EBDD]" />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsHelpOpen(false);
                    handleStartDemo();
                  }}
                  className="px-3.5 py-2 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F] font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B68A4F]" />
                  <span>Probar demo en Módulo 1</span>
                </button>
                <button
                  onClick={() => {
                    setIsHelpOpen(false);
                    setActiveTab('create');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Crear en blanco
                </button>
                <button
                  onClick={() => {
                    setIsHelpOpen(false);
                    setActiveTab('review');
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Revisar Plan en Módulo 2
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PmmrsAppContent />
    </AuthProvider>
  );
}
