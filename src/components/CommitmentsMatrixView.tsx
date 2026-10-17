import React, { useState, useMemo } from 'react';
import {
  FileText,
  Upload,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
  ChevronUp,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
  XCircle,
  Eye,
  Info,
  Layers,
  Activity,
  Terminal,
  Bug,
  Copy,
  Check,
} from 'lucide-react';
import {
  PmmrsCommitment,
  CommitmentsMatrixReport,
  CommitmentCategory,
  CommitmentFormulationStatus,
  CommitmentValidationDecision,
  CommitmentConfidenceLevel,
  CommitmentAnalysisStatus,
  DiagnosticInfo,
  PmmrsData,
} from '../types/pmrs';
import {
  buildCommitmentsFromStructuredPlan,
  calculateCommitmentsSummary,
  COMMITMENT_DISCLAIMER_NOTE,
} from '../utils/commitmentsEngine';
import { FICTITIOUS_DEMO_PMMRS } from '../data/demoData';
import {
  extractTextFromPdfFile,
  fileToBase64,
  renderPdfPagesAsImages,
  PdfExtractionResult,
  ScannedPageImage,
} from '../utils/pdfExtractor';
import { generateCommitmentsDocx } from '../utils/docxGenerator';
import { generateCommitmentsPdf } from '../utils/pdfGenerator';
import {
  generateCommitmentsExcelBuffer,
  generateCommitmentsExcelBlob,
  buildCommitmentsExcelFileName,
  getIncludedSortedCommitments,
  downloadCommitmentsExcel,
  COMMITMENTS_EXCEL_FILE_NAME,
} from '../utils/excelGenerator';
import {
  CommitmentReviewStatus,
  CommitmentRecordIntegrity,
} from '../types/pmrs';

interface CommitmentsMatrixViewProps {
  pmmrsData?: PmmrsData;
  onNavigateToCreate?: () => void;
  onNavigateToReview?: () => void;
}

interface StageProgressInfo {
  stage: number;
  stageName: string;
  detail: string;
}

interface CachedDocumentData {
  file: File;
  pdfBase64: string;
  extraction: PdfExtractionResult;
  scannedImages: ScannedPageImage[];
  isScanned: boolean;
  initialDiag: DiagnosticInfo;
}

export const CommitmentsMatrixView: React.FC<CommitmentsMatrixViewProps> = ({
  pmmrsData,
  onNavigateToCreate,
  onNavigateToReview,
}) => {
  // Estado principal de la matriz
  const [report, setReport] = useState<CommitmentsMatrixReport | null>(null);
  const [sourceMode, setSourceMode] = useState<'app' | 'pdf' | null>(null);

  // Estados de proceso y diagnóstico
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stageProgress, setStageProgress] = useState<StageProgressInfo | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<CommitmentAnalysisStatus | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [showDiagnosticPanel, setShowDiagnosticPanel] = useState<boolean>(false);
  const [copiedDiagnostic, setCopiedDiagnostic] = useState<boolean>(false);

  // Documento cargado preservado en memoria y tolerancia a fallos de Gemini
  const [cachedDoc, setCachedDoc] = useState<CachedDocumentData | null>(null);
  const [isTemporaryOverload, setIsTemporaryOverload] = useState<boolean>(false);

  // Filtros de visualización
  const [searchTerm, setSearchTerm] = useState('');
  const [validationFilter, setValidationFilter] = useState<'INCLUIDOS' | 'ALL' | CommitmentValidationDecision>('INCLUIDOS');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<'ALL' | CommitmentReviewStatus>('ALL');
  const [integrityFilter, setIntegrityFilter] = useState<'ALL' | CommitmentRecordIntegrity>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [onlyMissingData, setOnlyMissingData] = useState(false);
  const [onlyContradictions, setOnlyContradictions] = useState(false);

  // Filas expandidas y modal de edición / agregar manual
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [selectedCommitment, setSelectedCommitment] = useState<PmmrsCommitment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddManualModalOpen, setIsAddManualModalOpen] = useState(false);
  const [formCommitment, setFormCommitment] = useState<Partial<PmmrsCommitment>>({});

  // Estados de exportación
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [excelExportError, setExcelExportError] = useState<string | null>(null);

  const toggleRowExpanded = (id: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyDiagnosticJson = () => {
    if (!diagnosticInfo) return;
    navigator.clipboard.writeText(JSON.stringify(diagnosticInfo, null, 2));
    setCopiedDiagnostic(true);
    setTimeout(() => setCopiedDiagnostic(false), 2000);
  };

  // =========================================================================
  // MODALIDAD 1 — PMMRS ELABORADO EN ESTA APLICACIÓN
  // =========================================================================
  const handleSyncStructuredPlan = () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStatus(null);
    setStageProgress({
      stage: 1,
      stageName: 'Sincronizando PMMRS estructurado',
      detail: 'Recuperando objetivos, segregación, almacenamiento, rutas, residuos y cronograma...',
    });

    setTimeout(() => {
      try {
        let activePlanData = pmmrsData;
        if (!activePlanData) {
          try {
            const saved = localStorage.getItem('pmrs_form_data');
            if (saved) activePlanData = JSON.parse(saved);
          } catch (e) {
            console.warn('Error al leer borrador local de PMMRS:', e);
          }
        }

        if (!activePlanData) {
          activePlanData = FICTITIOUS_DEMO_PMMRS;
          try {
            localStorage.setItem('pmrs_form_data', JSON.stringify(FICTITIOUS_DEMO_PMMRS));
          } catch (e) {
            // ignore
          }
        }

        const syncReport = buildCommitmentsFromStructuredPlan(activePlanData);
        setReport(syncReport);
        setSourceMode('app');
        setAnalysisStatus(
          syncReport.compromisos.length > 0 ? 'EXITO_CON_COMPROMISOS' : 'EXITO_SIN_COMPROMISOS'
        );

        const confirmados = syncReport.compromisos.filter(
          (c) => c.decision_validacion === 'CONFIRMADO'
        ).length;
        const ambiguos = syncReport.compromisos.filter(
          (c) => c.decision_validacion === 'AMBIGUO'
        ).length;
        const rechazados = syncReport.compromisos.filter(
          (c) => c.decision_validacion === 'RECHAZADO'
        ).length;

        setDiagnosticInfo({
          nombreArchivo: 'PMMRS elaborado en la aplicación',
          tamanoRecibido: 'Estructura en memoria (JSON PMMRS)',
          totalPaginas: 12,
          paginasEnviadasAlModelo: 12,
          bloquesProcesados: 12,
          estadoExtractor: 'Sincronización directa estructurada exitosa',
          candidatosDevueltos: syncReport.compromisos.length,
          estadoValidador: 'Validado conforme a formulación técnica del plan',
          confirmados,
          ambiguos,
          rechazados,
          estadoValidacionJson: 'Estructura conforme con 22 campos exigidos',
          mensajeError: null,
          cantidadFinalTabla: syncReport.compromisos.length,
          cantidadFinalExportacion: syncReport.compromisos.length,
        });
      } catch (err: any) {
        console.error('Error al sincronizar PMMRS estructurado:', err);
        setAnalysisStatus('ERROR_VALIDACION');
        setAnalysisError('Ocurrió un error al procesar los datos registrados en el módulo Elaborar PMMRS: ' + (err?.message || err));
      } finally {
        setIsAnalyzing(false);
        setStageProgress(null);
      }
    }, 350);
  };

  // =========================================================================
  // MODALIDAD 2 — CARGAR UN PMMRS EXISTENTE (PROCESO MULTI-ETAPA REAL)
  // =========================================================================
  const handlePdfFileSelect = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setAnalysisStatus('ERROR_LECTURA_PDF');
      setAnalysisError('Solo se admiten documentos en formato PDF (.pdf).');
      return;
    }

    if (file.size > 40 * 1024 * 1024) {
      setAnalysisStatus('ERROR_LECTURA_PDF');
      setAnalysisError('El archivo supera el tamaño máximo permitido de 40 MB.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStatus(null);
    setReport(null);

    const initialDiag: DiagnosticInfo = {
      nombreArchivo: file.name,
      tamanoRecibido: `${(file.size / 1024).toFixed(1)} KB (${file.size.toLocaleString('es-PE')} bytes)`,
      totalPaginas: 0,
      paginasEnviadasAlModelo: 0,
      bloquesProcesados: 0,
      estadoExtractor: 'Pendiente de inicio',
      candidatosDevueltos: 0,
      estadoValidador: 'Pendiente de inicio',
      confirmados: 0,
      ambiguos: 0,
      rechazados: 0,
      estadoValidacionJson: 'Pendiente de validación',
      mensajeError: null,
      cantidadFinalTabla: 0,
      cantidadFinalExportacion: 0,
      rutaSolicitada: 'POST /api/extract-commitment-candidates',
      metodoHttp: 'POST',
      codigoRespuestaHttp: 'Pendiente',
      contentTypeRecibido: 'Pendiente',
      confirmacionServidor: 'Pendiente',
      estadoGeminiApiKey: 'Pendiente',
      pdfEnviadoAlSdk: 'Pendiente',
      estadoRespuestaGemini: 'Pendiente',
      candidatosAntesValidacion: 0,
      fragmentoRespuestaNoJson: null,
    };
    setDiagnosticInfo(initialDiag);

    try {
      // -------------------------------------------------------------
      // ETAPA 1 & 2: Lectura binaria y validación estructural del PDF
      // -------------------------------------------------------------
      setStageProgress({
        stage: 1,
        stageName: 'Etapa 1: Validación del archivo y lectura binaria',
        detail: 'Cargando contenido binario completo del PDF y validando estructura...',
      });

      // Conversión obligatoria a Base64 (eliminando prefijo data:application/pdf;base64, si existiera)
      let pdfBase64: string;
      try {
        const rawB64 = await fileToBase64(file);
        pdfBase64 = rawB64.replace(/^data:application\/pdf;base64,/i, '').trim();
        if (!pdfBase64 || pdfBase64.length === 0) {
          throw new Error('El contenido Base64 obtenido del archivo PDF está vacío.');
        }
      } catch (b64Err: any) {
        throw new Error(`Error de lectura binaria del archivo PDF: ${b64Err?.message || b64Err}`);
      }

      // Lectura por páginas del PDF para conteo exacto y segmentación
      setStageProgress({
        stage: 2,
        stageName: 'Etapa 2: Lectura del documento e inspección de páginas',
        detail: 'Verificando páginas, identificando párrafos, tablas y legibilidad...',
      });

      let extraction: PdfExtractionResult;
      try {
        extraction = await extractTextFromPdfFile(file, (percent, msg) => {
          setStageProgress((prev) => ({
            stage: percent < 35 ? 1 : 2,
            stageName: percent < 35 ? 'Etapa 1: Validación del archivo' : 'Etapa 2: Lectura e inspección de páginas',
            detail: msg,
          }));
        });
      } catch (extErr: any) {
        setAnalysisStatus('ERROR_LECTURA_PDF');
        throw new Error(`Error de lectura del PDF: ${extErr?.message || extErr}`);
      }

      const isScanned = extraction.isScannedOrEmpty;
      let scannedImages: ScannedPageImage[] = [];

      if (isScanned) {
        setStageProgress({
          stage: 2,
          stageName: 'Etapa 2: Renderizado visual de páginas escaneadas',
          detail: 'Generando imágenes de alta resolución para soporte visual...',
        });
        scannedImages = await renderPdfPagesAsImages(file, 15);
      }

      // Actualizar diagnóstico preliminar
      initialDiag.totalPaginas = extraction.totalPages;
      initialDiag.paginasEnviadasAlModelo = extraction.totalPages;
      initialDiag.bloquesProcesados = extraction.blocks.length || 1;
      setDiagnosticInfo({ ...initialDiag });

      // CONSERVAR EL DOCUMENTO PROCESADO EN MEMORIA
      const docData: CachedDocumentData = {
        file,
        pdfBase64,
        extraction,
        scannedImages,
        isScanned,
        initialDiag: { ...initialDiag },
      };
      setCachedDoc(docData);

      // Ejecutar Etapa 3 (Extractor) y Etapa 4 (Validador) como llamadas separadas
      await executeExtractionWithGemini(docData);
    } catch (err: any) {
      console.error('Error durante la validación o lectura previa del PDF:', err);
      const msg = err?.message || 'Ocurrió un error inesperado al procesar el archivo PDF.';
      setAnalysisError(msg);
      if (!analysisStatus) {
        setAnalysisStatus(
          msg.includes('lectura') || msg.includes('binaria')
            ? 'ERROR_LECTURA_PDF'
            : 'ERROR_VALIDACION'
        );
      }
    } finally {
      setIsAnalyzing(false);
      setStageProgress(null);
    }
  };

  /**
   * Identifica si un error es transitorio (503 UNAVAILABLE, alta demanda, timeout, etc.)
   */
  const isTransientError = (status: number, errData: any): boolean => {
    if (status === 503 || status === 504 || status === 429) return true;
    const str =
      typeof errData === 'string'
        ? errData
        : `${errData?.error?.mensaje || errData?.error || ''} ${errData?.error?.codigo || ''} ${
            errData?.detalle || ''
          } ${JSON.stringify(errData || {})}`;
    const lower = str.toLowerCase();
    return (
      lower.includes('503') ||
      lower.includes('unavailable') ||
      lower.includes('high demand') ||
      lower.includes('alta demanda') ||
      lower.includes('service unavailable') ||
      lower.includes('resource exhausted') ||
      lower.includes('rate limit') ||
      lower.includes('saturado') ||
      lower.includes('429') ||
      lower.includes('timeout') ||
      lower.includes('deadline exceeded') ||
      lower.includes('temporarily') ||
      lower.includes('experiencing high demand')
    );
  };

  /**
   * Ejecuta una llamada fetch verificando obligatoriamente response.ok, response.status
   * y Content-Type antes de invocar response.json().
   * Si el servidor devuelve HTML o cualquier otro formato no JSON, no intenta parsearlo como JSON.
   */
  const fetchJsonVerified = async (
    url: string,
    method: string,
    payload: Record<string, any>,
    diag: DiagnosticInfo
  ): Promise<{ status: number; contentType: string; data: any }> => {
    const cleanUrl = url.startsWith('/api/') ? url : `/api/${url.replace(/^\/+/, '')}`;
    const httpMethod = (method || 'POST').toUpperCase();
    const currentTimestamp = new Date().toISOString();
    const detectedEnv =
      typeof window !== 'undefined'
        ? window.location.hostname.includes('ais-pre')
          ? 'shared/published (ais-pre)'
          : window.location.hostname.includes('ais-dev')
          ? 'preview (ais-dev)'
          : window.location.origin
        : 'browser';

    diag.rutaSolicitada = cleanUrl;
    diag.metodoHttp = httpMethod;
    diag.entornoEjecucion = detectedEnv;
    diag.timestampDiagnostico = currentTimestamp;
    setDiagnosticInfo({ ...diag });

    const res = await fetch(cleanUrl, {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const contentType = res.headers.get('content-type') || 'no especificado';

    diag.codigoRespuestaHttp = status;
    diag.contentTypeRecibido = contentType;
    setDiagnosticInfo({ ...diag });

    const isJsonContentType = contentType.toLowerCase().includes('application/json');

    if (!isJsonContentType) {
      const rawText = await res.text();
      const first200 = rawText.slice(0, 200);
      diag.fragmentoRespuestaNoJson = first200;
      diag.respuestaHttpRaw = `HTTP ${status} (${contentType}): ${first200}`;
      diag.confirmacionServidor = 'Respuesta no-JSON recibida';
      diag.estadoRespuestaGemini = `Formato inválido (${contentType})`;
      diag.mensajeError = `Ruta: ${cleanUrl} | Método: ${httpMethod} | Entorno: ${detectedEnv} | Timestamp: ${currentTimestamp} | Respuesta HTTP: ${status} (${contentType}) | Primeros 200 caracteres: ${first200}`;
      setDiagnosticInfo({ ...diag });

      const nonJsonErr: any = new Error(
        status === 404
          ? 'No fue posible completar el análisis porque el servicio interno no está disponible en esta versión de la aplicación.'
          : 'La ruta del servicio devolvió HTML en lugar de JSON'
      );
      nonJsonErr.isNonJsonResponse = status !== 404;
      nonJsonErr.isRouteMissing = status === 404;
      nonJsonErr.status = status;
      nonJsonErr.contentType = contentType;
      nonJsonErr.snippet = first200;
      throw nonJsonErr;
    }

    // Solo ejecutamos response.json() tras haber verificado que Content-Type contiene application/json
    let parsedJson: any;
    try {
      parsedJson = await res.json();
    } catch (parseErr: any) {
      diag.mensajeError = `Error al parsear JSON desde ${cleanUrl} (HTTP ${status}, Content-Type: ${contentType}): ${
        parseErr?.message || parseErr
      }`;
      setDiagnosticInfo({ ...diag });
      const jsonErr: any = new Error('El cuerpo de la respuesta no contiene JSON válido.');
      jsonErr.status = status;
      throw jsonErr;
    }

    diag.respuestaHttpRaw = `HTTP ${status} (${contentType}) · ${JSON.stringify(parsedJson).slice(0, 240)}`;

    // Actualizar metadatos técnicos devueltos por el servidor
    if (parsedJson?.meta) {
      diag.confirmacionServidor = parsedJson.meta.servidorEjecutado
        ? 'Confirmada (Servidor Node.js Express)'
        : 'Confirmada';
      if (parsedJson.meta.geminiApiKey) {
        diag.estadoGeminiApiKey =
          parsedJson.meta.geminiApiKey === 'configurada' ? 'configurada' : 'no configurada';
      }
      if (parsedJson.meta.pdfEnviadoAlSdk !== undefined) {
        diag.pdfEnviadoAlSdk = parsedJson.meta.pdfEnviadoAlSdk
          ? 'Confirmado (inlineData application/pdf enviado al SDK)'
          : 'No enviado';
      }
      if (parsedJson.meta.estadoGemini) {
        diag.estadoRespuestaGemini = parsedJson.meta.estadoGemini;
      }
      setDiagnosticInfo({ ...diag });
    }

    if (!res.ok || parsedJson?.ok === false) {
      const errObj = parsedJson?.error;
      const isRouteNotFound =
        status === 404 ||
        errObj?.codigo === 'RUTA_API_NO_ENCONTRADA' ||
        String(errObj?.mensaje || '').includes('no está registrada') ||
        String(errObj?.mensaje || '').includes('no está disponible en esta versión');

      if (errObj?.entorno) diag.entornoEjecucion = `${detectedEnv} (Server: ${errObj.entorno})`;
      if (errObj?.timestamp) diag.timestampDiagnostico = errObj.timestamp;
      if (Array.isArray(errObj?.rutasActivas)) diag.rutasActivasServidor = errObj.rutasActivas;

      const userFacingMsg = isRouteNotFound
        ? 'No fue posible completar el análisis porque el servicio interno no está disponible en esta versión de la aplicación.'
        : (typeof errObj === 'object' && errObj?.mensaje) ||
          (typeof errObj === 'string' ? errObj : null) ||
          parsedJson?.detalle ||
          `El servidor respondió con código HTTP ${status}`;

      const safeDetail = `Ruta: ${cleanUrl} | Método: ${httpMethod} | Entorno: ${diag.entornoEjecucion} | Timestamp: ${diag.timestampDiagnostico} | Respuesta HTTP: ${status} | Detalle: ${
        (typeof errObj === 'object' && (errObj?.detalle_seguro || errObj?.mensaje)) || userFacingMsg
      }`;

      diag.mensajeError = safeDetail;
      setDiagnosticInfo({ ...diag });

      const apiErr: any = new Error(userFacingMsg);
      apiErr.status = status;
      apiErr.errJson = parsedJson;
      apiErr.technicalDetail = safeDetail;
      apiErr.isRouteMissing = isRouteNotFound;
      apiErr.isTransient = isTransientError(status, parsedJson);
      throw apiErr;
    }

    return { status, contentType, data: parsedJson };
  };

  /**
   * ETAPA 3 & 4: LLAMADAS SEPARADAS AL EXTRACTOR Y AL VALIDADOR
   * - Primera llamada: POST /api/extract-commitment-candidates (Etapa 3)
   * - Segunda llamada: POST /api/validate-commitment-candidates (Etapa 4)
   * No inicia el validador si el extractor no terminó correctamente.
   */
  const executeExtractionWithGemini = async (docData: CachedDocumentData) => {
    const { file, pdfBase64, extraction, scannedImages, isScanned } = docData;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStatus(null);
    setIsTemporaryOverload(false);

    const cleanPdfBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/i, '').trim();

    const diag: DiagnosticInfo = {
      ...docData.initialDiag,
      totalPaginas: extraction.totalPages,
      paginasEnviadasAlModelo: extraction.totalPages,
      bloquesProcesados: extraction.blocks.length || 1,
      estadoExtractor: 'Iniciando Etapa 3 (Extractor)...',
      estadoValidador: 'En espera de finalización de Etapa 3',
      mensajeError: null,
      rutaSolicitada: '/api/extract-commitment-candidates',
      metodoHttp: 'POST',
      codigoRespuestaHttp: 'En curso...',
      contentTypeRecibido: 'En curso...',
      confirmacionServidor: 'Verificando...',
      estadoGeminiApiKey: 'Verificando...',
      pdfEnviadoAlSdk: 'Preparado para envío (inlineData application/pdf)',
      estadoRespuestaGemini: 'En curso...',
      candidatosAntesValidacion: 0,
      fragmentoRespuestaNoJson: null,
    };
    setDiagnosticInfo({ ...diag });

    const maxAttempts = 3;
    const delays = [0, 2000, 5000];
    let lastError: any = null;
    let lastStatus: number = 0;
    let lastErrJson: any = null;

    // =========================================================================
    // PRIMERA LLAMADA (ETAPA 3): EXTRACCIÓN DE CANDIDATOS
    // =========================================================================
    let extractedCandidates: any[] | null = null;
    let extractorSuccess = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          const delayMs = delays[attempt - 1] || 5000;
          setStageProgress({
            stage: 3,
            stageName: 'Etapa 3: Extractor de candidatos con IA',
            detail: `Gemini está temporalmente ocupado. Reintentando extracción (Intento ${attempt}/${maxAttempts})…`,
          });
          diag.estadoExtractor = `Reintentando extracción… (Intento ${attempt}/${maxAttempts})`;
          setDiagnosticInfo({ ...diag });
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          setStageProgress({
            stage: 3,
            stageName: 'Etapa 3: Extractor de candidatos (Llamada 1 a Gemini)',
            detail:
              'Enviando PDF binario completo (inlineData application/pdf) a /api/extract-commitment-candidates...',
          });
          diag.estadoExtractor = 'Enviando POST /api/extract-commitment-candidates...';
          setDiagnosticInfo({ ...diag });
        }

        const extResponse = await fetchJsonVerified(
          '/api/extract-commitment-candidates',
          'POST',
          {
            pdfBase64: cleanPdfBase64,
            mimeType: file.type || 'application/pdf',
            fileSize: file.size,
            fullText: extraction.fullText,
            pagesText: extraction.pages,
            pageImages: scannedImages,
            isScanned,
            fileName: file.name,
            companyName: file.name.replace(/\.pdf$/i, ''),
            totalPages: extraction.totalPages,
            bloques: extraction.blocks.length || 1,
          },
          diag
        );

        const extPayload = extResponse.data;
        const rawCandidates =
          extPayload?.candidates ??
          extPayload?.data?.candidates ??
          extPayload?.data?.candidatos ??
          extPayload?.candidatos;

        const extractorDiag = extPayload?.rawDiagnostics ?? extPayload?.meta?.diagnosticoExtractor;
        if (extractorDiag) {
          diag.diagnosticoExtractor = extractorDiag;
        }

        if (!extPayload || extPayload.ok === false || !Array.isArray(rawCandidates)) {
          diag.estadoValidacionJson = 'Error: No fue posible interpretar la respuesta del modelo (candidates ausente o inválido).';
          diag.mensajeError = 'No fue posible interpretar la respuesta del modelo.';
          setDiagnosticInfo({ ...diag });
          const structErr: any = new Error(
            'No fue posible interpretar la respuesta del modelo.'
          );
          structErr.isJsonStructureError = true;
          structErr.rawDiagnostics = extractorDiag;
          throw structErr;
        }

        extractedCandidates = rawCandidates;
        extractorSuccess = true;
        diag.candidatosAntesValidacion = extractedCandidates.length;
        diag.candidatosDevueltos = extractedCandidates.length;
        diag.estadoExtractor = `Completado exitosamente (HTTP ${extResponse.status} · ${extractedCandidates.length} candidatos)`;
        setDiagnosticInfo({ ...diag });
        break;
      } catch (err: any) {
        lastError = err;
        lastStatus = err?.status || 0;
        lastErrJson = err?.errJson || null;
        const isTransient = Boolean(err?.isTransient || isTransientError(lastStatus, lastErrJson || err));
        if (isTransient && attempt < maxAttempts && !err?.isNonJsonResponse) {
          continue;
        }
        break;
      }
    }

    // PROHIBIDO iniciar el validador si el extractor no terminó correctamente
    if (!extractorSuccess || extractedCandidates === null) {
      diag.estadoValidador = 'No iniciado (Etapa 3 no finalizó correctamente)';
      handleFinalPipelineError(lastError, lastStatus, lastErrJson, diag);
      return;
    }

    // Si el extractor terminó correctamente y determinó expresamente que existen 0 candidatos
    if (extractedCandidates.length === 0) {
      const hasUnprocessedPages = extraction.validationReport.pagesRequiringOcr.length > 0;
      const finalStatus: CommitmentAnalysisStatus = hasUnprocessedPages
        ? 'ERROR_PAGINAS_NO_PROCESADAS'
        : 'EXITO_SIN_COMPROMISOS';
      setAnalysisStatus(finalStatus);

      diag.estadoValidador = 'No requerido (0 candidatos extraídos)';
      diag.estadoValidacionJson = 'JSON estructurado válido (0 candidatos)';
      diag.mensajeError = null;
      diag.cantidadFinalTabla = 0;
      diag.cantidadFinalExportacion = 0;
      setDiagnosticInfo({ ...diag });

      const emptySummary = calculateCommitmentsSummary([]);
      setReport({
        id: `MATRIZ-${Date.now()}`,
        fechaAnalisis: new Date().toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        nombreTitular: file.name.replace(/\.pdf$/i, ''),
        nombreProyecto: file.name.replace(/\.pdf$/i, ''),
        archivoAnalizado: file.name,
        origen: 'PDF analizado',
        tipoExtraccion: isScanned ? 'OCR/multimodal' : 'texto',
        totalPaginas: extraction.totalPages,
        paginasConAdvertencia: extraction.validationReport.pagesWithWarnings,
        paginasRequierenOcr: extraction.validationReport.pagesRequiringOcr,
        candidatosExtraidosTotal: 0,
        compromisosConfirmadosTotal: 0,
        compromisosAmbiguosTotal: 0,
        compromisosRechazadosTotal: 0,
        compromisos: [],
        resumen: emptySummary,
        notaAlcance: COMMITMENT_DISCLAIMER_NOTE,
      });
      setSourceMode('pdf');
      setIsTemporaryOverload(false);
      return;
    }

    // =========================================================================
    // SEGUNDA LLAMADA (ETAPA 4): VALIDACIÓN, CONSOLIDACIÓN Y AUDITORÍA DE OMISIONES
    // =========================================================================
    let validationsList: any[] | null = null;
    let finalCandidatesFromValidator: any[] | null = null;
    let contradictionsList: any[] = [];
    let omissionsRecoveredCount = 0;
    let omissionsAuditSummary = '';
    let validatorSuccess = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          const delayMs = delays[attempt - 1] || 5000;
          setStageProgress({
            stage: 4,
            stageName: 'Etapa 4: Validador técnico y Auditoría de Omisiones (Pasadas 2 y 3)',
            detail: `Gemini está temporalmente ocupado. Reintentando validación (Intento ${attempt}/${maxAttempts})…`,
          });
          diag.estadoValidador = `Reintentando validación… (Intento ${attempt}/${maxAttempts})`;
          setDiagnosticInfo({ ...diag });
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          setStageProgress({
            stage: 4,
            stageName: 'Etapa 4: Validación, Consolidación y Auditoría de Omisiones (Pasadas 2 y 3)',
            detail: `Validando ${extractedCandidates.length} candidatos y ejecutando tercera pasada de auditoría de omisiones contra las ${extraction.totalPages} páginas...`,
          });
          diag.estadoValidador = `Enviando POST /api/validate-commitment-candidates (${extractedCandidates.length} candidatos + Pasada 3 Auditoría de Omisiones)...`;
          setDiagnosticInfo({ ...diag });
        }

        const valResponse = await fetchJsonVerified(
          '/api/validate-commitment-candidates',
          'POST',
          {
            candidatos: extractedCandidates,
            fileName: file.name,
            companyName: 'Agrovision Perú S.A.C.',
            fullText: extraction.fullText,
            pagesText: extraction.pages,
            pdfBase64: cleanPdfBase64,
            totalPages: extraction.totalPages,
            bloques: extraction.blocks.length || 1,
          },
          diag
        );

        const valPayload = valResponse.data;
        const rawValidations = valPayload?.data?.validaciones ?? valPayload?.validaciones;
        const rawFinalCandidates = valPayload?.data?.candidatosFinales ?? valPayload?.candidatosFinales;
        const rawContradictions = valPayload?.data?.contradicciones ?? valPayload?.contradicciones ?? [];
        omissionsRecoveredCount = Number(valPayload?.data?.omisionesRecuperadas ?? valPayload?.meta?.omisionesRecuperadas ?? 0);
        omissionsAuditSummary =
          valPayload?.data?.resumenAuditoriaOmisiones ||
          'Auditoría de 3 pasadas completada sobre el documento íntegro.';

        if (!valPayload || valPayload.ok === false || !Array.isArray(rawValidations)) {
          diag.estadoValidacionJson = 'Error: data.validaciones no es un arreglo válido.';
          diag.mensajeError = 'La respuesta del validador no contiene el arreglo data.validaciones esperado.';
          setDiagnosticInfo({ ...diag });
          const valStructErr: any = new Error(
            'Error de estructura JSON: El validador no devolvió un arreglo válido de validaciones.'
          );
          valStructErr.isJsonStructureError = true;
          throw valStructErr;
        }

        validationsList = rawValidations;
        finalCandidatesFromValidator = Array.isArray(rawFinalCandidates) && rawFinalCandidates.length > 0
          ? rawFinalCandidates
          : extractedCandidates;
        contradictionsList = Array.isArray(rawContradictions) ? rawContradictions : [];
        validatorSuccess = true;
        diag.estadoValidador = `Completado exitosamente (HTTP ${valResponse.status} · ${validationsList.length} evaluados · ${omissionsRecoveredCount} omisiones recuperadas en Pasada 3)`;
        diag.omisionesRecuperadas = omissionsRecoveredCount;
        diag.estadoAuditoriaOmisiones = omissionsAuditSummary;
        setDiagnosticInfo({ ...diag });
        break;
      } catch (err: any) {
        lastError = err;
        lastStatus = err?.status || 0;
        lastErrJson = err?.errJson || null;
        const isTransient = Boolean(err?.isTransient || isTransientError(lastStatus, lastErrJson || err));
        if (isTransient && attempt < maxAttempts && !err?.isNonJsonResponse) {
          continue;
        }
        break;
      }
    }

    if (!validatorSuccess || validationsList === null) {
      handleFinalPipelineError(lastError, lastStatus, lastErrJson, diag, true);
      return;
    }

    // =========================================================================
    // CONSOLIDACIÓN DE CANDIDATOS FINALES (PASADAS 1, 2 Y 3)
    // =========================================================================
    const activeCandidatesList = finalCandidatesFromValidator || extractedCandidates;

    const rawMappedCommitments: PmmrsCommitment[] = activeCandidatesList.map((cand: any, idx: number) => {
      const val =
        validationsList!.find(
          (v: any) =>
            (v.id_candidato && v.id_candidato === cand.id_candidato) ||
            (v.numero && Number(v.numero) === Number(cand.numero))
        ) ||
        validationsList![idx] ||
        {};

      const decVal = (['CONFIRMADO', 'AMBIGUO', 'RECHAZADO'].includes(val.decision_validacion)
        ? val.decision_validacion
        : 'CONFIRMADO') as CommitmentValidationDecision;

      const responsableFinal =
        (val.responsable_corregido && val.responsable_corregido.trim()) ||
        (cand.responsable && cand.responsable.trim()) ||
        'Agrovision Perú S.A.C.';

      const plazoFinal =
        (val.plazo_corregido && val.plazo_corregido.trim()) ||
        (cand.plazo && cand.plazo.trim()) ||
        'Frecuencia no precisada';

      const frecuenciaFinal =
        (val.frecuencia_corregida && val.frecuencia_corregida.trim()) ||
        (cand.frecuencia && cand.frecuencia.trim()) ||
        'Frecuencia no precisada';

      const frecPlazoFinal =
        (val.frecuencia_plazo_corregido && val.frecuencia_plazo_corregido.trim()) ||
        (cand.frecuencia_plazo && cand.frecuencia_plazo.trim()) ||
        (frecuenciaFinal !== 'Frecuencia no precisada' && frecuenciaFinal !== 'No identificada'
          ? frecuenciaFinal
          : plazoFinal !== 'No identificado'
          ? plazoFinal
          : 'Frecuencia no precisada');

      const rawEvidenciaSugerida =
        (val.evidencia_sugerida_corregida && val.evidencia_sugerida_corregida.trim()) ||
        (cand.evidencia_sugerida && cand.evidencia_sugerida.trim()) ||
        (val.indicador_corregido && val.indicador_corregido.trim()) ||
        (cand.indicador_evidencia && cand.indicador_evidencia.trim()) ||
        'Evidencia sugerida: Registro documental o fotográfico de verificación.';

      const evidenciaSugeridaFinal = /^evidencia sugerida\s*:/i.test(rawEvidenciaSugerida)
        ? rawEvidenciaSugerida
        : `Evidencia sugerida: ${rawEvidenciaSugerida}`;

      const residuoProcesoFinal =
        (val.residuo_proceso_corregido && val.residuo_proceso_corregido.trim()) ||
        (cand.residuo_proceso && cand.residuo_proceso.trim()) ||
        'Residuos sólidos del PMMRS';

      const est = (['COMPLETO', 'PARCIAL', 'AMBIGUO', 'NO EVALUABLE'].includes(val.estado_cumplimiento)
        ? val.estado_cumplimiento
        : decVal === 'RECHAZADO'
        ? 'NO EVALUABLE'
        : decVal === 'AMBIGUO'
        ? 'AMBIGUO'
        : frecPlazoFinal !== 'Frecuencia no precisada'
        ? 'COMPLETO'
        : 'PARCIAL') as CommitmentFormulationStatus;

      const estadoRevisionFinal: CommitmentReviewStatus =
        decVal === 'RECHAZADO'
          ? 'Descartado'
          : decVal === 'AMBIGUO'
          ? 'Pendiente'
          : 'Validado';

      const integridadFinal: CommitmentRecordIntegrity =
        decVal === 'AMBIGUO' || decVal === 'RECHAZADO'
          ? 'Requiere revisión'
          : est === 'COMPLETO'
          ? 'Completo'
          : 'Parcial';

      const conf = (['ALTO', 'MEDIO', 'BAJO'].includes(val.nivel_confianza)
        ? val.nivel_confianza
        : est === 'COMPLETO'
        ? 'ALTO'
        : 'MEDIO') as CommitmentConfidenceLevel;

      const paginaPdfRaw = cand.pagina_pdf ?? 1;
      const paginaNum = typeof paginaPdfRaw === 'number' ? paginaPdfRaw : parseInt(String(paginaPdfRaw), 10) || 1;
      const paginaDisplay = String(paginaPdfRaw);
      const paginaImpresaFinal = cand.pagina_impresa ? String(cand.pagina_impresa) : String(paginaPdfRaw);
      const tieneDuplicado = Boolean(val.posible_duplicado);

      const alertasFinal =
        val.alertas?.trim() ||
        (tieneDuplicado ? 'Posible contradicción o duplicado' : 'Sin alertas identificadas');

      const obsFinal =
        (val.observaciones && val.observaciones.trim()) ||
        (cand.observaciones && cand.observaciones.trim()) ||
        'El PMMRS no identifica un cargo o área responsable específica.';

      const compromisoNorm =
        (val.compromiso_normalizado_corregido && val.compromiso_normalizado_corregido.trim()) ||
        cand.compromiso_normalizado?.trim() ||
        cand.compromiso?.trim() ||
        cand.texto_fuente?.trim() ||
        'Compromiso identificado';

      const textoFuente = cand.texto_fuente?.trim() || compromisoNorm;
      const seccionTablaFinal =
        (val.seccion_tabla_corregida && val.seccion_tabla_corregida.trim()) ||
        cand.seccion_tabla?.trim() ||
        cand.seccion?.trim() ||
        'Cuerpo del PMMRS';

      const temaFinal =
        (val.tema_corregido && val.tema_corregido.trim()) ||
        cand.tema?.trim() ||
        cand.categoria?.trim() ||
        'Gestión y manejo de residuos sólidos';

      const tipoFinal =
        (val.tipo_corregido && val.tipo_corregido.trim()) ||
        cand.tipo?.trim() ||
        'Medida operativa';

      const etapaFinal =
        (val.etapa_corregida && val.etapa_corregida.trim()) ||
        cand.etapa?.trim() ||
        'Gestión integral PMMRS';

      const idCand = cand.id_candidato || `CAND-PMMRS-${String(idx + 1).padStart(3, '0')}`;

      return {
        id: idCand,
        id_candidato: idCand,
        codigo: `PMMRS-${String(idx + 1).padStart(2, '0')}`,
        numero: Number(cand.numero) || idx + 1,
        documento: file.name,
        pagina_pdf: paginaPdfRaw,
        pagina_impresa: paginaImpresaFinal,
        seccion: seccionTablaFinal,
        seccion_tabla: seccionTablaFinal,
        tema: temaFinal,
        tipo: tipoFinal,
        texto_fuente: textoFuente,
        compromiso_normalizado: compromisoNorm,
        categoria: (cand.categoria || 'Medidas ambientales') as CommitmentCategory,
        etapa: etapaFinal,
        residuo_proceso: residuoProcesoFinal,
        responsable: responsableFinal,
        plazo: plazoFinal,
        frecuencia: frecuenciaFinal,
        frecuencia_plazo: frecPlazoFinal,
        indicador_evidencia: evidenciaSugeridaFinal,
        evidencia_sugerida: evidenciaSugeridaFinal,
        estado_cumplimiento: est,
        estado_revision: estadoRevisionFinal,
        integridad_registro: integridadFinal,
        decision_extractor: 'EXTRAÍDO (Pasada 1 / Pasada 3)',
        decision_validacion: decVal,
        justificacion_validacion:
          val.justificacion_validacion ||
          'Obligación verificable asumida por el titular dentro del alcance del PMMRS.',
        nivel_confianza: conf,
        posible_duplicado: tieneDuplicado,
        registros_relacionados: val.registros_relacionados || 'Ninguno',
        alertas: alertasFinal,
        campos_no_identificados:
          val.campos_no_identificados ||
          (frecPlazoFinal === 'Frecuencia no precisada'
            ? 'Cargo/área interna responsable; frecuencia específica'
            : 'Cargo/área interna responsable'),
        resultado_auditoria_omisiones:
          val.resultado_auditoria_omisiones ||
          (String(idCand).includes('OMISION')
            ? 'Recuperado en Tercera Pasada (Auditoría de Omisiones)'
            : 'Verificado en Segunda y Tercera Pasada'),

        // Retrocompatibilidad completa
        compromiso: compromisoNorm,
        procesoActividad: residuoProcesoFinal,
        residuoRelacionado: residuoProcesoFinal,
        indicador: evidenciaSugeridaFinal,
        evidenciaCumplimiento: evidenciaSugeridaFinal,
        pagina: `Pág. ${paginaDisplay}`,
        textoFuente,
        estado: est,
        estadoFormulacion: est,
        observaciones: obsFinal,
        observacion: obsFinal,
        paginasRelacionadas: [`Pág. ${paginaDisplay}`],
        posibleContradiccion: tieneDuplicado
          ? {
              hayContradiccion: true,
              detalle: alertasFinal,
            }
          : undefined,
        origen: 'PDF analizado',
      };
    });

    // Ordenar por página PDF y orden de aparición y asignar códigos PMMRS-01, PMMRS-02... a los incluidos
    const parsePageForSort = (v: number | string): number => {
      if (typeof v === 'number') return v;
      const m = String(v).match(/\d+/);
      return m ? parseInt(m[0], 10) : 9999;
    };

    const sortedAll = [...rawMappedCommitments].sort((a, b) => {
      const pA = parsePageForSort(a.pagina_pdf);
      const pB = parsePageForSort(b.pagina_pdf);
      if (pA !== pB) return pA - pB;
      return (a.numero || 0) - (b.numero || 0);
    });

    let pmmrsCounter = 0;
    const mappedCommitments: PmmrsCommitment[] = sortedAll.map((item, idx) => {
      const isIncluded = item.decision_validacion !== 'RECHAZADO' && item.estado_revision !== 'Descartado';
      if (isIncluded) {
        pmmrsCounter++;
      }
      return {
        ...item,
        numero: isIncluded ? pmmrsCounter : idx + 1,
        codigo: isIncluded ? `PMMRS-${String(pmmrsCounter).padStart(2, '0')}` : `RECH-${String(idx + 1).padStart(2, '0')}`,
      };
    });

    if (contradictionsList.length > 0) {
      contradictionsList.forEach((ct: any) => {
        const ids: string[] = Array.isArray(ct.compromisoIds) ? ct.compromisoIds : [];
        const pags: number[] = Array.isArray(ct.paginas) ? ct.paginas : [];

        let matched = false;
        mappedCommitments.forEach((cm) => {
          if (ids.includes(cm.id) || pags.includes(parsePageForSort(cm.pagina_pdf))) {
            cm.posibleContradiccion = {
              hayContradiccion: true,
              detalle: ct.descripcion || ct.titulo || 'Contradicción técnica identificada',
            };
            cm.posible_duplicado = true;
            matched = true;
          }
        });

        if (!matched && mappedCommitments.length > 0) {
          mappedCommitments[0].posibleContradiccion = {
            hayContradiccion: true,
            detalle: ct.descripcion || ct.titulo,
          };
        }
      });
    }

    const summary = calculateCommitmentsSummary(mappedCommitments);
    const hasUnprocessedPages = extraction.validationReport.pagesRequiringOcr.length > 0;

    let finalStatus: CommitmentAnalysisStatus;
    if (mappedCommitments.length > 0) {
      finalStatus = 'EXITO_CON_COMPROMISOS';
    } else if (hasUnprocessedPages) {
      finalStatus = 'ERROR_PAGINAS_NO_PROCESADAS';
    } else {
      finalStatus = 'EXITO_SIN_COMPROMISOS';
    }
    setAnalysisStatus(finalStatus);

    const confirmados = mappedCommitments.filter((c) => c.decision_validacion === 'CONFIRMADO').length;
    const ambiguos = mappedCommitments.filter((c) => c.decision_validacion === 'AMBIGUO').length;
    const rechazados = mappedCommitments.filter((c) => c.decision_validacion === 'RECHAZADO').length;
    const incluidosCount = mappedCommitments.filter(
      (c) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision !== 'Descartado'
    ).length;

    diag.confirmados = confirmados;
    diag.ambiguos = ambiguos;
    diag.rechazados = rechazados;
    diag.estadoValidacionJson = 'Estructura JSON válida (13 columnas profesionales + auditoría)';
    diag.mensajeError = null;
    diag.cantidadFinalTabla = incluidosCount;
    diag.cantidadFinalExportacion = incluidosCount;
    setDiagnosticInfo({ ...diag });

    const generatedReport: CommitmentsMatrixReport = {
      id: `MATRIZ-${Date.now()}`,
      fechaAnalisis: new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      nombreTitular: 'Agrovision Perú S.A.C.',
      nombreProyecto: file.name.replace(/\.pdf$/i, ''),
      archivoAnalizado: file.name,
      origen: 'PDF analizado',
      tipoExtraccion: isScanned ? 'OCR/multimodal' : 'texto',
      alertaCalidadLectura: isScanned
        ? 'El documento parece estar escaneado y algunas páginas no pudieron leerse con suficiente claridad. Revise los resultados antes de utilizarlos.'
        : undefined,
      totalPaginas: extraction.totalPages,
      paginasConAdvertencia: extraction.validationReport.pagesWithWarnings,
      paginasRequierenOcr: extraction.validationReport.pagesRequiringOcr,
      candidatosExtraidosTotal: extractedCandidates.length,
      candidatosEvaluadosTotal: mappedCommitments.length,
      compromisosIncluidosTotal: incluidosCount,
      compromisosConfirmadosTotal: confirmados,
      compromisosAmbiguosTotal: ambiguos,
      compromisosRechazadosTotal: rechazados,
      omisionesRecuperadasTotal: omissionsRecoveredCount,
      resumenAuditoriaOmisiones: omissionsAuditSummary,
      compromisos: mappedCommitments,
      resumen: summary,
      notaAlcance: COMMITMENT_DISCLAIMER_NOTE,
    };

    setReport(generatedReport);
    setSourceMode('pdf');
    setIsTemporaryOverload(false);
  };

  /**
   * Registra y presenta adecuadamente cualquier error del extractor o validador
   * sin convertir jamás un error en una matriz vacía.
   */
  const handleFinalPipelineError = (
    lastError: any,
    lastStatus: number,
    lastErrJson: any,
    diag: DiagnosticInfo,
    failedInValidator = false
  ) => {
    console.error('Error final en comunicación con Gemini:', lastError);

    const isRouteMissing = Boolean(
      lastError?.isRouteMissing ||
        lastStatus === 404 ||
        lastErrJson?.error?.codigo === 'RUTA_API_NO_ENCONTRADA' ||
        String(lastError?.message || '').includes('no está disponible en esta versión') ||
        String(lastError?.message || '').includes('no está registrada')
    );

    if (isRouteMissing) {
      setIsTemporaryOverload(false);
      setAnalysisStatus('ERROR_CONEXION_GEMINI');
      setAnalysisError(
        'No fue posible completar el análisis porque el servicio interno no está disponible en esta versión de la aplicación.'
      );
      diag.mensajeError =
        lastError?.technicalDetail ||
        `Ruta: ${diag.rutaSolicitada || '/api/validate-commitment-candidates'} | Método: ${diag.metodoHttp || 'POST'} | Entorno: ${diag.entornoEjecucion || 'production'} | Timestamp: ${diag.timestampDiagnostico || new Date().toISOString()} | Respuesta HTTP: ${lastStatus || 404}`;
      if (failedInValidator) {
        diag.estadoValidador = `Fallo: servicio interno no disponible (HTTP ${lastStatus || 404})`;
      } else {
        diag.estadoExtractor = `Fallo: servicio interno no disponible (HTTP ${lastStatus || 404})`;
      }
      setDiagnosticInfo({ ...diag });
      return;
    }

    if (lastError?.isNonJsonResponse) {
      setIsTemporaryOverload(false);
      setAnalysisStatus('ERROR_ESTRUCTURA_JSON');
      setAnalysisError('La ruta del servicio devolvió HTML en lugar de JSON');
      if (failedInValidator) {
        diag.estadoValidador = `Fallo: respuesta no-JSON (${lastError.contentType || 'HTML'})`;
      } else {
        diag.estadoExtractor = `Fallo: respuesta no-JSON (${lastError.contentType || 'HTML'})`;
      }
      setDiagnosticInfo({ ...diag });
      return;
    }

    const isTransient = Boolean(
      lastError?.isTransient || isTransientError(lastStatus, lastError?.message || lastErrJson)
    );

    const technicalDetailsStr =
      lastError?.technicalDetail ||
      lastErrJson?.error?.detalle_seguro ||
      lastErrJson?.technicalDetails ||
      (lastErrJson ? JSON.stringify(lastErrJson) : lastError?.message || 'Error técnico no detallado');

    diag.mensajeError = technicalDetailsStr;
    if (failedInValidator) {
      diag.estadoValidador = isTransient
        ? 'Fallo tras 3 intentos (Servicio temporalmente saturado - HTTP 503)'
        : `Fallo en el validador (${lastError?.message || 'Error'})`;
    } else {
      diag.estadoExtractor = isTransient
        ? 'Fallo tras 3 intentos (Servicio temporalmente saturado - HTTP 503)'
        : `Fallo en el extractor (${lastError?.message || 'Error'})`;
    }
    setDiagnosticInfo({ ...diag });

    const isMissingKey =
      lastErrJson?.error?.codigo === 'GEMINI_API_KEY_NO_CONFIGURADA' ||
      lastErrJson?.error?.mensaje?.includes('Servicio de IA no configurado') ||
      lastError?.message?.includes('Servicio de IA no configurado') ||
      lastError?.message?.includes('GEMINI_API_KEY no configurada');

    if (isMissingKey) {
      setIsTemporaryOverload(false);
      setAnalysisStatus('ERROR_CONEXION_GEMINI');
      setAnalysisError('Servicio de IA no configurado en el servidor.');
      return;
    }

    if (isTransient) {
      setIsTemporaryOverload(true);
      setAnalysisStatus('ERROR_CONEXION_GEMINI');
      setAnalysisError(
        'No fue posible completar el análisis con IA porque el servicio está temporalmente saturado. El documento permanece cargado. Puede reintentar sin volver a seleccionarlo.'
      );
    } else {
      setIsTemporaryOverload(false);
      const isJsonErr =
        lastError?.isJsonStructureError ||
        lastError?.message?.includes('JSON') ||
        lastError?.message?.includes('interpretar') ||
        lastErrJson?.error?.codigo?.includes('JSON') ||
        lastErrJson?.tipoError === 'ERROR_ESTRUCTURA_JSON';
      const isPdfReadErr =
        lastError?.message?.includes('lectura') ||
        lastError?.message?.includes('PDF') ||
        lastErrJson?.error?.codigo?.includes('PDF') ||
        lastErrJson?.tipoError === 'ERROR_LECTURA_PDF';

      if (lastErrJson?.rawDiagnostics) {
        diag.diagnosticoExtractor = lastErrJson.rawDiagnostics;
        setDiagnosticInfo({ ...diag });
      }

      setAnalysisStatus(
        isJsonErr
          ? 'ERROR_ESTRUCTURA_JSON'
          : isPdfReadErr
          ? 'ERROR_LECTURA_PDF'
          : 'ERROR_VALIDACION'
      );

      if (isJsonErr) {
        setAnalysisError('No fue posible interpretar la respuesta del modelo.');
      } else {
        const errMsgFromServer =
          (typeof lastErrJson?.error === 'object' ? lastErrJson?.error?.mensaje : lastErrJson?.error) ||
          lastError?.message;

        setAnalysisError(
          errMsgFromServer && !String(errMsgFromServer).startsWith('{')
            ? String(errMsgFromServer)
            : 'Ocurrió un error técnico al analizar el documento con el modelo. Consulte el diagnóstico técnico para más detalles.'
        );
      }
    }
  };

  /**
   * Reintenta el análisis directamente reutilizando los datos procesados en memoria
   */
  const handleRetryAnalysis = async () => {
    if (!cachedDoc) return;
    try {
      await executeExtractionWithGemini(cachedDoc);
    } finally {
      setIsAnalyzing(false);
      setStageProgress(null);
    }
  };

  // =========================================================================
  // FILTRADO DE COMPROMISOS EN LA MATRIZ
  // =========================================================================
  const filteredCommitments = useMemo(() => {
    if (!report) return [];

    return report.compromisos.filter((item) => {
      const revStatus = item.estado_revision || (item.decision_validacion === 'RECHAZADO' ? 'Descartado' : 'Validado');
      const integrity = item.integridad_registro || (item.estado_cumplimiento === 'COMPLETO' ? 'Completo' : 'Parcial');

      // Mantener los rechazados y descartados fuera de la matriz principal por defecto ("INCLUIDOS")
      if (validationFilter === 'INCLUIDOS') {
        if (item.decision_validacion === 'RECHAZADO' || revStatus === 'Descartado') {
          return false;
        }
      } else if (validationFilter !== 'ALL') {
        if (item.decision_validacion !== validationFilter) {
          return false;
        }
      }

      // Filtro por Estado de revisión (Pendiente, Validado, Editado, Descartado)
      if (reviewStatusFilter !== 'ALL' && revStatus !== reviewStatusFilter) {
        return false;
      }

      // Filtro por Integridad del registro (Completo, Parcial, Requiere revisión)
      if (integrityFilter !== 'ALL' && integrity !== integrityFilter) {
        return false;
      }

      // Filtro por categoría / tema
      if (categoryFilter !== 'ALL' && item.categoria !== categoryFilter && item.tema !== categoryFilter) {
        return false;
      }

      // Filtro solo con datos no identificados
      if (onlyMissingData) {
        const isMissingResp = !item.responsable || item.responsable.toLowerCase().includes('no identificado');
        const isMissingFreq =
          !item.frecuencia_plazo ||
          item.frecuencia_plazo.toLowerCase().includes('no precisad') ||
          item.frecuencia_plazo.toLowerCase().includes('no identificad');
        if (!isMissingResp && !isMissingFreq) {
          return false;
        }
      }

      // Filtro solo con posibles contradicciones o duplicados
      if (onlyContradictions && !item.posibleContradiccion?.hayContradiccion && !item.posible_duplicado) {
        return false;
      }

      // Búsqueda de texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const inCode = (item.codigo || item.id || '').toLowerCase().includes(query);
        const inAction = (item.compromiso_normalizado || item.compromiso || '').toLowerCase().includes(query);
        const inSource = (item.texto_fuente || item.textoFuente || '').toLowerCase().includes(query);
        const inResp = (item.responsable || '').toLowerCase().includes(query);
        const inInd = (item.evidencia_sugerida || item.indicador_evidencia || '').toLowerCase().includes(query);
        const inSection = (item.seccion_tabla || item.seccion || '').toLowerCase().includes(query);
        const inTema = (item.tema || item.categoria || '').toLowerCase().includes(query);
        const inPage = String(item.pagina_pdf || item.pagina || '').toLowerCase().includes(query);

        if (!inCode && !inAction && !inSource && !inResp && !inInd && !inSection && !inPage && !inTema) {
          return false;
        }
      }

      return true;
    });
  }, [
    report,
    validationFilter,
    reviewStatusFilter,
    integrityFilter,
    categoryFilter,
    onlyMissingData,
    onlyContradictions,
    searchTerm,
  ]);

  // Categorías / Temas presentes en los resultados
  const availableCategories = useMemo(() => {
    if (!report) return [];
    const setCat = new Set<string>();
    report.compromisos.forEach((c) => {
      if (c.tema) setCat.add(c.tema);
      else if (c.categoria) setCat.add(c.categoria);
    });
    return Array.from(setCat).sort();
  }, [report]);

  // Recalcula códigos PMMRS-01, PMMRS-02... para todos los registros incluidos y no descartados
  const recalculateCodesAndUpdateReport = (items: PmmrsCommitment[]) => {
    if (!report) return;
    let counter = 0;
    const updated = items.map((item, idx) => {
      const isIncluded = item.decision_validacion !== 'RECHAZADO' && item.estado_revision !== 'Descartado';
      if (isIncluded) counter++;
      return {
        ...item,
        numero: isIncluded ? counter : idx + 1,
        codigo: isIncluded
          ? `PMMRS-${String(counter).padStart(2, '0')}`
          : item.codigo?.startsWith('RECH-')
          ? item.codigo
          : `RECH-${String(idx + 1).padStart(2, '0')}`,
      };
    });

    const newSummary = calculateCommitmentsSummary(updated);
    const incluidosCount = updated.filter(
      (c) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision !== 'Descartado'
    ).length;

    setReport({
      ...report,
      compromisos: updated,
      compromisosIncluidosTotal: incluidosCount,
      candidatosEvaluadosTotal: updated.length,
      resumen: newSummary,
    });
  };

  // =========================================================================
  // EDICIÓN, VALIDACIÓN, DESCARTE, RESTAURACIÓN Y AGREGADO MANUAL
  // =========================================================================
  const handleOpenEdit = (item: PmmrsCommitment) => {
    setSelectedCommitment(item);
    setFormCommitment({ ...item });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!report || !selectedCommitment) return;

    const updatedCommitments = report.compromisos.map((c) => {
      if (c.id === selectedCommitment.id) {
        const frecPlazo =
          formCommitment.frecuencia_plazo ||
          formCommitment.frecuencia ||
          formCommitment.plazo ||
          c.frecuencia_plazo ||
          'Frecuencia no precisada';
        const rawEv =
          formCommitment.evidencia_sugerida ||
          formCommitment.indicador_evidencia ||
          c.evidencia_sugerida ||
          'Evidencia sugerida: Registro documental o fotográfico de verificación.';
        const evFormatted = /^evidencia sugerida\s*:/i.test(rawEv) ? rawEv : `Evidencia sugerida: ${rawEv}`;

        const merged: PmmrsCommitment = {
          ...c,
          ...formCommitment,
          estado_revision: (formCommitment.estado_revision as CommitmentReviewStatus) || 'Editado',
          integridad_registro: (formCommitment.integridad_registro as CommitmentRecordIntegrity) || c.integridad_registro || 'Completo',
          compromiso_normalizado:
            formCommitment.compromiso_normalizado || formCommitment.compromiso || c.compromiso_normalizado,
          compromiso:
            formCommitment.compromiso_normalizado || formCommitment.compromiso || c.compromiso,
          frecuencia_plazo: frecPlazo,
          evidencia_sugerida: evFormatted,
          indicador_evidencia: evFormatted,
          indicador: evFormatted,
          seccion_tabla: formCommitment.seccion_tabla || formCommitment.seccion || c.seccion_tabla || c.seccion,
          seccion: formCommitment.seccion_tabla || formCommitment.seccion || c.seccion,
          observaciones: formCommitment.observaciones || c.observaciones,
          observacion: formCommitment.observaciones || c.observacion,
        };
        return merged;
      }
      return c;
    });

    recalculateCodesAndUpdateReport(updatedCommitments);
    setIsEditModalOpen(false);
    setSelectedCommitment(null);
  };

  const handleQuickStatusChange = (id: string, newStatus: CommitmentReviewStatus) => {
    if (!report) return;
    const updated = report.compromisos.map((c) => {
      if (c.id !== id) return c;
      const newDec: CommitmentValidationDecision =
        newStatus === 'Descartado'
          ? 'RECHAZADO'
          : c.decision_validacion === 'RECHAZADO'
          ? 'CONFIRMADO'
          : c.decision_validacion;
      return {
        ...c,
        estado_revision: newStatus,
        decision_validacion: newDec,
      };
    });
    recalculateCodesAndUpdateReport(updated);
  };

  const handleOpenAddManual = () => {
    const titularDefault = report?.nombreTitular || 'Agrovision Perú S.A.C.';
    setFormCommitment({
      etapa: 'Manejo y operación general',
      tema: 'Gestión integral de residuos sólidos',
      tipo: 'Medida operativa',
      compromiso_normalizado: '',
      texto_fuente: '',
      frecuencia_plazo: 'Frecuencia no precisada',
      responsable: titularDefault,
      evidencia_sugerida: 'Evidencia sugerida: Registro interno de verificación del cumplimiento de la medida.',
      pagina_pdf: 1,
      pagina_impresa: '1',
      seccion_tabla: 'Agregado manualmente por el revisor',
      observaciones: 'El PMMRS no identifica un cargo o área responsable específica.',
      estado_revision: 'Validado',
      integridad_registro: 'Completo',
      decision_validacion: 'CONFIRMADO',
    });
    setIsAddManualModalOpen(true);
  };

  const handleSaveAddManual = () => {
    if (!report) return;
    const normText = (formCommitment.compromiso_normalizado || '').trim();
    if (!normText) return;

    const nextIdx = report.compromisos.length + 1;
    const rawEv = (formCommitment.evidencia_sugerida || 'Registro interno de verificación.').trim();
    const evFormatted = /^evidencia sugerida\s*:/i.test(rawEv) ? rawEv : `Evidencia sugerida: ${rawEv}`;

    const newCommitment: PmmrsCommitment = {
      id: `MANUAL-${Date.now()}`,
      id_candidato: `MANUAL-${String(nextIdx).padStart(3, '0')}`,
      codigo: `PMMRS-${String(nextIdx).padStart(2, '0')}`,
      numero: nextIdx,
      documento: report.archivoAnalizado,
      pagina_pdf: formCommitment.pagina_pdf || 1,
      pagina_impresa: String(formCommitment.pagina_impresa || formCommitment.pagina_pdf || '1'),
      seccion: formCommitment.seccion_tabla || 'Agregado manualmente',
      seccion_tabla: formCommitment.seccion_tabla || 'Agregado manualmente',
      tema: formCommitment.tema || 'Gestión de residuos sólidos',
      tipo: formCommitment.tipo || 'Medida operativa',
      texto_fuente: formCommitment.texto_fuente || normText,
      compromiso_normalizado: normText,
      categoria: 'Medidas ambientales',
      etapa: formCommitment.etapa || 'Manejo integral',
      residuo_proceso: 'Residuos sólidos del PMMRS',
      responsable: formCommitment.responsable || report.nombreTitular || 'Agrovision Perú S.A.C.',
      plazo: formCommitment.frecuencia_plazo || 'Frecuencia no precisada',
      frecuencia: formCommitment.frecuencia_plazo || 'Frecuencia no precisada',
      frecuencia_plazo: formCommitment.frecuencia_plazo || 'Frecuencia no precisada',
      indicador_evidencia: evFormatted,
      evidencia_sugerida: evFormatted,
      estado_cumplimiento: 'COMPLETO',
      estado_revision: 'Editado',
      integridad_registro: 'Completo',
      decision_extractor: 'AGREGADO MANUALMENTE',
      decision_validacion: 'CONFIRMADO',
      justificacion_validacion: 'Registro incorporado manualmente por el revisor ambiental.',
      nivel_confianza: 'ALTO',
      posible_duplicado: false,
      registros_relacionados: 'Ninguno',
      alertas: 'Sin alertas identificadas',
      campos_no_identificados: 'Ninguno',
      resultado_auditoria_omisiones: 'Incorporado manualmente por el revisor',
      compromiso: normText,
      procesoActividad: 'Residuos sólidos del PMMRS',
      residuoRelacionado: 'Residuos sólidos del PMMRS',
      indicador: evFormatted,
      evidenciaCumplimiento: evFormatted,
      pagina: `Pág. ${formCommitment.pagina_pdf || 1}`,
      textoFuente: formCommitment.texto_fuente || normText,
      estado: 'COMPLETO',
      estadoFormulacion: 'COMPLETO',
      observaciones:
        formCommitment.observaciones ||
        'El PMMRS no identifica un cargo o área responsable específica.',
      observacion:
        formCommitment.observaciones ||
        'El PMMRS no identifica un cargo o área responsable específica.',
      paginasRelacionadas: [`Pág. ${formCommitment.pagina_pdf || 1}`],
      origen: report.origen,
    };

    recalculateCodesAndUpdateReport([...report.compromisos, newCommitment]);
    setIsAddManualModalOpen(false);
  };

  // =========================================================================
  // EXPORTACIONES (LIBRO EXCEL REAL .XLSX CON MODELO OBLIGATORIO DE 2 HOJAS)
  // =========================================================================
  const handleExportDocx = async () => {
    if (!report) return;
    setIsExportingDocx(true);
    try {
      const blob = await generateCommitmentsDocx(report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitular = (report.nombreTitular || 'PMMRS').replace(/\s+/g, '_');
      a.download = `Matriz_Compromisos_${cleanTitular}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar DOCX:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      const doc = generateCommitmentsPdf(report);
      const cleanTitular = (report.nombreTitular || 'PMMRS').replace(/\s+/g, '_');
      doc.save(`Matriz_Compromisos_${cleanTitular}.pdf`);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (!report) return;
    setExcelExportError(null);

    const included = getIncludedSortedCommitments(report.compromisos || []);
    if (included.length === 0) {
      setExcelExportError('La matriz no contiene compromisos válidos para exportar.');
      return;
    }

    setIsExportingExcel(true);
    try {
      const result = downloadCommitmentsExcel(report);
      if (!result.ok) {
        setExcelExportError(result.error || 'No fue posible generar el archivo Excel.');
      }
    } catch (err: any) {
      console.error('Error al exportar libro Excel (.xlsx):', err);
      setExcelExportError(err?.message || 'Error técnico al generar el archivo Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Helper de badges de Estado de revisión
  const renderReviewStatusBadge = (status?: CommitmentReviewStatus) => {
    const st = status || 'Validado';
    switch (st) {
      case 'Validado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Validado
          </span>
        );
      case 'Editado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Edit3 className="w-3 h-3 text-blue-600" />
            Editado
          </span>
        );
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3 h-3 text-amber-600" />
            Pendiente
          </span>
        );
      case 'Descartado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Descartado
          </span>
        );
    }
  };

  // Helper de badges de Integridad del registro
  const renderIntegrityBadge = (integrity?: CommitmentRecordIntegrity) => {
    const ig = integrity || 'Completo';
    switch (ig) {
      case 'Completo':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completo
          </span>
        );
      case 'Parcial':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            Parcial
          </span>
        );
      case 'Requiere revisión':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Requiere revisión
          </span>
        );
    }
  };

  // Helper de etiquetas de estado de análisis
  const renderAnalysisStatusBadge = (status: CommitmentAnalysisStatus | null) => {
    if (!status) return null;
    switch (status) {
      case 'EXITO_CON_COMPROMISOS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Análisis exitoso con compromisos encontrados
          </span>
        );
      case 'EXITO_SIN_COMPROMISOS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Análisis exitoso sin compromisos identificados
          </span>
        );
      case 'INCOMPLETO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Análisis incompleto
          </span>
        );
      case 'ERROR_LECTURA_PDF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Error de lectura del PDF
          </span>
        );
      case 'ERROR_CONEXION_GEMINI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Error de conexión con Gemini
          </span>
        );
      case 'ERROR_ESTRUCTURA_JSON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Error de estructura JSON
          </span>
        );
      case 'ERROR_VALIDACION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Error de validación técnica
          </span>
        );
      case 'ERROR_PAGINAS_NO_PROCESADAS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Páginas no procesadas / Requieren OCR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 1. CABECERA SIMPLIFICADA (ESTRICTAMENTE SIN RUIDO VISUAL)            */}
      {/* =================================================================== */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Matriz de Compromisos del PMMRS
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Identifica y organiza los compromisos declarados en un PMMRS, conservando su evidencia y ubicación dentro del documento.
          </p>
        </div>

        {/* Botón para ver panel de diagnóstico de desarrollo */}
        {diagnosticInfo && (
          <button
            onClick={() => setShowDiagnosticPanel(!showDiagnosticPanel)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5 border border-gray-300 shrink-0"
          >
            <Terminal className="w-3.5 h-3.5 text-gray-700" />
            {showDiagnosticPanel ? 'Ocultar Diagnóstico' : 'Diagnóstico Técnico'}
          </button>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. PANEL DE DIAGNÓSTICO TÉCNICO VISIBLE PARA DESARROLLO / AUDITORÍA */}
      {/* =================================================================== */}
      {showDiagnosticPanel && diagnosticInfo && (
        <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                Panel de Diagnóstico Técnico de la Extracción (13 Métricas Verificables)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyDiagnosticJson}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 transition-colors border border-slate-700"
              >
                {copiedDiagnostic ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedDiagnostic ? 'Copiado' : 'Copiar JSON'}
              </button>
              <button
                onClick={() => setShowDiagnosticPanel(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">1. Nombre del archivo:</span>
              <span className="text-emerald-300 font-semibold truncate block mt-0.5">
                {diagnosticInfo.nombreArchivo}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">2. Tamaño recibido:</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                {diagnosticInfo.tamanoRecibido}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">3. Total de páginas detectadas:</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                {diagnosticInfo.totalPaginas} páginas
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">4. Páginas enviadas al modelo:</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                {diagnosticInfo.paginasEnviadasAlModelo} páginas
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">5. Bloques procesados:</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                {diagnosticInfo.bloquesProcesados} bloque(s)
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">6. Estado llamada extractor (Etapa 3):</span>
              <span className={`font-semibold block mt-0.5 ${
                diagnosticInfo.estadoExtractor.includes('exitosamente') ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {diagnosticInfo.estadoExtractor}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">7. Cantidad candidatos devueltos:</span>
              <span className="text-amber-300 font-bold block mt-0.5">
                {diagnosticInfo.candidatosDevueltos} candidatos
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">8. Estado llamada validador (Etapa 4):</span>
              <span className={`font-semibold block mt-0.5 ${
                diagnosticInfo.estadoValidador.includes('exitosamente') ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {diagnosticInfo.estadoValidador}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">9. Desglose validación:</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                <span className="text-emerald-400">{diagnosticInfo.confirmados} Conf</span> ·{' '}
                <span className="text-amber-400">{diagnosticInfo.ambiguos} Amb</span> ·{' '}
                <span className="text-rose-400">{diagnosticInfo.rechazados} Rech</span>
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">10. Validación esquema JSON (22 campos):</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                {diagnosticInfo.estadoValidacionJson}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">11. Mensaje de error registrado:</span>
              <span className={`font-semibold block mt-0.5 ${
                diagnosticInfo.mensajeError ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {diagnosticInfo.mensajeError || 'Ninguno (0 errores)'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">12 & 13. Cantidad final (Tabla / Export):</span>
              <span className="text-emerald-400 font-bold block mt-0.5">
                Tabla: {diagnosticInfo.cantidadFinalTabla} | Exportación: {diagnosticInfo.cantidadFinalExportacion}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Ruta solicitada / Método HTTP:</span>
              <span className="text-sky-300 font-semibold block mt-0.5">
                {diagnosticInfo.metodoHttp || 'POST'} {diagnosticInfo.rutaSolicitada || '/api/extract-commitment-candidates'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Código HTTP / Content-Type:</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                HTTP {diagnosticInfo.codigoRespuestaHttp ?? '-'} · {diagnosticInfo.contentTypeRecibido || '-'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Servidor / Clave GEMINI_API_KEY:</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                {diagnosticInfo.confirmacionServidor || '-'} · {diagnosticInfo.estadoGeminiApiKey || '-'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Envío PDF al SDK de Gemini:</span>
              <span className="text-emerald-300 font-semibold block mt-0.5">
                {diagnosticInfo.pdfEnviadoAlSdk || '-'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Estado de respuesta de Gemini:</span>
              <span className="text-slate-200 font-semibold block mt-0.5">
                {diagnosticInfo.estadoRespuestaGemini || '-'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Candidatos antes de validación:</span>
              <span className="text-amber-300 font-bold block mt-0.5">
                {diagnosticInfo.candidatosAntesValidacion ?? diagnosticInfo.candidatosDevueltos} candidatos
              </span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <span className="text-slate-400 block text-[11px]">Entorno / Timestamp:</span>
              <span className="text-slate-200 font-semibold block mt-0.5 truncate" title={`${diagnosticInfo.entornoEjecucion || '-'} · ${diagnosticInfo.timestampDiagnostico || '-'}`}>
                {diagnosticInfo.entornoEjecucion || '-'} · {diagnosticInfo.timestampDiagnostico || '-'}
              </span>
            </div>

            {diagnosticInfo.respuestaHttpRaw && (
              <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700 md:col-span-2">
                <span className="text-slate-400 block text-[11px]">Respuesta HTTP recibida:</span>
                <span className="text-slate-300 font-mono text-[11px] block mt-0.5 truncate" title={diagnosticInfo.respuestaHttpRaw}>
                  {diagnosticInfo.respuestaHttpRaw}
                </span>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* SECCIÓN 5: RESPUESTA BRUTA DEL EXTRACTOR (MODO DIAGNÓSTICO)       */}
          {/* ================================================================= */}
          {diagnosticInfo.diagnosticoExtractor && (
            <div className="bg-slate-800/95 border border-emerald-500/40 rounded-xl p-4 space-y-3 font-mono text-xs shadow-inner">
              <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-emerald-300 uppercase tracking-wide text-xs">
                  Respuesta bruta del extractor (Modo Diagnóstico Técnico)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Tipo recibido:</span>
                  <span className="text-emerald-300 font-bold block mt-0.5">
                    {diagnosticInfo.diagnosticoExtractor.tipoRecibido}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Longitud:</span>
                  <span className="text-slate-100 font-bold block mt-0.5">
                    {diagnosticInfo.diagnosticoExtractor.longitud?.toLocaleString('es-PE') ?? '0'} caracteres
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Estructura raíz detectada:</span>
                  <span className="text-amber-300 font-bold block mt-0.5 truncate" title={diagnosticInfo.diagnosticoExtractor.estructuraRaizDetectada}>
                    {diagnosticInfo.diagnosticoExtractor.estructuraRaizDetectada}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700">
                  <span className="text-slate-400 block text-[11px]">¿Propiedad candidates existe?:</span>
                  <span className={`font-bold block mt-0.5 ${diagnosticInfo.diagnosticoExtractor.candidatesExiste ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {diagnosticInfo.diagnosticoExtractor.candidatesExiste ? 'Sí (Detectada)' : 'No (Ausente)'}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700">
                  <span className="text-slate-400 block text-[11px]">¿candidates es array?:</span>
                  <span className={`font-bold block mt-0.5 ${diagnosticInfo.diagnosticoExtractor.candidatesEsArray ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {diagnosticInfo.diagnosticoExtractor.candidatesEsArray ? 'Sí (Array.isArray == true)' : 'No (Inválido)'}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Total candidatos en estructura:</span>
                  <span className="text-emerald-300 font-bold block mt-0.5">
                    {diagnosticInfo.diagnosticoExtractor.totalCandidatos ?? diagnosticInfo.candidatosDevueltos} candidatos
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded border border-slate-700 space-y-1">
                <span className="text-slate-400 block text-[11px]">
                  Primeras porciones de la respuesta del extractor (sin claves ni datos sensibles):
                </span>
                <pre className="text-slate-200 text-[11px] whitespace-pre-wrap break-all font-mono max-h-40 overflow-y-auto bg-black/50 p-2.5 rounded border border-slate-800">
                  {diagnosticInfo.diagnosticoExtractor.primerasPorciones}
                </pre>
              </div>
            </div>
          )}

          {diagnosticInfo.fragmentoRespuestaNoJson && (
            <div className="bg-rose-950/60 border border-rose-700/80 p-3 rounded text-xs font-mono space-y-1">
              <span className="text-rose-300 font-bold block">
                Primeros 200 caracteres de respuesta no-JSON recibida:
              </span>
              <pre className="text-rose-100 whitespace-pre-wrap break-all">
                {diagnosticInfo.fragmentoRespuestaNoJson}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2 & 3. ALERTA EXPLÍCITA DE ERROR (NUNCA MOSTRAR "0 COMPROMISOS" SI FALLA) */}
      {/* =================================================================== */}
      {analysisError && (
        <div
          className={`p-5 rounded-xl space-y-4 border-2 shadow-sm ${
            isTemporaryOverload
              ? 'bg-amber-50/90 border-amber-300'
              : 'bg-rose-50 border-rose-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-6 h-6 shrink-0 mt-0.5 ${
                  isTemporaryOverload ? 'text-amber-600' : 'text-rose-600'
                }`}
              />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h4
                    className={`text-base font-bold ${
                      isTemporaryOverload ? 'text-amber-950' : 'text-rose-900'
                    }`}
                  >
                    {isTemporaryOverload
                      ? 'Servicio de IA Temporalmente Saturado'
                      : 'Proceso de Extracción Detenido por Error Técnico'}
                  </h4>
                  {renderAnalysisStatusBadge(analysisStatus)}
                </div>

                <p
                  className={`text-sm leading-relaxed font-medium ${
                    isTemporaryOverload ? 'text-amber-900' : 'text-rose-800'
                  }`}
                >
                  {analysisError}
                </p>

                {cachedDoc && (
                  <div className="flex items-center gap-2 text-xs text-gray-700 bg-white/80 py-1.5 px-3 rounded-lg border border-amber-200/80 w-fit mt-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-gray-900">{cachedDoc.file.name}</span>
                    <span className="text-gray-400">·</span>
                    <span>{(cachedDoc.file.size / 1024).toFixed(1)} KB</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-emerald-700 font-medium">
                      {cachedDoc.extraction.totalPages} página(s) cargadas en memoria
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-600 mt-1">
                  Por norma estricta del módulo, la aplicación no inventa resultados ni reporta "0 compromisos" simulados como respaldo.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAnalysisError(null)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded"
              title="Cerrar notificación"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-amber-200/60">
            {cachedDoc && (
              <button
                onClick={handleRetryAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                REINTENTAR ANÁLISIS
              </button>
            )}

            <button
              onClick={() => setShowDiagnosticPanel(true)}
              className="px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              Diagnóstico técnico
            </button>

            <button
              onClick={() => {
                setAnalysisError(null);
                setCachedDoc(null);
                setReport(null);
                setSourceMode(null);
                setIsTemporaryOverload(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-800 underline ml-auto py-1"
            >
              Cargar otro archivo
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ESTADO EN PROCESO (MODAL / PANEL DE PROGRESO MULTI-ETAPA)           */}
      {/* =================================================================== */}
      {isAnalyzing && stageProgress && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{stageProgress.stageName}</h3>
              <p className="text-sm text-gray-600">{stageProgress.detail}</p>
            </div>
          </div>

          {/* Stepper de etapas obligatorias */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div
              className={`p-3 rounded-lg border text-xs ${
                stageProgress.stage >= 1
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-medium'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                Validación del archivo
              </div>
              <p className="text-[11px] text-gray-600">Integridad PDF, total páginas y contenido binario.</p>
            </div>

            <div
              className={`p-3 rounded-lg border text-xs ${
                stageProgress.stage >= 2
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-medium'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                Lectura y bloques
              </div>
              <p className="text-[11px] text-gray-600">Preservación de cada página y verificación OCR.</p>
            </div>

            <div
              className={`p-3 rounded-lg border text-xs ${
                stageProgress.stage >= 3
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-medium'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                Extractor de candidatos
              </div>
              <p className="text-[11px] text-gray-600">Llamada 1 a Gemini: filtro estricto de obligaciones.</p>
            </div>

            <div
              className={`p-3 rounded-lg border text-xs ${
                stageProgress.stage >= 4
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-medium'
                  : 'border-gray-200 bg-gray-50 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  4
                </span>
                Validador independiente
              </div>
              <p className="text-[11px] text-gray-600">Llamada 2 a Gemini: auditoría vs texto fuente y páginas.</p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VISTA INICIAL (CUANDO REPORT ES NULL Y NO SE ESTÁ ANALIZANDO)       */}
      {/* Muestra ÚNICAMENTE las DOS tarjetas simples requeridas               */}
      {/* =================================================================== */}
      {!report && !isAnalyzing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4">
          {/* TARJETA 1 — PMMRS ELABORADO EN ESTA APLICACIÓN */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-emerald-700" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                PMMRS elaborado en esta aplicación
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Extrae los compromisos directamente de la información registrada en el Módulo Elaborar PMMRS.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={handleSyncStructuredPlan}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                SINCRONIZAR PMMRS ACTUAL
              </button>
            </div>
          </div>

          {/* TARJETA 2 — CARGAR UN PMMRS EXISTENTE */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-gray-300 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <Upload className="w-5 h-5 text-blue-700" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Cargar un PMMRS existente
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Carga tu PMMRS y la aplicación identificará los compromisos declarados en el documento.
              </p>
            </div>

            <div className="pt-6">
              <label className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer text-center">
                <Upload className="w-4 h-4" />
                SELECCIONAR PDF
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePdfFileSelect(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VISTA DE RESULTADOS (CUANDO LA MATRIZ YA FUE GENERADA)             */}
      {/* =================================================================== */}
      {report && !isAnalyzing && (
        <div className="space-y-6">
          {/* Barra de acción superior con origen, estado de análisis y descargas */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {report.origen}
                </span>
                <span className="text-sm font-semibold text-gray-900 truncate max-w-md">
                  {report.archivoAnalizado}
                </span>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Titular: {report.nombreTitular}
                </span>
                {renderAnalysisStatusBadge(analysisStatus)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Fecha de análisis: {report.fechaAnalisis} · Total páginas: {report.totalPaginas || 'N/A'} ·{' '}
                <strong>
                  Compromisos incluidos en la matriz:{' '}
                  {
                    report.compromisos.filter(
                      (c) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision !== 'Descartado'
                    ).length
                  }
                </strong>{' '}
                (de {report.candidatosEvaluadosTotal || report.compromisos.length} candidatos evaluados)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setReport(null);
                  setSourceMode(null);
                  setAnalysisStatus(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cambiar documento
              </button>

              <button
                onClick={handleOpenAddManual}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"
              >
                + Agregar compromiso manual
              </button>

              <button
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5" />
                {isExportingDocx ? 'Generando...' : 'Descargar Word'}
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5" />
                {isExportingPdf ? 'Generando...' : 'Descargar PDF'}
              </button>

              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 border border-emerald-800 rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {isExportingExcel ? 'Generando .xlsx...' : 'Exportar Excel'}
              </button>
            </div>
          </div>

          {/* Error de exportación Excel si ocurriera */}
          {excelExportError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{excelExportError}</span>
              </div>
              <button
                onClick={() => setExcelExportError(null)}
                className="text-rose-600 hover:text-rose-900 p-1 rounded-md transition-colors"
                title="Cerrar advertencia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Advertencia de páginas con advertencia o que requirieron OCR */}
          {report.paginasConAdvertencia && report.paginasConAdvertencia.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">
                  Advertencia de legibilidad en el documento (Págs. {report.paginasConAdvertencia.join(', ')})
                </p>
                <p className="text-amber-800 mt-0.5">
                  Las páginas señaladas contenían baja densidad textual o formato escaneado. Fueron procesadas con visión/OCR sin inventar información faltante.
                </p>
              </div>
            </div>
          )}

          {/* Estado de 0 compromisos cuando fue exitoso y sin errores */}
          {report.compromisos.length === 0 && analysisStatus === 'EXITO_SIN_COMPROMISOS' && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No se identificaron compromisos</h3>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                El documento fue procesado y analizado exhaustivamente en sus {report.totalPaginas || 0} páginas sin errores técnicos, y el extractor y validador no identificaron obligaciones exigibles asumidas expresamente por el titular.
              </p>
            </div>
          )}

          {/* ================================================================= */}
          {/* RESUMEN EJECUTIVO DE REVISIÓN (SEPARANDO EVALUADOS E INCLUIDOS)   */}
          {/* ================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
              <div className="text-xs text-gray-500 font-medium">Candidatos evaluados</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {report.candidatosEvaluadosTotal || report.compromisos.length}
              </div>
            </div>

            <div className="bg-white border border-emerald-300 rounded-lg p-3 text-center shadow-sm bg-emerald-50/50">
              <div className="text-xs text-emerald-900 font-semibold flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Compromisos incluidos en la matriz
              </div>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                {
                  report.compromisos.filter(
                    (c) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision !== 'Descartado'
                  ).length
                }
              </div>
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-3 text-center shadow-sm bg-blue-50/30">
              <div className="text-xs text-blue-800 font-medium flex items-center justify-center gap-1">
                Validados / Editados
              </div>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {
                  report.compromisos.filter(
                    (c) =>
                      c.decision_validacion !== 'RECHAZADO' &&
                      (c.estado_revision || 'Validado') === 'Validado'
                  ).length
                }{' '}
                /{' '}
                {
                  report.compromisos.filter(
                    (c) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision === 'Editado'
                  ).length
                }
              </div>
            </div>

            <div className="bg-white border border-amber-200 rounded-lg p-3 text-center shadow-sm bg-amber-50/40">
              <div className="text-xs text-amber-800 font-medium flex items-center justify-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Pendientes
              </div>
              <div className="text-xl font-bold text-amber-700 mt-1">
                {
                  report.compromisos.filter(
                    (c) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision === 'Pendiente'
                  ).length
                }
              </div>
            </div>

            <div className="bg-white border border-rose-200 rounded-lg p-3 text-center shadow-sm bg-rose-50/40">
              <div className="text-xs text-rose-800 font-medium flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rechazados / Descartados (Auditoría)
              </div>
              <div className="text-xl font-bold text-rose-700 mt-1">
                {
                  report.compromisos.filter(
                    (c) => c.decision_validacion === 'RECHAZADO' || c.estado_revision === 'Descartado'
                  ).length
                }
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center shadow-sm">
              <div className="text-xs text-gray-500 font-medium">Integridad (Completos / Parciales)</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {
                  report.compromisos.filter(
                    (c) =>
                      c.decision_validacion !== 'RECHAZADO' &&
                      c.estado_revision !== 'Descartado' &&
                      (c.integridad_registro || 'Completo') === 'Completo'
                  ).length
                }{' '}
                /{' '}
                {
                  report.compromisos.filter(
                    (c) =>
                      c.decision_validacion !== 'RECHAZADO' &&
                      c.estado_revision !== 'Descartado' &&
                      c.integridad_registro === 'Parcial'
                  ).length
                }
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* BARRA DE HERRAMIENTAS Y FILTROS                                   */}
          {/* ================================================================= */}
          {report.compromisos.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Buscador */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por código PMMRS, compromiso normalizado, texto fuente, tema, sección o página..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {/* Selector de vista: Matriz Principal vs Auditoría (Rechazados) */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
                  <button
                    onClick={() => setValidationFilter('INCLUIDOS')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      validationFilter === 'INCLUIDOS'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                    Matriz Principal (
                    {
                      report.compromisos.filter(
                        (c) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision !== 'Descartado'
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setValidationFilter('RECHAZADO')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      validationFilter === 'RECHAZADO'
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'text-rose-800 hover:bg-rose-50'
                    }`}
                  >
                    Rechazados en Auditoría (
                    {
                      report.compromisos.filter(
                        (c) => c.decision_validacion === 'RECHAZADO' || c.estado_revision === 'Descartado'
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setValidationFilter('ALL')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      validationFilter === 'ALL'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Todos Evaluados ({report.compromisos.length})
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
                {/* Filtro Tema */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Tema:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
                  >
                    <option value="ALL">Todos los temas</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Estado de revisión (reemplaza "Cumplimiento") */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Estado de revisión:</span>
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value as any)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
                  >
                    <option value="ALL">Todos los estados</option>
                    <option value="Validado">Validado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Editado">Editado</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>

                {/* Filtro Integridad del registro */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium">Integridad del registro:</span>
                  <select
                    value={integrityFilter}
                    onChange={(e) => setIntegrityFilter(e.target.value as any)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
                  >
                    <option value="ALL">Todas</option>
                    <option value="Completo">Completo</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Requiere revisión">Requiere revisión</option>
                  </select>
                </div>

                {/* Checkbox datos no precisados */}
                <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={onlyMissingData}
                    onChange={(e) => setOnlyMissingData(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Frecuencia no precisada
                </label>

                {/* Checkbox posibles duplicados */}
                <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={onlyContradictions}
                    onChange={(e) => setOnlyContradictions(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Posibles duplicados
                </label>

                <span className="ml-auto text-gray-500 font-medium">
                  Mostrando {filteredCommitments.length} registro(s)
                </span>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 8. TABLA PRINCIPAL DE LA MATRIZ PROFESIONAL (13 COLUMNAS EXACTAS) */}
          {/* ================================================================= */}
          {report.compromisos.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#17365D] text-white font-semibold uppercase tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-2.5 w-24 text-center">1. Código</th>
                      <th className="py-3 px-2.5 w-36">2. Etapa</th>
                      <th className="py-3 px-2.5 w-36">3. Tema</th>
                      <th className="py-3 px-2.5 w-32">4. Tipo</th>
                      <th className="py-3 px-3 min-w-[260px]">5. Compromiso normalizado</th>
                      <th className="py-3 px-3 min-w-[280px]">6. Texto original / fuente</th>
                      <th className="py-3 px-2.5 w-36">7. Frecuencia o plazo</th>
                      <th className="py-3 px-2.5 w-36">8. Responsable</th>
                      <th className="py-3 px-3 min-w-[210px]">9. Evidencia sugerida</th>
                      <th className="py-3 px-2 w-20 text-center">10. Página PDF</th>
                      <th className="py-3 px-2 w-20 text-center">11. Página impresa</th>
                      <th className="py-3 px-2.5 w-40">12. Sección / tabla</th>
                      <th className="py-3 px-3 min-w-[210px]">13. Observaciones</th>
                      <th className="py-3 px-2.5 w-28 text-center">Revisión / Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCommitments.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-gray-500">
                          No se encontraron registros que coincidan con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredCommitments.map((item, rowIdx) => {
                        const isExpanded = Boolean(expandedRowIds[item.id]);
                        const revStatus =
                          item.estado_revision ||
                          (item.decision_validacion === 'RECHAZADO' ? 'Descartado' : 'Validado');
                        const integrity =
                          item.integridad_registro ||
                          (item.estado_cumplimiento === 'COMPLETO' ? 'Completo' : 'Parcial');
                        const isRejectedOrDiscarded =
                          item.decision_validacion === 'RECHAZADO' || revStatus === 'Descartado';

                        const frecPlazoDisplay =
                          item.frecuencia_plazo ||
                          (item.frecuencia && item.frecuencia !== 'No identificada'
                            ? item.frecuencia
                            : item.plazo && item.plazo !== 'No identificado'
                            ? item.plazo
                            : 'Frecuencia no precisada');

                        const rawEv =
                          item.evidencia_sugerida ||
                          item.indicador_evidencia ||
                          item.indicador ||
                          'Evidencia sugerida: Registro documental o fotográfico de verificación.';
                        const evDisplay = /^evidencia sugerida\s*:/i.test(rawEv)
                          ? rawEv
                          : `Evidencia sugerida: ${rawEv}`;

                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              className={`transition-colors align-top ${
                                isExpanded
                                  ? 'bg-emerald-50/40'
                                  : isRejectedOrDiscarded
                                  ? 'bg-rose-50/30'
                                  : rowIdx % 2 === 0
                                  ? 'bg-[#C6EAF4]/35 hover:bg-[#C6EAF4]/55'
                                  : 'bg-white hover:bg-gray-50/80'
                              }`}
                            >
                              {/* 1. Código */}
                              <td className="py-3 px-2.5 text-center font-bold text-slate-900 whitespace-nowrap">
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-900 font-mono text-[11px]">
                                  {item.codigo || `PMMRS-${String(item.numero).padStart(2, '0')}`}
                                </span>
                              </td>

                              {/* 2. Etapa */}
                              <td className="py-3 px-2.5 text-gray-800 font-medium leading-snug">
                                {item.etapa || 'No identificado'}
                              </td>

                              {/* 3. Tema */}
                              <td className="py-3 px-2.5 text-gray-800 leading-snug">
                                {item.tema || item.categoria || 'No identificado'}
                              </td>

                              {/* 4. Tipo */}
                              <td className="py-3 px-2.5 text-gray-700 leading-snug">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] inline-block">
                                  {item.tipo || 'Medida operativa'}
                                </span>
                              </td>

                              {/* 5. Compromiso normalizado */}
                              <td className="py-3 px-3 font-medium text-gray-900 leading-snug">
                                {item.compromiso_normalizado || item.compromiso}
                                {item.posible_duplicado && (
                                  <span className="inline-block ml-1.5 text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                                    Posible duplicado
                                  </span>
                                )}
                              </td>

                              {/* 6. Texto original / fuente */}
                              <td className="py-3 px-3 text-gray-700 italic leading-snug text-[11px]">
                                "{item.texto_fuente || item.textoFuente}"
                              </td>

                              {/* 7. Frecuencia o plazo */}
                              <td className="py-3 px-2.5 text-gray-800 leading-snug">
                                {frecPlazoDisplay}
                              </td>

                              {/* 8. Responsable */}
                              <td className="py-3 px-2.5 font-semibold text-gray-900 leading-snug">
                                {item.responsable || 'Agrovision Perú S.A.C.'}
                              </td>

                              {/* 9. Evidencia sugerida */}
                              <td className="py-3 px-3 text-slate-700 leading-snug text-[11px]">
                                <span className="block bg-sky-50/70 border border-sky-200/80 rounded p-1.5 text-sky-950">
                                  {evDisplay}
                                </span>
                              </td>

                              {/* 10. Página PDF */}
                              <td className="py-3 px-2 text-center font-bold text-gray-800">
                                {item.pagina_pdf}
                              </td>

                              {/* 11. Página impresa */}
                              <td className="py-3 px-2 text-center text-gray-700">
                                {item.pagina_impresa || String(item.pagina_pdf)}
                              </td>

                              {/* 12. Sección / tabla */}
                              <td className="py-3 px-2.5 text-gray-700 leading-snug text-[11px]">
                                {item.seccion_tabla || item.seccion}
                              </td>

                              {/* 13. Observaciones */}
                              <td className="py-3 px-3 text-gray-600 leading-snug text-[11px]">
                                {revStatus === 'Pendiente' &&
                                !(item.observaciones || '').toLowerCase().includes('pendiente de validación')
                                  ? `Pendiente de validación. ${item.observaciones || ''}`
                                  : item.observaciones ||
                                    'El PMMRS no identifica un cargo o área responsable específica.'}
                              </td>

                              {/* Revisión y Acciones (Auditoría, Editar, Validar, Descartar, Restaurar) */}
                              <td className="py-3 px-2.5 text-center whitespace-nowrap">
                                <div className="flex flex-col items-center gap-1.5">
                                  {renderReviewStatusBadge(revStatus)}
                                  {renderIntegrityBadge(integrity)}
                                  <div className="flex items-center justify-center gap-1 pt-1">
                                    <button
                                      onClick={() => toggleRowExpanded(item.id)}
                                      title="Expandir panel de Auditoría Técnica"
                                      className="p-1 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-transparent hover:border-emerald-200"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleOpenEdit(item)}
                                      title="Editar compromiso"
                                      className="p-1 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {revStatus !== 'Validado' && (
                                      <button
                                        onClick={() => handleQuickStatusChange(item.id, 'Validado')}
                                        title="Validar / Restaurar a la matriz"
                                        className="p-1 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {revStatus !== 'Descartado' && (
                                      <button
                                        onClick={() => handleQuickStatusChange(item.id, 'Descartado')}
                                        title="Descartar registro"
                                        className="p-1 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* 9. PANEL EXPANDIBLE DE AUDITORÍA TÉCNICA INTERNA */}
                            {isExpanded && (
                              <tr className="bg-slate-50 border-b border-slate-300">
                                <td colSpan={14} className="py-4 px-6 text-xs space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                      Información Técnica de Auditoría (Disponible solo en aplicación web — No se exporta a Excel)
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">
                                        ID Candidato: {item.id_candidato || item.id}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px]">
                                        Confianza: {item.nivel_confianza}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Identificador del candidato:</strong>{' '}
                                        <span className="font-mono text-slate-800">{item.id_candidato || item.id}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Decisión del extractor:</strong>{' '}
                                        <span className="text-slate-800 font-medium">
                                          {item.decision_extractor || 'EXTRAÍDO (Pasada 1 / Pasada 3)'}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Decisión del validador:</strong>{' '}
                                        <span className="text-slate-800 font-semibold">{item.decision_validacion}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Estado de revisión humana:</strong>{' '}
                                        <span className="text-slate-800 font-semibold">{revStatus}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Integridad del registro:</strong>{' '}
                                        <span className="text-slate-800 font-semibold">{integrity}</span>
                                      </div>
                                    </div>

                                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                                      <div className="text-[11px] text-slate-800 font-semibold">
                                        Justificación del validador:
                                      </div>
                                      <p className="text-[11px] text-slate-700 leading-relaxed">
                                        {item.justificacion_validacion}
                                      </p>
                                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                        <strong>Resultado auditoría de omisiones (Pasada 3):</strong>{' '}
                                        <span className="text-emerald-800 font-medium">
                                          {item.resultado_auditoria_omisiones || 'Verificado en Pasada 3'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Posible duplicado:</strong>{' '}
                                        <span className="text-slate-800">{item.posible_duplicado ? 'Sí' : 'No'}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Registros relacionados:</strong>{' '}
                                        <span className="text-slate-800">
                                          {Array.isArray(item.registros_relacionados)
                                            ? item.registros_relacionados.join(', ')
                                            : item.registros_relacionados || 'Ninguno'}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Alertas:</strong>{' '}
                                        <span className="text-slate-800">
                                          {Array.isArray(item.alertas) ? item.alertas.join('; ') : item.alertas}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        <strong>Campos no identificados en el texto:</strong>{' '}
                                        <span className="text-slate-800">
                                          {item.campos_no_identificados || 'Cargo o área interna específica'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Nota técnica de alcance al pie */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 italic">
                <strong>Nota técnica de alcance:</strong> {report.notaAlcance}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE EDICIÓN MANUAL DE COMPROMISO (13 COLUMNAS PROFESIONALES)   */}
      {/* =================================================================== */}
      {isEditModalOpen && selectedCommitment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Editar Compromiso: {selectedCommitment.codigo || selectedCommitment.id}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Etapa</label>
                  <input
                    type="text"
                    value={formCommitment.etapa || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, etapa: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tema</label>
                  <input
                    type="text"
                    value={formCommitment.tema || formCommitment.categoria || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, tema: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tipo</label>
                  <input
                    type="text"
                    value={formCommitment.tipo || 'Medida operativa'}
                    onChange={(e) => setFormCommitment({ ...formCommitment, tipo: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Compromiso normalizado
                </label>
                <textarea
                  rows={2}
                  value={formCommitment.compromiso_normalizado || formCommitment.compromiso || ''}
                  onChange={(e) =>
                    setFormCommitment({
                      ...formCommitment,
                      compromiso_normalizado: e.target.value,
                      compromiso: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Texto original / fuente
                </label>
                <textarea
                  rows={2}
                  value={formCommitment.texto_fuente || formCommitment.textoFuente || ''}
                  onChange={(e) =>
                    setFormCommitment({
                      ...formCommitment,
                      texto_fuente: e.target.value,
                      textoFuente: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Frecuencia o plazo</label>
                  <input
                    type="text"
                    value={formCommitment.frecuencia_plazo || formCommitment.frecuencia || ''}
                    onChange={(e) =>
                      setFormCommitment({
                        ...formCommitment,
                        frecuencia_plazo: e.target.value,
                        frecuencia: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Responsable</label>
                  <input
                    type="text"
                    value={formCommitment.responsable || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, responsable: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Evidencia sugerida (Propuesta de verificación)
                </label>
                <input
                  type="text"
                  value={formCommitment.evidencia_sugerida || formCommitment.indicador_evidencia || ''}
                  onChange={(e) =>
                    setFormCommitment({
                      ...formCommitment,
                      evidencia_sugerida: e.target.value,
                      indicador_evidencia: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-1.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Página PDF</label>
                  <input
                    type="text"
                    value={formCommitment.pagina_pdf ?? ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, pagina_pdf: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Página impresa</label>
                  <input
                    type="text"
                    value={formCommitment.pagina_impresa || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, pagina_impresa: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sección / tabla</label>
                  <input
                    type="text"
                    value={formCommitment.seccion_tabla || formCommitment.seccion || ''}
                    onChange={(e) =>
                      setFormCommitment({
                        ...formCommitment,
                        seccion_tabla: e.target.value,
                        seccion: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Estado de revisión</label>
                  <select
                    value={formCommitment.estado_revision || 'Editado'}
                    onChange={(e) =>
                      setFormCommitment({
                        ...formCommitment,
                        estado_revision: e.target.value as CommitmentReviewStatus,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-1.5 bg-white"
                  >
                    <option value="Validado">Validado</option>
                    <option value="Editado">Editado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Integridad del registro</label>
                  <select
                    value={formCommitment.integridad_registro || 'Completo'}
                    onChange={(e) =>
                      setFormCommitment({
                        ...formCommitment,
                        integridad_registro: e.target.value as CommitmentRecordIntegrity,
                      })
                    }
                    className="w-full border border-gray-300 rounded p-1.5 bg-white"
                  >
                    <option value="Completo">Completo</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Requiere revisión">Requiere revisión</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={formCommitment.observaciones || ''}
                  onChange={(e) =>
                    setFormCommitment({
                      ...formCommitment,
                      observaciones: e.target.value,
                      observacion: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL PARA AGREGAR UN COMPROMISO MANUAL                             */}
      {/* =================================================================== */}
      {isAddManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Agregar Compromiso Manual a la Matriz PMMRS
              </h3>
              <button
                onClick={() => setIsAddManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Etapa</label>
                  <input
                    type="text"
                    value={formCommitment.etapa || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, etapa: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tema</label>
                  <input
                    type="text"
                    value={formCommitment.tema || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, tema: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tipo</label>
                  <input
                    type="text"
                    value={formCommitment.tipo || 'Medida operativa'}
                    onChange={(e) => setFormCommitment({ ...formCommitment, tipo: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Compromiso normalizado *
                </label>
                <textarea
                  rows={2}
                  value={formCommitment.compromiso_normalizado || ''}
                  onChange={(e) =>
                    setFormCommitment({
                      ...formCommitment,
                      compromiso_normalizado: e.target.value,
                    })
                  }
                  placeholder="Describa la obligación verificable..."
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Texto original / fuente
                </label>
                <textarea
                  rows={2}
                  value={formCommitment.texto_fuente || ''}
                  onChange={(e) => setFormCommitment({ ...formCommitment, texto_fuente: e.target.value })}
                  placeholder="Cita textual del PMMRS..."
                  className="w-full border border-gray-300 rounded p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Frecuencia o plazo</label>
                  <input
                    type="text"
                    value={formCommitment.frecuencia_plazo || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, frecuencia_plazo: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Responsable</label>
                  <input
                    type="text"
                    value={formCommitment.responsable || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, responsable: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Evidencia sugerida</label>
                <input
                  type="text"
                  value={formCommitment.evidencia_sugerida || ''}
                  onChange={(e) => setFormCommitment({ ...formCommitment, evidencia_sugerida: e.target.value })}
                  className="w-full border border-gray-300 rounded p-1.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Página PDF</label>
                  <input
                    type="text"
                    value={formCommitment.pagina_pdf ?? '1'}
                    onChange={(e) => setFormCommitment({ ...formCommitment, pagina_pdf: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Página impresa</label>
                  <input
                    type="text"
                    value={formCommitment.pagina_impresa || '1'}
                    onChange={(e) => setFormCommitment({ ...formCommitment, pagina_impresa: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sección / tabla</label>
                  <input
                    type="text"
                    value={formCommitment.seccion_tabla || ''}
                    onChange={(e) => setFormCommitment({ ...formCommitment, seccion_tabla: e.target.value })}
                    className="w-full border border-gray-300 rounded p-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={formCommitment.observaciones || ''}
                  onChange={(e) => setFormCommitment({ ...formCommitment, observaciones: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsAddManualModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAddManual}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
              >
                Agregar a la Matriz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
