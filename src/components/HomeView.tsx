import React, { useState } from 'react';
import { SOCIAL_LINKS } from './SocialLinks';
import { BookOpen, Users, Play, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LogoPreviewModal } from './LogoPreviewModal';

interface HomeViewProps {
  onStartCreate?: () => void;
  onStartReview?: () => void;
  onOpenNormativeMatrix?: () => void;
  onOpenManual?: () => void;
  onOpenTeam?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartCreate,
  onStartReview,
  onOpenNormativeMatrix,
  onOpenManual,
  onOpenTeam,
}) => {
  const { customLogo, customVideo } = useAuth();
  const safeLogo = customLogo && customLogo.includes('WhatsApp_Image_2026-10-01') ? '/logo_transparent.png' : customLogo;
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'image' | 'video'>('image');
  const [isJumping, setIsJumping] = useState(false);

  const handleHeroLogoClick = (tab: 'image' | 'video' = 'image') => {
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 1200);
    setModalInitialTab(tab);
    setIsLogoModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen animate-fadeIn flex flex-col justify-center">
      {/* ====================================================
          PORTADA PRINCIPAL DE UNA SOLA PANTALLA
          El video y el overlay cubren TODO el lienzo
          Navegación lateral flotante fija + Mensaje central
      ==================================================== */}
      <section className="relative w-full min-h-screen rounded-none overflow-hidden text-white shadow-none flex items-center">
        {/* Background Video a ancho completo desde x: 0 con autoplay, loop, muted, playsInline sin controles */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-none">
          <video
            src={customVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            style={{ filter: 'brightness(1.08)' }}
            className="w-full h-full object-cover rounded-none"
          />
        </div>

        {/* Overlay oscuro sobre el video con degradado direccional para asegurar legibilidad */}
        <div
          className="absolute inset-0 pointer-events-none rounded-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(10, 34, 28, 0.88) 0%, rgba(16, 47, 39, 0.72) 35%, rgba(10, 34, 28, 0.55) 70%, rgba(5, 20, 16, 0.45) 100%)',
          }}
        />

        {/* Hero Content Container: Desplazado a la derecha de la sidebar fija transparente (md:pl-68 lg:pl-76) */}
        <div className="relative z-10 w-full px-6 sm:px-10 md:pl-68 lg:pl-76 md:pr-10 lg:pr-16 py-16 sm:py-20 lg:py-24">
          <div className="max-w-4xl space-y-5 sm:space-y-6">
            {/* ====================================================
                LOGOTIPO EMBLEMA HERO
                Medallón interactivo con doble aro oro y esmeralda + Animación al pasar el mouse
            ==================================================== */}
            <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:gap-5 pb-1">
              {/* Medallón circular: al pasar el mouse se mueve/anima dinámicamente, al hacer clic abre vista previa completa */}
              <button
                type="button"
                onClick={() => handleHeroLogoClick('image')}
                className="relative group focus:outline-none cursor-pointer select-none shrink-0"
                title="Pasa el mouse para animar o haz clic para ver en grande"
                aria-label="Logotipo oficial de EcoSerpentis Consulting Perú"
              >
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 border-[#B68A4F] ring-4 ring-[#185844] shadow-2xl overflow-hidden bg-black transition-all duration-300 ease-out hover-logo-motion ${
                    isJumping ? 'animate-bounce ring-8 ring-[#B68A4F]' : ''
                  }`}
                >
                  <img
                    src={safeLogo}
                    alt="EcoSerpentis Consulting Perú"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>

              {/* Badges y Textos Corporativos con la nueva paleta elegante */}
              <div className="flex flex-col space-y-1 sm:space-y-1.5">
                <div className="self-start">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-none bg-[#102F27]/90 border border-[#B68A4F] text-[#B68A4F] text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-sm">
                    ECOSERPENTIS CONSULTING PERÚ
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-[#F2EBDD] tracking-tight drop-shadow-sm">
                  Ingeniería Ambiental & Residuos No Municipales
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleHeroLogoClick('image')}
                    className="text-xs sm:text-[13px] font-bold text-[#B68A4F] hover:text-[#d4af37] flex items-center space-x-1.5 drop-shadow-xs cursor-pointer text-left transition-colors"
                  >
                    <span className="text-sm font-extrabold leading-none">+</span>
                    <span>Pasa el mouse para animar o haz clic para ver captura</span>
                  </button>
                  <span className="text-[#B68A4F]/60 text-xs hidden sm:inline">•</span>
                  <button
                    type="button"
                    onClick={() => handleHeroLogoClick('video')}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#185844]/80 hover:bg-[#185844] border border-[#B68A4F]/70 text-[#F2EBDD] text-xs font-bold transition-all cursor-pointer shadow-xs hover:border-[#B68A4F]"
                    title="Reproducir video institucional en este módulo"
                  >
                    <Play className="w-3 h-3 text-[#B68A4F] fill-[#B68A4F]" />
                    <span>Ver Video Institucional</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Título Principal + Nombre de la Empresa con jerarquía diferenciada y acento dorado */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[58px] xl:text-[64px] font-extrabold tracking-tight text-white leading-[1.08] drop-shadow-sm max-w-4xl">
              Plan de Minimización y Manejo de Residuos Sólidos No Municipales
              <span className="text-[#B68A4F] block mt-2.5 sm:mt-3 text-xl sm:text-2xl md:text-3xl lg:text-[36px] xl:text-[40px] font-bold leading-[1.15] tracking-normal">
                EcoSerpentis Consulting Perú
              </span>
            </h1>

            {/* Subtítulo */}
            <h2 className="text-lg sm:text-xl lg:text-[25px] font-bold text-[#F2EBDD]/90 leading-snug drop-shadow-xs max-w-2xl">
              Elabora y revisa Planes de Minimización y Manejo de Residuos Sólidos No Municipales
            </h2>

            {/* Botones de acción rápida: Manual de Uso y Acceso de Usuario / Admin */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onOpenManual && (
                <button
                  type="button"
                  onClick={onOpenManual}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#102F27]/80 hover:bg-[#185844] text-[#F2EBDD] border border-[#B68A4F]/60 text-xs sm:text-sm font-bold backdrop-blur-xs transition-all cursor-pointer shadow-sm"
                >
                  <BookOpen className="w-4 h-4 text-[#B68A4F]" />
                  <span>Manual de uso</span>
                </button>
              )}

              {onOpenTeam && (
                <button
                  type="button"
                  onClick={onOpenTeam}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F] text-xs sm:text-sm font-bold backdrop-blur-xs transition-all cursor-pointer shadow-md"
                  title="Ver equipo de profesionales especializados y colegiados"
                >
                  <Users className="w-4 h-4 text-[#B68A4F]" />
                  <span>Equipo de Profesionales</span>
                </button>
              )}
            </div>

            {/* Redes Sociales Oficiales y Canales de Contacto con paleta corporativa */}
            <div className="pt-4 border-t border-white/15 space-y-2">
              <span className="text-[11px] font-bold text-[#B68A4F] uppercase tracking-wider block">
                Canales oficiales EcoSerpentis Consulting:
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* WhatsApp */}
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#102F27]/85 hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-[#F2EBDD] text-xs font-semibold backdrop-blur-xs transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-[#25D366]" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.529 1.748.78 2.796.781 3.182 0 5.768-2.587 5.768-5.766.001-3.18-2.585-5.768-5.768-5.768zm3.376 8.163c-.141.397-.821.765-1.144.812-.323.047-.736.082-2.378-.588-1.973-.807-3.23-2.799-3.328-2.93-.099-.131-.796-1.061-.796-2.024 0-.963.504-1.436.683-1.631.179-.196.39-.245.52-.245.131 0 .262.001.376.007.121.006.282-.046.441.336.164.393.56 1.365.609 1.464.049.099.082.214.016.345-.065.131-.098.213-.196.327-.099.115-.208.257-.297.345-.099.098-.202.205-.087.402.115.197.512.846 1.099 1.369.757.674 1.394.883 1.591.982.197.098.312.082.427-.049.115-.131.492-.573.623-.77.131-.197.262-.164.443-.098.18.066 1.148.541 1.345.64.197.098.328.147.377.23.049.082.049.475-.092.872z" />
                  </svg>
                  <span>Consulta WhatsApp</span>
                </a>

                {/* Instagram Oficial (Enlace directo con parámetro de contacto) */}
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#102F27]/85 hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-[#F2EBDD] hover:text-[#B68A4F] text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
                  title="Instagram: @ecoserpentisconsulting"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-[#E1306C]" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Instagram (@ecoserpentisconsulting)</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={SOCIAL_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#102F27]/85 hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-[#F2EBDD] hover:text-[#B68A4F] text-xs font-semibold backdrop-blur-xs transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>

                {/* Correo */}
                <a
                  href={SOCIAL_LINKS.email}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#102F27]/85 hover:bg-[#185844] border border-[#185844] hover:border-[#B68A4F]/60 text-[#F2EBDD] hover:text-[#B68A4F] text-xs font-semibold backdrop-blur-xs transition-colors"
                >
                  <svg className="w-3.5 h-3.5 stroke-current text-[#B68A4F]" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>ecoserpentisconsulting@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL DE VISTA PREVIA DEL LOGOTIPO Y VIDEO INSTITUCIONAL */}
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
