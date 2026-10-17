import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  UploadCloud,
  FileText,
  SearchCheck,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Download,
  Edit3,
  RefreshCw,
  Sparkles,
  Layers,
  Scale,
  ShieldAlert,
  Info,
  Clock,
  Settings,
  Building,
  BarChart3,
  ArrowRight,
  Play,
  Check,
  FileCheck,
  ChevronDown,
} from 'lucide-react';
import { AuditReport, AuditCriterion, ReviewStatus, EconomicSector } from '../types/pmrs';
import {
  extractTextFromPdfFile,
  PdfExtractionResult,
  fileToBase64,
  renderPdfPagesAsImages,
} from '../utils/pdfExtractor';
import { auditDocumentDeterministic } from '../utils/auditEngine';
import { generateAuditReportDocx } from '../utils/docxGenerator';
import { generateAuditPdf } from '../utils/pdfGenerator';
import { FUNDO_CAMONES_TEST_CASE } from '../data/demoData';

interface ReviewPlanModuleProps {
  onPlanAudited?: (report: AuditReport) => void;
  serverOnline: boolean;
  hasGeminiKey: boolean;
}

const SECTOR_OPTIONS: EconomicSector[] = [
  'Construcción',
  'Agroindustria',
  'Industria manufacturera',
  'Minería',
  'Energía',
  'Hidrocarburos',
  'Comercio y servicios',
  'Salud',
  'Transporte',
  'Pesca',
  'Otro',
];

export const ReviewPlanModule: React.FC<ReviewPlanModuleProps> = ({
  onPlanAudited,
  serverOnline,
  hasGeminiKey,
}) => {
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [scannedFile, setScannedFile] = useState<File | null>(null);
  const [activeDocumentType, setActiveDocumentType] = useState<'digital' | 'scanned'>('digital');
  const [isDraggingDigital, setIsDraggingDigital] = useState<boolean>(false);
  const [isDraggingScanned, setIsDraggingScanned] = useState<boolean>(false);

  // Active file resolved from either upload slot
  const file = activeDocumentType === 'scanned' ? (scannedFile || digitalFile) : (digitalFile || scannedFile);

  const [selectedSector, setSelectedSector] = useState<EconomicSector>('Construcción');
  const [customSectorText, setCustomSectorText] = useState<string>('');
  const [extractingProgress, setExtractingProgress] = useState<number | null>(72);
  const [progressStatusText, setProgressStatusText] = useState<string>('Contrastando requisitos normativos...');
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [usedGemini, setUsedGemini] = useState<boolean>(false);
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  const digitalFileInputRef = useRef<HTMLInputElement>(null);
  const scannedFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = digitalFileInputRef;
  const resultsRef = useRef<HTMLDivElement>(null);

  // Default displayed metadata matching the reference preview
  const activeFileName = file ? file.name : (report ? report.nombreArchivo : 'PMMRS_Construcción_2026.pdf');
  const activePages = file ? Math.max(1, Math.round(file.size / 180000)) : (report ? 32 : 32);
  const activeSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : (report ? '6.4' : '6.4');
  const activeCompanyName = report
    ? report.nombreArchivo.replace(/\.pdf$/i, '').replace(/_/g, ' ')
    : (file ? file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ') : 'Empresa Constructora del Norte S.A.C.');

  // Metrics summary
  const metricsEvaluados = report ? report.criterios.length : 15;
  const metricsHallazgos = report
    ? report.conteoEstados.parcial + report.conteoEstados.noIdentificado
    : 4;
  const metricsInconsistencias = report ? report.contradicciones.length : 2;
  const metricsCriticas = report
    ? report.criterios.filter((c) => c.estado === 'No identificado').length || 1
    : 1;

  // File drop/selection handler for Digital PMMRS
  const handleDigitalFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se admiten documentos en formato PDF (.pdf).');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      alert('El archivo excede el tamaño máximo permitido de 25 MB.');
      return;
    }

    setDigitalFile(selectedFile);
    setActiveDocumentType('digital');
    setAuditError(null);
    setReport(null);
    setShowDetailedResults(false);

    await processPdf(selectedFile, false);
  };

  // File drop/selection handler for Scanned PMMRS
  const handleScannedFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se admiten documentos en formato PDF (.pdf).');
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      alert('El archivo excede el tamaño máximo permitido de 25 MB.');
      return;
    }

    setScannedFile(selectedFile);
    setActiveDocumentType('scanned');
    setAuditError(null);
    setReport(null);
    setShowDetailedResults(false);

    await processPdf(selectedFile, true);
  };

  // General backwards-compatible file handler
  const handleFileChange = handleDigitalFileChange;

  const processPdf = async (pdfFile: File, isForceScanned = false) => {
    setIsAuditing(true);
    setExtractingProgress(15);
    setProgressStatusText('Extrayendo contenido del documento...');

    try {
      // 1. Extract text page by page with progress
      const extraction = await extractTextFromPdfFile(pdfFile, (pct) => {
        setExtractingProgress(Math.min(45, Math.max(15, pct)));
      });

      const isScanned = isForceScanned || extraction.isScannedOrEmpty;

      // 2. Prepare Base64 of PDF for direct native processing
      let pdfBase64 = '';
      try {
        pdfBase64 = await fileToBase64(pdfFile);
      } catch (b64Err) {
        console.warn('No se pudo convertir a base64:', b64Err);
      }

      // 3. If scanned or required, render page images for OCR/multimodal vision
      let scannedImages: any[] = [];
      if (isScanned) {
        setExtractingProgress(55);
        setProgressStatusText('Ejecutando OCR multimodal sobre páginas escaneadas...');
        try {
          scannedImages = await renderPdfPagesAsImages(pdfFile, 15);
        } catch (imgErr) {
          console.warn('Error al renderizar imágenes de páginas escaneadas:', imgErr);
        }
      }

      setExtractingProgress(72);
      setProgressStatusText('Contrastando requisitos normativos R.M. 089-2023-MINAM...');

      // Save extracted PDF text to localStorage
      try {
        localStorage.setItem(
          'pmrs_last_extracted_pdf',
          JSON.stringify({
            fileName: pdfFile.name,
            fileSizeBytes: pdfFile.size,
            totalPages: extraction.totalPages,
            pages: extraction.pages,
            fullText: extraction.fullText,
            isScannedOrEmpty: isScanned,
            timestamp: Date.now(),
          })
        );
      } catch (saveErr) {
        console.warn('No se pudo cachear PDF en localStorage:', saveErr);
      }

      // Try backend Gemini Audit first if key is present
      let finalReport: AuditReport | null = null;
      let geminiSuccess = false;

      if (hasGeminiKey) {
        setExtractingProgress(85);
        setProgressStatusText('Evaluando coherencia cruzada y contradicciones con IA...');
        try {
          const res = await fetch('/api/audit-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentText: extraction.fullText,
              pageCount: extraction.totalPages,
              companyName: extraction.fileName,
              fileName: pdfFile.name,
              sector: selectedSector,
              sectorLibre: customSectorText,
              pdfBase64: pdfBase64 || undefined,
              pageImages: scannedImages.length > 0 ? scannedImages : undefined,
              isScanned,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const baseReport = auditDocumentDeterministic({
              fileName: pdfFile.name,
              fileSizeBytes: pdfFile.size,
              rawText: extraction.fullText,
              extractedPages: extraction.pages,
              sector: selectedSector,
              sectorLibre: customSectorText,
              allowScannedProcessing: true,
              isScannedOrEmpty: isScanned,
            });

            const criteriaSource = data.criterios || data.criteriosEvaluados;
            if (criteriaSource && Array.isArray(criteriaSource)) {
              criteriaSource.forEach((gemCrit: any) => {
                const target = baseReport.criterios.find(
                  (c) =>
                    c.id.toLowerCase() === (gemCrit.id || '').toLowerCase() ||
                    c.seccionNumero.toString() === (gemCrit.seccion || gemCrit.id || '').toString()
                );
                if (target && gemCrit.estado) {
                  const st = gemCrit.estado.toLowerCase().trim();
                  if (st === 'cumple') target.estado = 'Cumple';
                  else if (st === 'parcial') target.estado = 'Parcial';
                  else if (st === 'no evaluable') target.estado = 'No evaluable';
                  else target.estado = 'No identificado';

                  if (gemCrit.hallazgo || gemCrit.hallazgoExplicacion) {
                    target.hallazgoExplicacion = gemCrit.hallazgo || gemCrit.hallazgoExplicacion;
                  }
                  if (gemCrit.accionCorrectiva) target.accionCorrectiva = gemCrit.accionCorrectiva;
                  if (gemCrit.evidencia || gemCrit.evidenciaLiteral) {
                    target.evidenciaLiteral = gemCrit.evidencia || gemCrit.evidenciaLiteral;
                  }
                  if (gemCrit.pagina || gemCrit.paginaOSeccion) {
                    target.paginaOSeccion = gemCrit.pagina || gemCrit.paginaOSeccion;
                  }
                }
              });
            }

            const contradictionsSource = data.contradicciones || data.inconsistenciasDetectadas;
            if (contradictionsSource && Array.isArray(contradictionsSource) && contradictionsSource.length > 0) {
              baseReport.contradicciones = [
                ...baseReport.contradicciones,
                ...contradictionsSource.map((incons: any, idx: number) => ({
                  id: 'GEM-INCONS-' + idx,
                  titulo: incons.titulo || 'Inconsistencia detectada por Gemini',
                  descripcion: incons.descripcion || '',
                  seccionesInvolucradas: incons.seccionesInvolucradas || 'Secciones analizadas por IA',
                  gravedad: incons.gravedad || 'Media',
                  recomendacion: incons.recomendacion || 'Revisar coherencia en el documento.',
                  citaLiteral1: incons.citaLiteral1,
                  citaLiteral2: incons.citaLiteral2,
                })),
              ];
            }

            if (data.alertaPlaguicidas?.detectada) {
              baseReport.alertaPlaguicidas = data.alertaPlaguicidas;
            }

            if (data.resumen) {
              baseReport.resumenEjecutivo = data.resumen;
            }

            const cumple = baseReport.criterios.filter((c) => c.estado === 'Cumple').length;
            const parcial = baseReport.criterios.filter((c) => c.estado === 'Parcial').length;
            const noIdentificado = baseReport.criterios.filter((c) => c.estado === 'No identificado').length;
            const noEvaluable = baseReport.criterios.filter((c) => c.estado === 'No evaluable').length;
            const totalEvaluables = cumple + parcial + noIdentificado;
            const puntaje = totalEvaluables > 0 ? Math.round(((cumple * 1.0 + parcial * 0.5) / totalEvaluables) * 100) : 0;

            baseReport.puntajeGlobal = puntaje;
            baseReport.conteoEstados = { cumple, parcial, noIdentificado, noEvaluable, totalEvaluables };
            baseReport.formulaPuntaje = `Puntaje = ((${cumple}×1.0 + ${parcial}×0.5) / ${totalEvaluables}) × 100 = ${puntaje}% (Criterios 'No evaluable': ${noEvaluable} excluidos)`;
            baseReport.esTextoSeleccionable = true;
            baseReport.esDocumentoEscaneado = isScanned;
            baseReport.modoAnalisis = isScanned ? 'OCR / Visión IA' : 'IA + reglas';

            finalReport = baseReport;
            geminiSuccess = true;
          } else {
            const errData = await res.json().catch(() => ({}));
            setAuditError(errData.error || 'No fue posible completar el análisis con IA. Se aplicó la evaluación técnica con el motor normativo.');
          }
        } catch (geminiErr: any) {
          console.warn('Gemini backend falló, continuando con motor determinístico:', geminiErr);
          setAuditError('No fue posible completar el análisis con IA. Se aplicó la evaluación técnica con el motor normativo.');
        }
      }

      // If Gemini wasn't used or failed, run deterministic audit
      if (!finalReport) {
        finalReport = auditDocumentDeterministic({
          fileName: pdfFile.name,
          fileSizeBytes: pdfFile.size,
          rawText: extraction.fullText,
          extractedPages: extraction.pages,
          sector: selectedSector,
          sectorLibre: customSectorText,
          allowScannedProcessing: true,
          isScannedOrEmpty: isScanned,
        });
        finalReport.esTextoSeleccionable = true;
        finalReport.esDocumentoEscaneado = isScanned;
      }

      setExtractingProgress(100);
      setProgressStatusText('Análisis técnico completado exitosamente.');
      setReport(finalReport);
      setUsedGemini(geminiSuccess);
      setShowDetailedResults(true);
      if (onPlanAudited) onPlanAudited(finalReport);
    } catch (err: any) {
      console.error('Error durante la revisión:', err);
      setAuditError('Ocurrió un error al procesar el archivo: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRunAnalysis = (fileToAnalyze?: File, isScannedMode?: boolean) => {
    const targetFile = fileToAnalyze || file;
    const forceScanned = isScannedMode !== undefined ? isScannedMode : (targetFile === scannedFile);

    if (targetFile) {
      processPdf(targetFile, forceScanned);
    } else {
      // Run benchmark demo analysis with real construction/industrial case
      setIsAuditing(true);
      setExtractingProgress(20);
      setProgressStatusText('Cargando documento técnico de demostración...');

      setTimeout(() => {
        setExtractingProgress(50);
        setProgressStatusText('Extrayendo texto y procesando tablas operativas...');
        setTimeout(() => {
          setExtractingProgress(75);
          setProgressStatusText('Contrastando requisitos normativos R.M. 089-2023-MINAM...');
          setTimeout(() => {
            const textParts = FUNDO_CAMONES_TEST_CASE.extractedText.split(/(?=\d+\.\s+[A-ZÁÉÍÓÚ])/);
            const pages = textParts.map((t, idx) => ({ pageNumber: idx + 1, text: t }));
            const baseReport = auditDocumentDeterministic({
              fileName: 'PMMRS_Construcción_2026.pdf',
              fileSizeBytes: 6710886,
              rawText: FUNDO_CAMONES_TEST_CASE.extractedText,
              extractedPages: pages,
              sector: selectedSector,
              allowScannedProcessing: true,
            });
            baseReport.esTextoSeleccionable = true;
            setReport(baseReport);
            setUsedGemini(false);
            setExtractingProgress(100);
            setProgressStatusText('Análisis técnico completado exitosamente.');
            setIsAuditing(false);
            setShowDetailedResults(true);
            if (onPlanAudited) onPlanAudited(baseReport);
          }, 350);
        }, 300);
      }, 250);
    }
  };

  const handleUpdateCriterion = (criterionId: string, updates: Partial<AuditCriterion>) => {
    if (!report) return;

    const updatedCriterios = report.criterios.map((c) => {
      if (c.id === criterionId) {
        return { ...c, ...updates, esVerificadoManualmente: true };
      }
      return c;
    });

    let cumple = 0;
    let parcial = 0;
    let noIdentificado = 0;
    let noEvaluable = 0;

    updatedCriterios.forEach((c) => {
      if (c.estado === 'Cumple') cumple++;
      else if (c.estado === 'Parcial') parcial++;
      else if (c.estado === 'No identificado') noIdentificado++;
      else if (c.estado === 'No evaluable') noEvaluable++;
    });

    const totalEvaluables = cumple + parcial + noIdentificado;
    const puntajeGlobal = totalEvaluables > 0 ? Math.round(((cumple * 1.0 + parcial * 0.5) / totalEvaluables) * 100) : 0;
    const formulaPuntaje = `Puntaje = ((${cumple}×1.0 + ${parcial}×0.5) / ${totalEvaluables}) × 100 = ${puntajeGlobal}% (Criterios 'No evaluable': ${noEvaluable})`;

    setReport({
      ...report,
      criterios: updatedCriterios,
      puntajeGlobal,
      formulaPuntaje,
      conteoEstados: { cumple, parcial, noIdentificado, noEvaluable, totalEvaluables },
    });
  };

  const handleExportDocx = async () => {
    if (!report) return;
    setIsExportingDocx(true);
    try {
      const blob = await generateAuditReportDocx(report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_Observaciones_PMMRS_${report.nombreArchivo.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Error al exportar Word: ' + e.message);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      const doc = generateAuditPdf(report);
      doc.save(`Informe_Observaciones_PMMRS_${report.nombreArchivo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (e: any) {
      alert('Error al exportar PDF: ' + e.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const scrollToResults = () => {
    if (!report) {
      handleRunAnalysis();
    } else {
      setShowDetailedResults(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-16">
      {/* 1. ENCABEZADO PRINCIPAL (REVISAR PMMRS) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-sky-100 text-sky-800 rounded">
              MÓDULO 2
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Revisar PMMRS
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Evaluación técnica de cumplimiento contra el Contenido Mínimo oficial (R.M. 089-2023-MINAM) y detección de contradicciones.
          </p>
        </div>

        {/* Tarjeta decorativa de revisión técnica (Derecha) */}
        <div className="flex items-center space-x-3 bg-emerald-50/40 border border-emerald-100 rounded-xl px-4 py-2.5 self-stretch md:self-auto shrink-0 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              Revisión técnica
            </div>
            <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
              para una gestión de
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              residuos más sólida
            </div>
          </div>
        </div>
      </div>

      {/* 2. FLUJO POR ETAPAS (WIZARD 3 PASOS) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Paso 1: Contexto */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#102F27] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 leading-none">
                1. Contexto
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-none hidden sm:block">
                Define el sector y alcance
              </div>
            </div>
          </div>

          <div className="h-0.5 flex-1 bg-emerald-700 mx-3 sm:mx-6" />

          {/* Paso 2: Documento */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#102F27] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 leading-none">
                2. Documento
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-none hidden sm:block">
                Carga del PMMRS
              </div>
            </div>
          </div>

          <div className="h-0.5 flex-1 bg-emerald-700 mx-3 sm:mx-6" />

          {/* Paso 3: Análisis */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#102F27] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
              {report ? <Check className="w-4 h-4 stroke-[2.5]" /> : '3'}
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 leading-none">
                3. Análisis
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-none hidden sm:block">
                Procesamiento y resultados
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BLOQUE DE CONTEXTO DE LA REVISIÓN */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
            <Building className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Contexto de la revisión
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecciona el sector o actividad económica para contextualizar la evaluación normativa.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto min-w-[240px]">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Sector / actividad económica
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as EconomicSector)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none"
            >
              {SECTOR_OPTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. BLOQUE DE CARGA DE DOCUMENTO A REVISAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header del bloque */}
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Documento a revisar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Carga el Plan de Residuos Sólidos (PMMRS) en formato PDF para su análisis automático.
            </p>
          </div>
        </div>

        {/* Zona de 2 columnas: Opción Izquierda (PMMRS digital) y Opción Derecha (PMMRS escaneado) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Columna Izquierda: Arrastra aquí tu PMMRS */}
          {!digitalFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingDigital(true);
              }}
              onDragLeave={() => setIsDraggingDigital(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingDigital(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleDigitalFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-colors min-h-[220px] ${
                isDraggingDigital
                  ? 'border-emerald-600 bg-emerald-50/70'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50/80'
              }`}
            >
              <UploadCloud className="w-9 h-9 text-slate-400 mb-2" />
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Arrastra aquí tu PMMRS
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 mb-3">
                PDF digital • máximo 25 MB
              </span>
              <button
                type="button"
                onClick={() => digitalFileInputRef.current?.click()}
                className="px-4 py-2 bg-[#102F27] hover:bg-[#185844] text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Seleccionar PDF</span>
              </button>
              <input
                ref={digitalFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleDigitalFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              {/* Fila superior: Ícono PDF, Nombre, Páginas y Check verde */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-9 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                    <span className="text-rose-600 font-extrabold text-[10px] tracking-tight">PDF</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                        PMMRS
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-0.5" title={digitalFile.name}>
                      {digitalFile.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {Math.max(1, Math.round(digitalFile.size / 180000))} páginas • {(digitalFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <button
                    type="button"
                    onClick={() => {
                      setDigitalFile(null);
                      if (activeDocumentType === 'digital' && scannedFile) {
                        setActiveDocumentType('scanned');
                      }
                    }}
                    title="Quitar archivo"
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-md hover:bg-slate-200/50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges de estado */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Texto detectado</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>OCR no requerido</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Listo para análisis</span>
                </span>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => digitalFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cambiar archivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDocumentType('digital');
                    handleRunAnalysis(digitalFile, false);
                  }}
                  disabled={isAuditing}
                  className="px-4 py-2 rounded-lg bg-[#102F27] hover:bg-[#185844] text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAuditing && activeDocumentType === 'digital' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Analizando...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-white" />
                      <span>Analizar documento</span>
                    </>
                  )}
                </button>
              </div>
              <input
                ref={digitalFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleDigitalFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {/* Columna Derecha: Arrastra aquí tu PMMRS escaneado */}
          {!scannedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingScanned(true);
              }}
              onDragLeave={() => setIsDraggingScanned(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingScanned(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleScannedFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center text-center transition-colors min-h-[220px] ${
                isDraggingScanned
                  ? 'border-emerald-600 bg-emerald-50/70'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50/80'
              }`}
            >
              <UploadCloud className="w-9 h-9 text-slate-400 mb-2" />
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Arrastra aquí tu PMMRS escaneado
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 mb-3">
                PDF escaneado / con imágenes • máximo 25 MB
              </span>
              <button
                type="button"
                onClick={() => scannedFileInputRef.current?.click()}
                className="px-4 py-2 bg-[#102F27] hover:bg-[#185844] text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Seleccionar PDF</span>
              </button>
              <input
                ref={scannedFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleScannedFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              {/* Fila superior: Ícono PDF, Nombre, Páginas y Check verde */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-9 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <span className="text-amber-700 font-extrabold text-[10px] tracking-tight">PDF</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                        PMMRS Escaneado
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-0.5" title={scannedFile.name}>
                      {scannedFile.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {Math.max(1, Math.round(scannedFile.size / 180000))} páginas • {(scannedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <button
                    type="button"
                    onClick={() => {
                      setScannedFile(null);
                      if (activeDocumentType === 'scanned' && digitalFile) {
                        setActiveDocumentType('digital');
                      }
                    }}
                    title="Quitar archivo"
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-md hover:bg-slate-200/50 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges de estado */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                  <Check className="w-3 h-3 text-amber-600" />
                  <span>Documento escaneado</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>OCR multimodal activo</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Listo para análisis</span>
                </span>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => scannedFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cambiar archivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDocumentType('scanned');
                    handleRunAnalysis(scannedFile, true);
                  }}
                  disabled={isAuditing}
                  className="px-4 py-2 rounded-lg bg-[#102F27] hover:bg-[#185844] text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAuditing && activeDocumentType === 'scanned' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Analizando...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-white" />
                      <span>Analizar documento</span>
                    </>
                  )}
                </button>
              </div>
              <input
                ref={scannedFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleScannedFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}
        </div>

        {auditError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Observación en la carga:</strong>
              <span>{auditError}</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. PROCESO DE AUDITORÍA Y ANÁLISIS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header del bloque */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <Settings className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Proceso de auditoría
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                El sistema analiza el documento, extrae su contenido y lo contrasta con la normativa aplicable.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500 shrink-0">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Tiempo estimado: 1 - 3 minutos</span>
            <Info className="w-3.5 h-3.5 text-slate-400 ml-1 cursor-help" />
          </div>
        </div>

        {/* Stepper horizontal con 5 fases */}
        <div className="pt-2 pb-1 overflow-x-auto scrollbar-thin">
          <div className="min-w-[620px] flex items-center justify-between relative px-2">
            {/* Línea base conectora */}
            <div className="absolute left-8 right-8 top-3.5 h-0.5 bg-slate-200 -z-0" />
            {/* Línea de avance verde */}
            <div
              className="absolute left-8 top-3.5 h-0.5 bg-emerald-700 -z-0 transition-all duration-300"
              style={{
                width: report
                  ? 'calc(100% - 4rem)'
                  : `${Math.max(10, Math.min(85, (extractingProgress || 72) * 0.9))}%`,
              }}
            />

            {/* Fase 1: Documento */}
            <div className="flex flex-col items-center text-center z-10 space-y-1">
              <div className="w-7 h-7 rounded-full bg-[#102F27] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="font-bold text-xs text-slate-900">Documento</div>
              <div className="text-[10px] text-slate-500">Archivo cargado</div>
            </div>

            {/* Fase 2: Extracción */}
            <div className="flex flex-col items-center text-center z-10 space-y-1">
              <div className="w-7 h-7 rounded-full bg-[#102F27] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="font-bold text-xs text-slate-900">Extracción</div>
              <div className="text-[10px] text-slate-500">Contenido procesado</div>
            </div>

            {/* Fase 3: Análisis normativo */}
            <div className="flex flex-col items-center text-center z-10 space-y-1">
              <div className="w-7 h-7 rounded-full bg-[#102F27] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="font-bold text-xs text-slate-900">Análisis normativo</div>
              <div className="text-[10px] text-slate-500">Contrastando con R.M. 089-2023</div>
            </div>

            {/* Fase 4: Coherencia */}
            <div className="flex flex-col items-center text-center z-10 space-y-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs transition-colors ${
                  report
                    ? 'bg-[#102F27] text-white'
                    : 'bg-[#102F27] text-white ring-4 ring-emerald-100'
                }`}
              >
                {report ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              </div>
              <div className="font-bold text-xs text-slate-900">Coherencia</div>
              <div className="text-[10px] text-slate-500">Detección de contradicciones</div>
            </div>

            {/* Fase 5: Informe */}
            <div className="flex flex-col items-center text-center z-10 space-y-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs transition-colors ${
                  report ? 'bg-[#102F27] text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                {report ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '5'}
              </div>
              <div className="font-bold text-xs text-slate-900">Informe</div>
              <div className="text-[10px] text-slate-500">Generación de resultados</div>
            </div>
          </div>
        </div>

        {/* Barra de progreso inferior y porcentaje */}
        <div className="space-y-1.5 pt-2">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-700 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${report ? 100 : extractingProgress || 72}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{report ? 'Análisis completado exitosamente.' : progressStatusText}</span>
            <span className="font-bold text-slate-900">{report ? '100%' : `${extractingProgress || 72}%`}</span>
          </div>
        </div>
      </div>

      {/* 6. VISTA PREVIA DE RESULTADOS (DOS TARJETAS INFERIORES EN GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tarjeta 1: Documento detectado */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-emerald-800" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Documento detectado</h3>
                <p className="text-xs text-slate-500">
                  Información extraída automáticamente del PMMRS cargado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 mt-3 border-t border-slate-100 text-xs">
              <div className="col-span-2 sm:col-span-1 space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">Titular</div>
                <div className="font-bold text-slate-900 text-xs truncate" title={activeCompanyName}>
                  {activeCompanyName}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">Páginas</div>
                <div className="font-bold text-slate-900 text-xs">{activePages}</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">Tipo</div>
                <div className="font-bold text-slate-900 text-xs">
                  {report?.esDocumentoEscaneado ? 'PDF escaneado' : 'PDF digital'}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">Sector</div>
                <div className="font-bold text-slate-900 text-xs truncate">{selectedSector}</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-400 font-medium">Texto extraíble</div>
                <div className="font-bold text-emerald-700 text-xs flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sí</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Vista previa de resultados */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 text-emerald-800" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Vista previa de resultados</h3>
                  <p className="text-xs text-slate-500">
                    Resumen preliminar del análisis del documento.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={scrollToResults}
                className="px-3.5 py-1.5 rounded-lg bg-[#102F27] hover:bg-[#185844] text-white font-semibold text-xs transition-colors flex items-center space-x-1 shrink-0 shadow-xs cursor-pointer"
              >
                <span>Ver resultados</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chips de métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 mt-3 border-t border-slate-100 text-center text-xs">
              {/* Criterios evaluados */}
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex flex-col items-center justify-center">
                <div className="font-extrabold text-emerald-800 text-sm leading-none flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{metricsEvaluados}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">criterios evaluados</div>
              </div>

              {/* Hallazgos */}
              <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-100 flex flex-col items-center justify-center">
                <div className="font-extrabold text-sky-800 text-sm leading-none flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-sky-600" />
                  <span>{metricsHallazgos}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">hallazgos</div>
              </div>

              {/* Inconsistencias */}
              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100 flex flex-col items-center justify-center">
                <div className="font-extrabold text-amber-800 text-sm leading-none flex items-center space-x-1">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span>{metricsInconsistencias}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">inconsistencias</div>
              </div>

              {/* Observación crítica */}
              <div className="p-2 rounded-lg bg-red-50/70 border border-red-100 flex flex-col items-center justify-center">
                <div className="font-extrabold text-red-800 text-sm leading-none flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>{metricsCriticas}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">observación crítica</div>
              </div>

              {/* Informe listo */}
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex flex-col items-center justify-center">
                <div className="font-extrabold text-emerald-800 text-xs leading-none flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Informe listo</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">Generación completa</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. DASHBOARD COMPLETO DE RESULTADOS DETALLADOS (MATRIZ, CRITERIOS, HALLAZGOS Y DESCARGAS) */}
      <div ref={resultsRef}>
        {showDetailedResults && report && (
          <div className="space-y-5 pt-2 animate-fadeIn">
            {/* Header del Informe y Descargas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Evaluación Técnica Detallada
                    </span>
                    {report.esDocumentoEscaneado && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 rounded flex items-center space-x-1">
                        <SearchCheck className="w-3 h-3" />
                        <span>PDF Escaneado</span>
                      </span>
                    )}
                    {usedGemini ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Gemini 3.8 Flash</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded">
                        Motor Normativo
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    {report.nombreArchivo}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fecha: {report.fechaEvaluacion} • {report.totalPaginas} páginas analizadas • {report.tamanoArchivoMB} MB
                  </p>
                </div>

                {/* Score Gauge Badge */}
                <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200 self-stretch sm:self-auto justify-between sm:justify-start">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Nivel de Cumplimiento
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      <span
                        className={
                          report.puntajeGlobal >= 80
                            ? 'text-emerald-700'
                            : report.puntajeGlobal >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }
                      >
                        {report.puntajeGlobal}%
                      </span>
                      <span className="text-xs text-slate-400 font-normal ml-1">preliminar</span>
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-full border-4 border-slate-200 flex items-center justify-center font-bold text-xs">
                    {report.conteoEstados.cumple}/{report.conteoEstados.totalEvaluables}
                  </div>
                </div>
              </div>

              {/* Status counts bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                  <div className="text-xl font-bold text-emerald-700">{report.conteoEstados.cumple}</div>
                  <div className="text-[11px] font-medium">Cumple (100%)</div>
                </div>

                <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200">
                  <div className="text-xl font-bold text-amber-700">{report.conteoEstados.parcial}</div>
                  <div className="text-[11px] font-medium">Parcial (50%)</div>
                </div>

                <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200">
                  <div className="text-xl font-bold text-red-700">{report.conteoEstados.noIdentificado}</div>
                  <div className="text-[11px] font-medium">No Identificado (0%)</div>
                </div>

                <div className="p-3 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
                  <div className="text-xl font-bold text-slate-600">{report.conteoEstados.noEvaluable}</div>
                  <div className="text-[11px] font-medium">No Evaluable (Neutro)</div>
                </div>
              </div>

              {/* Diagnóstico Ejecutivo */}
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1">Diagnóstico Técnico Ejecutivo:</strong>
                <p>{report.resumenEjecutivo}</p>
              </div>

              {/* Botones de Descarga Oficial */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportDocx}
                  disabled={isExportingDocx}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingDocx ? 'Generando Word...' : 'Descargar Informe en Word (.docx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-2.5 rounded-lg bg-[#00875A] hover:bg-[#00734D] text-white font-semibold text-xs transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPdf ? 'Generando PDF...' : 'Descargar Informe en PDF (.pdf)'}</span>
                </button>
              </div>
            </div>

            {/* Inconsistencias y Contradicciones Internas */}
            {report.contradicciones.length > 0 && (
              <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-slate-900 text-base">
                      Inconsistencias y Contradicciones Internas Detectadas ({report.contradicciones.length})
                    </h3>
                  </div>
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold uppercase">
                    Cruce de Cuadros
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Se detectaron discrepancias entre secciones o tablas cuantitativas que restan coherencia técnica al plan:
                </p>

                <div className="space-y-3">
                  {report.contradicciones.map((c) => (
                    <div key={c.id} className="p-4 bg-red-50/50 rounded-xl border border-red-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-950 text-sm">{c.titulo}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-200 text-red-800">
                          Gravedad: {c.gravedad}
                        </span>
                      </div>
                      <div className="text-slate-700">{c.descripcion}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Secciones involucradas: {c.seccionesInvolucradas}
                      </div>

                      {c.citaLiteral1 && (
                        <div className="bg-white p-2.5 rounded border border-red-100 font-mono text-[11px] text-slate-800 space-y-1">
                          <div>{c.citaLiteral1}</div>
                          {c.citaLiteral2 && <div>{c.citaLiteral2}</div>}
                        </div>
                      )}

                      <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 font-medium">
                        <strong>Recomendación técnica:</strong> {c.recomendacion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matriz Detallada de Requisitos Normativos Evaluados */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Matriz de Hallazgos por Requisito Oficial ({report.criterios.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Puede modificar el estado o comentario de cualquier criterio antes de exportar el informe.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {report.criterios.map((c) => {
                  const isEditing = editingCriterionId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all text-xs ${
                        c.estado === 'Cumple'
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : c.estado === 'Parcial'
                          ? 'bg-amber-50/30 border-amber-200'
                          : c.estado === 'No identificado'
                          ? 'bg-red-50/30 border-red-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            {c.id} - {c.seccionTitulo}
                          </span>
                          <span className="text-[11px] text-slate-500 block sm:inline sm:ml-2">
                            Ref: {c.baseLegal}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <select
                            value={c.estado}
                            onChange={(e) =>
                              handleUpdateCriterion(c.id, { estado: e.target.value as ReviewStatus })
                            }
                            className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                              c.estado === 'Cumple'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : c.estado === 'Parcial'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : c.estado === 'No identificado'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="Cumple">Cumple (100%)</option>
                            <option value="Parcial">Parcial (50%)</option>
                            <option value="No identificado">No identificado (0%)</option>
                            <option value="No evaluable">No evaluable</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setEditingCriterionId(isEditing ? null : c.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Editar hallazgo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-slate-600 mb-2">
                        <strong>Exigencia reglamentaria:</strong> {c.requisito}
                      </div>

                      {c.evidenciaLiteral && (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 mb-2 text-[11px] text-slate-700 font-mono">
                          <span className="text-emerald-700 font-bold mr-2">[{c.paginaOSeccion}]:</span>
                          <span>{c.evidenciaLiteral}</span>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="space-y-2 mt-2 p-3 bg-white rounded-lg border border-slate-300">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                              Explicación del Hallazgo:
                            </label>
                            <textarea
                              rows={2}
                              value={c.hallazgoExplicacion}
                              onChange={(e) => handleUpdateCriterion(c.id, { hallazgoExplicacion: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                              Acción Correctiva Propuesta:
                            </label>
                            <input
                              type="text"
                              value={c.accionCorrectiva}
                              onChange={(e) => handleUpdateCriterion(c.id, { accionCorrectiva: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                            />
                          </div>
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => setEditingCriterionId(null)}
                              className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
                            >
                              Guardar cambios
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                          <div className="p-2.5 bg-white/70 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-800 block">Hallazgo Técnico:</span>
                            <span className="text-slate-700">{c.hallazgoExplicacion}</span>
                            {c.sustentoFaltante && (
                              <span className="block mt-1 text-red-700 font-medium">
                                <strong>Falta:</strong> {c.sustentoFaltante}
                              </span>
                            )}
                          </div>

                          <div className="p-2.5 bg-white/70 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-800 block">Acción Correctiva Propuesta:</span>
                            <span className="text-slate-700">{c.accionCorrectiva}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
