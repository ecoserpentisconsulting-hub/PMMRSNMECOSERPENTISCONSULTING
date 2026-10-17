import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  SearchCheck,
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  Check,
  FileCheck,
} from 'lucide-react';
import { SOCIAL_LINKS } from './SocialLinks';

interface ManualDeUsoViewProps {
  onGoToCreate?: () => void;
  onGoToReview?: () => void;
  onGoToCommitments?: () => void;
}

export const ManualDeUsoView: React.FC<ManualDeUsoViewProps> = ({
  onGoToCreate,
  onGoToReview,
  onGoToCommitments,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec-1': true,
    'sec-2': true,
    'sec-3': true,
    'sec-4': false,
    'sec-5': false,
    'sec-6': false,
  });

  // Expand all sections when searching to facilitate finding matches
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      setExpandedSections({
        'sec-1': true,
        'sec-2': true,
        'sec-3': true,
        'sec-4': true,
        'sec-5': true,
        'sec-6': true,
      });
    }
  }, [searchTerm]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = [
    { id: 'all', label: 'Todo el Manual' },
    { id: 'flujo', label: '1. Flujo de Trabajo' },
    { id: 'elaboracion', label: '2. Elaboración (12 Pasos)' },
    { id: 'auditoria', label: '3. Auditoría & Revisión' },
    { id: 'compromisos', label: '4. Matriz de Compromisos' },
    { id: 'normativa', label: '5. Normativa & Colores NTP' },
    { id: 'team', label: '6. Equipo de Profesionales' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-[#0A1F33]">
      {/* ====================================================
          1. ENCABEZADO TÉCNICO Y ACCIONES
      ==================================================== */}
      <div className="bg-[#102F27] text-[#F2EBDD] p-6 sm:p-8 border-b-4 border-[#B68A4F]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[#B68A4F] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>EcoSerpentis Consulting Perú · Manual Oficial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Manual de Uso y Guía de Ingeniería Ambiental
            </h1>
            <p className="text-xs sm:text-sm text-[#F2EBDD]/80 max-w-3xl leading-relaxed">
              Instrucciones operativas para elaborar, auditar y gestionar Planes de Minimización y Manejo de Residuos Sólidos No Municipales (PMMRS) bajo la <strong>R.M. 089-2023-MINAM</strong>, <strong>D.L. 1278</strong> y <strong>NTP 900.058:2019</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-[#185844]/60 hover:bg-[#185844] text-[#F2EBDD] border border-[#B68A4F]/40 transition-colors cursor-pointer"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-4 h-4 text-[#B68A4F]" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F] transition-colors cursor-pointer shadow-sm"
            >
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* ====================================================
          2. BARRA DE BÚSQUEDA Y FILTRADO POR CATEGORÍA
      ==================================================== */}
      <div className="bg-white p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por palabra clave (ej. escaneado, OCR, hoja membretada, Word, PDF, portada, SIGERSOL, Basilea, triple lavado)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 focus:outline-none focus:border-[#B68A4F]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====================================================
          SECCIÓN 1: FLUJO DE TRABAJO GENERAL
      ==================================================== */}
      {(activeCategory === 'all' || activeCategory === 'flujo') && (
        <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('sec-1')}
            className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50 border-b border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#102F27] text-[#B68A4F] border border-[#B68A4F]/40">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  1. Flujo de Trabajo y Ciclo de Vida del PMMRS
                </h2>
                <p className="text-xs text-slate-500">
                  Ruta metodológica desde la recolección de datos hasta el reporte ante SIGERSOL
                </p>
              </div>
            </div>
            {expandedSections['sec-1'] ? (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections['sec-1'] && (
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
              <p>
                El Plan de Minimización y Manejo de Residuos Sólidos No Municipales (PMMRS) es el instrumento técnico-operativo obligatorio en el Perú para todo titular de proyectos o actividades productivas, extractivas o de servicios del ámbito no municipal (D.L. N° 1278 y D.S. N° 014-2017-MINAM).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                <div className="p-4 border-l-4 border-emerald-500 bg-slate-50 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Fase 1</span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Levantamiento de Campo</h3>
                  <p className="text-xs text-slate-600">
                    Identificación de fuentes de generación por procesos, balance de entradas y salidas de materiales.
                  </p>
                </div>
                <div className="p-4 border-l-4 border-sky-500 bg-slate-50 space-y-1.5">
                  <span className="text-[11px] font-bold text-sky-700 uppercase">Fase 2</span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Elaboración en Plataforma</h3>
                  <p className="text-xs text-slate-600">
                    Completar los 12 pasos oficiales con cálculo automático de balances, códigos Basilea, NTP 900.058:2019 y exportación en Word (.docx) y PDF membretados.
                  </p>
                </div>
                <div className="p-4 border-l-4 border-amber-500 bg-slate-50 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-700 uppercase">Fase 3</span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Auditoría & Subsanación</h3>
                  <p className="text-xs text-slate-600">
                    Carga digital o escaneada con OCR multimodal, verificación de 12 criterios y descarga del informe técnico oficial con hoja membretada.
                  </p>
                </div>
                <div className="p-4 border-l-4 border-purple-500 bg-slate-50 space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-700 uppercase">Fase 4</span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Reporte & Fiscalización</h3>
                  <p className="text-xs text-slate-600">
                    Declaración Anual SIGERSOL (hasta último día de abril) y manifiestos trimestrales ante el MINAM y OEFA.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {onGoToCreate && (
                  <button
                    onClick={onGoToCreate}
                    className="px-3.5 py-2 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F] font-bold text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Ir a Elaborar PMMRS (Módulo 1)
                  </button>
                )}
                {onGoToReview && (
                  <button
                    onClick={onGoToReview}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Ir a Revisar PMMRS (Módulo 2)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          SECCIÓN 2: ELABORACIÓN DE PMMRS (12 PASOS OFICIALES)
      ==================================================== */}
      {(activeCategory === 'all' || activeCategory === 'elaboracion') && (
        <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('sec-2')}
            className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50 border-b border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#102F27] text-[#B68A4F] border border-[#B68A4F]/40">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  2. Guía Detallada del Wizard de Elaboración (12 Pasos R.M. 089-2023-MINAM)
                </h2>
                <p className="text-xs text-slate-500">
                  Requisitos técnicos, validaciones automáticas y recomendaciones de ingeniería
                </p>
              </div>
            </div>
            {expandedSections['sec-2'] ? (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections['sec-2'] && (
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
              <div className="space-y-3">
                <div className="border border-slate-200 p-3.5">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center">1</span>
                    <span>Paso 1: Información General del Titular</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Requiere RUC activo de 11 dígitos, razón social exacta, coordenadas UTM en formato WGS84 (Zona 17S, 18S o 19S), código CIIU de actividad económica, vida útil proyectada y datos del <strong>Responsable Técnico colegiado y habilitado (CIP)</strong>.
                  </p>
                </div>

                <div className="border border-slate-200 p-3.5">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center">2</span>
                    <span>Paso 2: Objetivos y Alcance del Plan</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Debe definir un objetivo general y al menos 3 objetivos específicos con metas medibles (ej. reducir residuos en 15%, segregar al 100%, valorizar biomasa). El alcance debe precisar todas las áreas operativas, talleres, almacenes y contratistas.
                  </p>
                </div>

                <div className="border border-slate-200 p-3.5">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center">3</span>
                    <span>Paso 3 y 4: Fuentes de Generación e Inventario / Caracterización</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Cada residuo debe vincularse a su proceso generador. La plataforma valida la coherencia entre unidades mensuales (tn/mes) y anuales (tn/año = mensual × 12), asignación de código del Convenio de Basilea (A: Peligrosos, B: No peligrosos) y balance de masa.
                  </p>
                </div>

                <div className="border border-slate-200 p-3.5">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center">5</span>
                    <span>Paso 5: Estrategias de Minimización y Valorización</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Prioriza prevención en origen, retornabilidad, ecodiseño, compostaje interno de biomasa y valorización energética o material. Debe registrarse el cumplimiento de la Ley 30884 respecto a la sustitución de plásticos de un solo uso.
                  </p>
                </div>

                <div className="border border-slate-200 p-3.5">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center">6</span>
                    <span>Paso 6: Gestión y Manejo Operativo</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Abarca segregación según NTP 900.058:2019, recolección interna, almacén central con losa impermeable, canaletas de contención y kit antiderrame, transporte externo exclusivo con Empresas Operadoras (EO-RS) registradas ante MINAM y disposición final autorizada.
                  </p>
                </div>

                <div className="border border-slate-200 p-3.5">
                  <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-5 h-5 bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center">7</span>
                    <span>Pasos 7 al 12: Mitigación, Contingencias, Indicadores, Cronograma y Presupuesto</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Indicadores clave como Tasa de Valorización (%), Tasa de Generación Per Cápita, presupuesto anual con partida asignada y firma del profesional colegiado habilitado.
                  </p>
                </div>

                {/* EXPORTACIÓN OFICIAL PMMRS CON HOJA MEMBRETADA */}
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-emerald-900">
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>Exportación Oficial del PMMRS en Word (.docx) y PDF Membretados</span>
                  </div>
                  <p>
                    Al culminar el Wizard, el sistema compila automáticamente el expediente técnico completo con <strong>Portada Oficial</strong> (logotipo centrado, datos del titular y responsable técnico CIP) y <strong>páginas interiores con hoja membretada institucional</strong> (encabezado con franja verde y doble logotipo, lema patrio, tablas técnicas estructuradas y pie de página con base legal y numeración dinámica APA 7.ª edición).
                  </p>
                </div>
              </div>

              {/* ALERTA CRÍTICA NORMATIVA */}
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-950 text-xs space-y-1.5">
                <div className="flex items-center space-x-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>ALERTA OBLIGATORIA: Envases de Plaguicidas y Agroquímicos</span>
                </div>
                <p>
                  Conforme al <strong>D.S. N° 014-2017-MINAM (Art. 72)</strong> y <strong>D.L. N° 1278 (Art. 30)</strong>, los envases vacíos de agroquímicos que hayan recibido técnica de triple lavado y perforado <strong>mantienen su condición de residuos peligrosos del ámbito no municipal</strong>. Está terminantemente prohibido su reuso comercial o doméstico; deben entregarse a programas de manejo autorizados (ej. CampoLimpio) o a una EO-RS registrada.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          SECCIÓN 3: AUDITORÍA & REVISIÓN INTELIGENTE
      ==================================================== */}
      {(activeCategory === 'all' || activeCategory === 'auditoria') && (
        <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('sec-3')}
            className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50 border-b border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#102F27] text-[#B68A4F] border border-[#B68A4F]/40">
                <SearchCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  3. Módulo de Revisión y Auditoría Inteligente
                </h2>
                <p className="text-xs text-slate-500">
                  Verificación de 12 criterios normativos, detección de inconsistencias y dictamen técnico
                </p>
              </div>
            </div>
            {expandedSections['sec-3'] ? (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections['sec-3'] && (
            <div className="p-5 sm:p-6 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700">
              <p>
                El <strong>Módulo 2 (Revisar PMMRS)</strong> es la herramienta de auditoría documental especializada que contrasta cualquier Plan de Residuos Sólidos frente a los 12 requisitos del Contenido Mínimo oficial de la <strong>R.M. N.° 089-2023-MINAM</strong>, las obligaciones del <strong>D.L. N.° 1278</strong> y los estándares de almacenamiento de la <strong>NTP 900.058:2019</strong>.
              </p>

              {/* 3.1 DOBLE CANAL DE CARGA */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1 border-b border-slate-200">
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    3.1 Doble Canal de Carga Independiente: Digital vs. Escaneado
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  La plataforma cuenta con dos opciones interactivas e independientes para procesar documentos de acuerdo con su origen y naturaleza técnica:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opción Izquierda */}
                  <div className="p-4 border border-emerald-200 bg-emerald-50/40 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Opción 1 · Lado Izquierdo
                      </span>
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      «Arrastra aquí tu PMMRS» (PDF Digital)
                    </h4>
                    <p className="text-xs text-slate-600">
                      Diseñado para documentos generados digitalmente (Word exportado a PDF o software corporativo). El sistema extrae el texto nativo página por página con alta precisión y velocidad mediante PDF.js.
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      <li>Zona interactiva con soporte drag & drop o botón «Seleccionar PDF».</li>
                      <li>Tarjeta reactiva de archivo con tamaño en MB, páginas y texto detectado.</li>
                      <li>Botón «Cambiar archivo» y «Analizar documento» de ejecución exclusiva.</li>
                    </ul>
                  </div>

                  {/* Opción Derecha */}
                  <div className="p-4 border border-amber-200 bg-amber-50/40 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Opción 2 · Lado Derecho
                      </span>
                      <SearchCheck className="w-4 h-4 text-amber-700" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      «Arrastra aquí tu PMMRS escaneado» (OCR Multimodal)
                    </h4>
                    <p className="text-xs text-slate-600">
                      Especialmente adaptado para expedientes físicos digitalizados, fotocopias, planos escaneados o documentos con firmas y sellos manuscritos donde no existe capa de texto seleccionable.
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                      <li>Activación automática de motor OCR multimodal y visión de IA página por página.</li>
                      <li>Reconocimiento de sellos de CIP, firmas de responsables y tablas fotográficas.</li>
                      <li>Independencia total: no sobreescribe ni interfiere con el canal digital izquierdo.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3.2 AUDITORÍA Y MATRIZ DE CRITERIOS */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1 border-b border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    3.2 Auditoría Normativa y Matriz de 12 Criterios Técnicos
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-900 block text-xs">Puntaje Técnico Global</span>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Fórmula ponderada: <code className="text-emerald-800 font-mono">((Cumple×1.0 + Parcial×0.5) / Total Evaluables) × 100</code>. Los criterios «No evaluable» se excluyen del denominador.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-900 block text-xs">Inconsistencias Internas</span>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Cruce entre fuentes de generación, inventarios y empresas operadoras (EO-RS) para detectar contradicciones numéricas o autorizaciones vencidas.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <span className="font-bold text-slate-900 block text-xs">Edición en Tiempo Real</span>
                    <p className="text-[11px] text-slate-600 mt-1">
                      El especialista puede modificar los hallazgos, cambiar estados y enriquecer las acciones correctivas directamente en la matriz antes de descargar el reporte.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3.3 DESCARGA DE INFORMES EN WORD Y PDF CON MEMBRETE */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 pb-1 border-b border-slate-200">
                  <Download className="w-4 h-4 text-[#B68A4F]" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    3.3 Exportación Oficial en Word (.docx) y PDF con Hoja Membretada Institucional
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Al pulsar <strong>«Descargar informe en Word»</strong> o <strong>«Descargar informe en PDF»</strong>, el sistema genera automáticamente un documento formal estructurado bajo norma <strong>APA 7.ª edición</strong> con la identidad corporativa de EcoSerpentis Consulting Perú:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 bg-white shadow-2xs rounded space-y-2">
                    <span className="text-[11px] font-bold text-slate-900 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#B68A4F]" />
                      <span>Sección 1: Portada Técnica Oficial</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                      <li>Logotipo oficial centrado en alta definición en la parte superior.</li>
                      <li>Denominación institucional «ECOSERPENTIS CONSULTING PERÚ» y lema oficial «Año de la Esperanza y el Fortalecimiento de la Democracia».</li>
                      <li>Título en negrita y subtítulo normativo R.M. 089-2023-MINAM / D.L. 1278.</li>
                      <li>Cuadro técnico con metadatos: archivo evaluado, fecha, sector, puntaje técnico global, estado preliminar y resumen ejecutivo.</li>
                      <li>Pie de portada centrado: «LIMA – PERÚ / 2026».</li>
                    </ul>
                  </div>

                  <div className="p-4 border border-slate-200 bg-white shadow-2xs rounded space-y-2">
                    <span className="text-[11px] font-bold text-slate-900 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-700" />
                      <span>Sección 2: Páginas Interiores Membretadas</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                      <li><strong>Encabezado oficial</strong>: Franja verde pastel (<code className="font-mono text-[10px] bg-slate-100 px-1">#C4D9A0</code>), logotipo a izquierda y derecha, título en marrón dorado y lema en verde oliva cursiva.</li>
                      <li><strong>Pie de página oficial</strong>: Franja verde con base legal (<code className="text-[10px]">R.M. N.° 089-2023-MINAM · D.L. N.° 1278</code>) y numeración dinámica de páginas («Página X de Y»).</li>
                      <li><strong>Tablas técnicas</strong>: Encabezados fijos repetibles en cada salto de página (<code className="text-[10px]">tableHeader: true</code>) y filas con protección contra cortes (<code className="text-[10px]">cantSplit: true</code>).</li>
                      <li>Matriz completa de 12 criterios, inconsistencias detectadas y aviso legal de auditoría.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {onGoToReview && (
                <div className="pt-2">
                  <button
                    onClick={onGoToReview}
                    className="px-3.5 py-2 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F] font-bold text-xs transition-colors cursor-pointer shadow-sm flex items-center space-x-1.5"
                  >
                    <SearchCheck className="w-4 h-4" />
                    <span>Ir a Revisar PMMRS (Módulo 2)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          SECCIÓN 4: MATRIZ DE COMPROMISOS AMBIENTALES
      ==================================================== */}
      {(activeCategory === 'all' || activeCategory === 'compromisos') && (
        <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('sec-4')}
            className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50 border-b border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#102F27] text-[#B68A4F] border border-[#B68A4F]/40">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  4. Matriz de Compromisos Ambientales Fiscalizables
                </h2>
                <p className="text-xs text-slate-500">
                  Control de obligaciones ante OEFA, plazos SIGERSOL y reportes periódicos
                </p>
              </div>
            </div>
            {expandedSections['sec-4'] ? (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections['sec-4'] && (
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
              <p>
                Todo PMMRS genera obligaciones legales que son fiscalizadas por el <strong>OEFA</strong> o las <strong>Entidades de Fiscalización Ambiental (EFA) sectoriales</strong> (PRODUCE, MINEM, MIDAGRI, etc.).
              </p>

              <div className="border border-slate-200 p-4 bg-slate-50 space-y-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Plazos Legales Críticos de Reporte:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200">
                    <span className="font-bold text-emerald-800 block">Declaración Anual SIGERSOL</span>
                    <p className="text-slate-600 mt-0.5">
                      Obligatoria hasta el <strong>último día hábil del mes de abril</strong> de cada año respecto al año precedente.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200">
                    <span className="font-bold text-emerald-800 block">Manifiestos de Residuos Peligrosos</span>
                    <p className="text-slate-600 mt-0.5">
                      Reporte trimestral ante el MINAM dentro de los <strong>primeros 15 días hábiles</strong> del mes siguiente al trimestre concluido.
                    </p>
                  </div>
                </div>
              </div>

              {onGoToCommitments && (
                <div className="pt-2">
                  <button
                    onClick={onGoToCommitments}
                    className="px-3.5 py-2 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F] font-bold text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Abrir Matriz de Compromisos (Módulo 3)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          SECCIÓN 5: CÓDIGO DE COLORES NTP 900.058:2019
      ==================================================== */}
      {(activeCategory === 'all' || activeCategory === 'normativa') && (
        <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('sec-5')}
            className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50 border-b border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#102F27] text-[#B68A4F] border border-[#B68A4F]/40">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  5. Código de Colores Obligatorio (NTP 900.058:2019 Ámbito No Municipal)
                </h2>
                <p className="text-xs text-slate-500">
                  7 contenedores técnicos para almacenamiento adecuado en instalaciones no municipales
                </p>
              </div>
            </div>
            {expandedSections['sec-5'] ? (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections['sec-5'] && (
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="p-3 border-2 border-blue-500 bg-blue-50/50">
                  <span className="font-extrabold text-blue-900 block text-xs">AZUL · Papel y Cartón</span>
                  <p className="text-[11px] text-blue-950 mt-1">Periódicos, revistas, folletos, cajas, conos de cartón secos y limpios.</p>
                </div>
                <div className="p-3 border-2 border-slate-400 bg-slate-50">
                  <span className="font-extrabold text-slate-900 block text-xs">BLANCO · Plásticos</span>
                  <p className="text-[11px] text-slate-800 mt-1">Botellas PET, galoneras limpias, film, embalajes plásticos no contaminados.</p>
                </div>
                <div className="p-3 border-2 border-yellow-500 bg-yellow-50/50">
                  <span className="font-extrabold text-yellow-900 block text-xs">AMARILLO · Metales</span>
                  <p className="text-[11px] text-yellow-950 mt-1">Chatarra de fierro, cobre, aluminio, latas de conserva, alambres.</p>
                </div>
                <div className="p-3 border-2 border-slate-500 bg-slate-100">
                  <span className="font-extrabold text-slate-900 block text-xs">PLOMO · Vidrio</span>
                  <p className="text-[11px] text-slate-800 mt-1">Botellas de bebidas, frascos de conserva sin tapa metálica.</p>
                </div>
                <div className="p-3 border-2 border-amber-800 bg-amber-50">
                  <span className="font-extrabold text-amber-950 block text-xs">MARRÓN · Orgánicos</span>
                  <p className="text-[11px] text-amber-900 mt-1">Restos de alimentos, podas, hojarasca, biomasa vegetal agroindustrial.</p>
                </div>
                <div className="p-3 border-2 border-red-600 bg-red-50">
                  <span className="font-extrabold text-red-950 block text-xs">ROJO · Peligrosos</span>
                  <p className="text-[11px] text-red-900 mt-1">Baterías, trapos con hidrocarburos, envases de reactivos, EPPs contaminados.</p>
                </div>
                <div className="p-3 border-2 border-slate-900 bg-slate-200">
                  <span className="font-extrabold text-slate-950 block text-xs">NEGRO · No Aprovechables</span>
                  <p className="text-[11px] text-slate-900 mt-1">Papel higiénico, papel carbón, cerámica, colillas, restos de limpieza general.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          SECCIÓN 6: EQUIPO DE PROFESIONALES Y ACREDITACIONES
      ==================================================== */}
      {(activeCategory === 'all' || activeCategory === 'team') && (
        <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <button
            onClick={() => toggleSection('sec-6')}
            className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50 border-b border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#102F27] text-[#B68A4F] border border-[#B68A4F]/40">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  6. Equipo de Profesionales y Acreditaciones Técnicas
                </h2>
                <p className="text-xs text-slate-500">
                  Habilitación colegiada (CIP/CBP), verificación de CV y registro manual de especialistas
                </p>
              </div>
            </div>
            {expandedSections['sec-6'] ? (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSections['sec-6'] && (
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HABILITACIÓN Y COMPETENCIAS */}
                <div className="p-4 border border-emerald-300 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold text-emerald-950 text-sm">
                      Requisitos de Habilitación (R.M. 089-2023-MINAM)
                    </h3>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                    <li>Los PMMRS deben ser formulados y suscritos por ingenieros o especialistas ambientales colegiados y habilitados.</li>
                    <li>Registro en capítulos correspondientes: Ingeniería Ambiental, Sanitaria, Química o Biología.</li>
                    <li>Verificación de certificados de habilidad profesional vigentes ante el CIP o CBP.</li>
                    <li>Acreditación de experiencia específica en caracterización, balances de masa y gestión no municipal.</li>
                  </ul>
                </div>

                {/* GESTIÓN MANUAL DEL EQUIPO */}
                <div className="p-4 border border-[#B68A4F]/40 bg-[#FAF8F5] space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-[#B68A4F]" />
                    <h3 className="font-bold text-[#102F27] text-sm">
                      Gestión del Módulo de Profesionales
                    </h3>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                    <li>Acceso al directorio completo de especialistas desde el menú principal.</li>
                    <li>Opción para añadir manualmente nuevos profesionales con su foto de avatar, especialidad y credenciales.</li>
                    <li>Incorporación directa de enlaces verificables a la página de CV, LinkedIn o CTI Vitae (Concytec).</li>
                    <li>Edición en tiempo real y almacenamiento local persistente sin pérdida de datos.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================
          SECCIÓN 7: ASISTENCIA Y REDES OFICIALES ECOSERPENTIS
      ==================================================== */}
      <div className="p-6 bg-[#102F27] text-[#F2EBDD] border-t-2 border-[#B68A4F] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#F2EBDD]">
              ¿Requieres Asesoría Especializada o Auditoría a Medida?
            </h3>
            <p className="text-xs text-[#78947F] mt-1">
              Comunícate directamente con el equipo de ingenieros ambientales de EcoSerpentis Consulting Perú.
            </p>
          </div>
          <a
            href={SOCIAL_LINKS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#185844] hover:bg-[#124636] text-[#F2EBDD] border border-[#B68A4F] font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            <span>Iniciar Consulta por WhatsApp</span>
            <ExternalLink className="w-4 h-4 text-[#B68A4F]" />
          </a>
        </div>

        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span>Correo oficial: </span>
            <a href={SOCIAL_LINKS.email} className="text-emerald-400 hover:underline font-semibold">
              {SOCIAL_LINKS.emailRaw}
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 font-semibold"
            >
              Instagram
            </a>
            <span>·</span>
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-semibold"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
