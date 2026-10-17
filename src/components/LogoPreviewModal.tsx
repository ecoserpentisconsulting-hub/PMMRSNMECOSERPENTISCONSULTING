import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize,
  Upload,
  Video as VideoIcon,
  Image as ImageIcon,
  Check,
  Film,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface LogoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoUrl: string;
  companyName?: string;
  videoUrl?: string;
  initialTab?: 'image' | 'video';
}

export const LogoPreviewModal: React.FC<LogoPreviewModalProps> = ({
  isOpen,
  onClose,
  logoUrl,
  companyName = 'EcoSerpentis Consulting Perú',
  videoUrl,
  initialTab = 'image',
}) => {
  const { customVideo, setCustomVideo, resetDefaultVideo } = useAuth();
  const effectiveVideoUrl = videoUrl || customVideo;

  const [activeTab, setActiveTab] = useState<'image' | 'video'>(initialTab);
  const [isZoomed, setIsZoomed] = useState(false);

  // Video player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrlValue, setInputUrlValue] = useState('');
  const [videoUploadFeedback, setVideoUploadFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsZoomed(false);
      setShowUrlInput(false);
      setVideoUploadFeedback(null);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Video event handlers
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

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.play().catch(() => {
      setIsPlaying(false);
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // Upload/change custom video
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video válido (.mp4, .webm).');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setCustomVideo(blobUrl);
    setVideoUploadFeedback(`Video local cargado exitosamente: ${file.name}`);
    setTimeout(() => setVideoUploadFeedback(null), 4000);
  };

  const handleApplyUrl = () => {
    if (!inputUrlValue.trim()) return;
    setCustomVideo(inputUrlValue.trim());
    setInputUrlValue('');
    setShowUrlInput(false);
    setVideoUploadFeedback('URL de video aplicada correctamente');
    setTimeout(() => setVideoUploadFeedback(null), 4000);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const sanitizedLogoUrl =
    logoUrl && logoUrl.includes('WhatsApp_Image_2026-10-01')
      ? '/logo_transparent.png'
      : logoUrl || '/logo_transparent.png';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa de captura y video corporativo"
    >
      <div
        className="relative max-w-3xl w-full bg-[#102F27] border border-[#B68A4F]/60 shadow-2xl p-5 sm:p-7 flex flex-col items-center max-h-[92vh] overflow-y-auto text-[#F2EBDD]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#F2EBDD]/70 hover:text-white hover:bg-[#185844] transition-colors cursor-pointer"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="w-full text-center pb-3 mb-3 border-b border-[#185844]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4F] block mb-1">
            Identidad Corporativa Oficial · Medios Institucionales
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[#F2EBDD] tracking-tight">
            {companyName}
          </h3>
          <p className="text-xs text-[#78947F] mt-0.5">
            Gestión Integral de Residuos Sólidos No Municipales · R.M. 089-2023-MINAM
          </p>
        </div>

        {/* Selector de Pestañas: Captura Oficial vs Video Institucional */}
        <div className="w-full flex items-center justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-[#185844] text-[#F2EBDD] border-[#B68A4F] shadow-sm'
                : 'bg-[#0A221C] text-[#F2EBDD]/70 border-[#185844] hover:text-white hover:bg-[#124636]'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#B68A4F]" />
            <span>Logotipo Oficial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-[#185844] text-[#F2EBDD] border-[#B68A4F] shadow-sm'
                : 'bg-[#0A221C] text-[#F2EBDD]/70 border-[#185844] hover:text-white hover:bg-[#124636]'
            }`}
          >
            <Film className="w-4 h-4 text-[#B68A4F]" />
            <span>Video Institucional MP4</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </button>
        </div>

        {/* Feedback de carga de video */}
        {videoUploadFeedback && (
          <div className="w-full mb-3 p-2 bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 text-xs flex items-center space-x-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{videoUploadFeedback}</span>
          </div>
        )}

        {/* ====================================================
            CONTENEDOR DE MEDIOS (IMAGEN / LOGOTIPO O VIDEO)
        ==================================================== */}
        <div className="w-full relative flex flex-col items-center justify-center min-h-[300px] max-h-[58vh] bg-[#0A221C] border border-[#185844] overflow-hidden">
          {activeTab === 'image' ? (
            /* Vista del Logotipo Oficial sin recuadro blanco */
            <div className="w-full h-full flex items-center justify-center p-6 overflow-auto min-h-[300px] select-none">
              <img
                src={sanitizedLogoUrl}
                alt={companyName}
                className={`transition-all duration-300 object-contain max-h-[50vh] drop-shadow-[0_12px_28px_rgba(0,0,0,0.7)] ${
                  isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
                title="Haz clic para alternar zoom"
              />
            </div>
          ) : (
            /* Vista del Video Institucional MP4 */
            <div className="w-full h-full flex flex-col justify-between relative bg-black">
              <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[50vh]">
                <video
                  ref={videoRef}
                  src={effectiveVideoUrl}
                  autoPlay
                  playsInline
                  loop
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={handleTogglePlay}
                  className="w-full h-full max-h-[48vh] object-contain cursor-pointer"
                />

                {/* Botón flotante Play/Pause centrado en pausa */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 border border-[#B68A4F] text-white flex items-center justify-center hover:bg-[#185844]/80 transition-transform hover:scale-110 cursor-pointer shadow-lg"
                    title="Reproducir video"
                  >
                    <Play className="w-7 h-7 text-[#B68A4F] fill-[#B68A4F] ml-1" />
                  </button>
                )}
              </div>

              {/* Barra de Controles de Video Integrada */}
              <div className="w-full bg-[#102F27]/95 border-t border-[#185844] px-4 py-2.5 flex flex-col gap-1.5 z-10">
                {/* Timeline Slider */}
                <div className="flex items-center space-x-2 text-[11px] text-[#F2EBDD]/80">
                  <span>{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-[#0A221C] rounded-lg appearance-none cursor-pointer accent-[#B68A4F]"
                  />
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Controles de Reproducción y Audio */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#185844] hover:bg-[#124636] border border-[#B68A4F]/40 text-[#F2EBDD] font-semibold transition-colors cursor-pointer"
                      title={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-[#B68A4F]" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-[#B68A4F] fill-[#B68A4F]" />
                          <span>Reproducir</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestart}
                      className="p-1.5 bg-[#0A221C] hover:bg-[#185844] border border-[#185844] text-[#F2EBDD]/80 hover:text-white transition-colors cursor-pointer"
                      title="Reiniciar video desde el inicio"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#B68A4F]" />
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-[#0A221C] hover:bg-[#185844] border border-[#185844] text-[#F2EBDD] transition-colors cursor-pointer"
                      title={isMuted ? 'Activar audio' : 'Silenciar'}
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[11px] text-amber-300">Silenciado</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] text-emerald-300">Con sonido</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleFullscreen}
                      className="p-1.5 bg-[#0A221C] hover:bg-[#185844] border border-[#185844] text-[#F2EBDD]/80 hover:text-white transition-colors cursor-pointer"
                      title="Pantalla completa"
                    >
                      <Maximize className="w-3.5 h-3.5 text-[#B68A4F]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel Desplegable para Cargar o Cambiar Video */}
        {activeTab === 'video' && showUrlInput && (
          <div className="w-full mt-3 p-3 bg-[#0A221C] border border-[#B68A4F]/60 space-y-2 animate-fadeIn text-xs">
            <span className="font-bold text-[#B68A4F] block">
              Configurar video personalizado (MP4 / WebM):
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Pegar enlace directo de video (ej. https://.../video.mp4)"
                value={inputUrlValue}
                onChange={(e) => setInputUrlValue(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[#102F27] border border-[#185844] text-[#F2EBDD] text-xs focus:outline-none focus:border-[#B68A4F]"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] font-bold border border-[#B68A4F] transition-colors cursor-pointer shrink-0"
              >
                Aplicar Enlace
              </button>
            </div>
          </div>
        )}

        {/* Input oculto para subir archivo de video local */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Barra de herramientas inferior */}
        <div className="w-full pt-4 mt-2 border-t border-[#185844] flex flex-wrap items-center justify-between gap-3 text-xs text-[#F2EBDD]/80">
          {activeTab === 'image' ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F]/40 transition-colors cursor-pointer"
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="w-3.5 h-3.5 text-[#B68A4F]" />
                    <span>Alejar</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-3.5 h-3.5 text-[#B68A4F]" />
                    <span>Ampliar</span>
                  </>
                )}
              </button>
              <a
                href={sanitizedLogoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F]/40 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#B68A4F]" />
                <span>Abrir logotipo original</span>
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F]/60 transition-colors cursor-pointer"
                title="Subir video MP4 desde su ordenador"
              >
                <Upload className="w-3.5 h-3.5 text-[#B68A4F]" />
                <span>Subir archivo MP4</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0A221C] hover:bg-[#185844] text-[#F2EBDD] border border-[#185844] transition-colors cursor-pointer"
              >
                <VideoIcon className="w-3.5 h-3.5 text-[#B68A4F]" />
                <span>{showUrlInput ? 'Cerrar URL' : 'Pegar URL de video'}</span>
              </button>

              <a
                href={effectiveVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0A221C] hover:bg-[#185844] text-[#F2EBDD] border border-[#185844] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#B68A4F]" />
                <span>Abrir video en nueva pestaña</span>
              </a>

              {effectiveVideoUrl !== (videoUrl || 'https://res.cloudinary.com/h5daploe/video/upload/v1790782827/PMMRS_fondo_web_10s.mp4') && (
                <button
                  type="button"
                  onClick={resetDefaultVideo}
                  className="px-2.5 py-1 text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
                >
                  Restablecer video inicial
                </button>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#B68A4F] hover:bg-[#9F763F] text-[#102F27] font-bold transition-colors cursor-pointer ml-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
