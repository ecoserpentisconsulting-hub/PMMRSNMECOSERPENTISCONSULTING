import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import { INITIAL_TEAM_MEMBERS } from './src/data/teamData.ts';
import {
  GEMINI_MODEL,
  reviewPmmrs,
  extractCommitments,
  extractCommitmentCandidates,
  validateCommitmentCandidates,
  draftPmmrsSection,
  isTransientGeminiError,
  isGeminiConfigured,
  GeminiNotConfiguredError,
} from './server/services/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const ACTIVE_COMMITMENTS_ROUTES = [
  'GET /api/health',
  'GET /api/health/commitments',
  'GET /api/health/gemini',
  'GET /api/team',
  'POST /api/team',
  'POST /api/team/reset',
  'GET /api/extract-commitment-candidates',
  'POST /api/extract-commitment-candidates',
  'GET /api/validate-commitment-candidates',
  'POST /api/validate-commitment-candidates',
  'POST /api/normalize-commitments',
  'POST /api/deduplicate-commitments',
  'POST /api/export-commitments-excel',
  'POST /api/extract-commitments',
  'POST /api/detect-commitment-contradictions',
  'POST /api/audit-plan',
  'POST /api/assist-section',
];

// Garantizar encabezado Content-Type: application/json y normalizar barra final en todas las rutas /api/*
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.url.length > 1 && req.url.endsWith('/')) {
    req.url = req.url.slice(0, -1);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.resolve(__dirname, 'public')));

const apiRouter = express.Router();

// Health check and environment info
apiRouter.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    ok: true,
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    hasGeminiKey: isGeminiConfigured(),
    geminiApiKeyStatus: isGeminiConfigured() ? 'configurada' : 'no configurada',
    model: GEMINI_MODEL,
    app: 'PMMRS Perú',
    activeRoutes: ACTIVE_COMMITMENTS_ROUTES,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/health/commitments (Endpoint oficial de salud de compromisos)
apiRouter.get('/health/commitments', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    ok: true,
    server: 'express',
    geminiConfigured: isGeminiConfigured(),
    extractRoute: true,
    validateRoute: true,
  });
});

// GET /api/health/gemini (Diagnóstico de entorno seguro y estricto conforme a Sección 4)
apiRouter.get('/health/gemini', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    server: 'ok',
    geminiConfigured: isGeminiConfigured(),
    extractorRoute: true,
  });
});

// =========================================================================
// 1. ENDPOINT: REVISIÓN TÉCNICA DE PMMRS
// =========================================================================
apiRouter.post('/audit-plan', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const {
      documentText,
      pageCount,
      companyName,
      fileName,
      sector,
      sectorLibre,
      criteriaList,
      pdfBase64,
      pageImages,
      isScanned,
    } = req.body || {};

    let cleanPdf = '';
    if (pdfBase64) {
      const pdfCheck = validateAndSanitizePdfInput(req.body);
      if (pdfCheck.valid) {
        cleanPdf = pdfCheck.cleanBase64;
      }
    }

    const hasText = Boolean(documentText && typeof documentText === 'string' && documentText.trim().length >= 50);
    const hasPdf = Boolean(cleanPdf && cleanPdf.length > 50);
    const hasImgs = Boolean(Array.isArray(pageImages) && pageImages.length > 0);

    if (!hasText && !hasPdf && !hasImgs) {
      return res.status(400).json({
        ok: false,
        error: 'El archivo proporcionado no contiene texto legible ni contenido binario o visual suficiente para auditar.',
        isScannedOrEmpty: true,
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
        },
      });
    }

    const result = await reviewPmmrs({
      documentText: documentText || '',
      pages: pageCount,
      companyName,
      fileName,
      sector,
      sectorLibre,
      criteriaList,
      pdfBase64: cleanPdf || undefined,
      pageImages,
      isScanned: Boolean(isScanned),
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error al evaluar plan con Gemini:', error?.message || error);
    return res.status(500).json({
      ok: false,
      error: 'No fue posible completar el análisis con IA. Se aplicará la evaluación técnica con el motor normativo.',
      detalle: error?.message || 'Error técnico desconocido',
      canRetry: true,
      canUseFallback: true,
    });
  }
});

// =========================================================================
// 2. ENDPOINTS: EXTRACCIÓN MULTI-ETAPA DE COMPROMISOS
// =========================================================================

/**
 * Valida que el PDF recibido en Base64 exista, tenga MIME application/pdf,
 * tamaño > 0, sea Base64 válido y elimina el prefijo data:application/pdf;base64,
 */
function validateAndSanitizePdfInput(body: any): {
  valid: boolean;
  cleanBase64: string;
  byteLength: number;
  errorCode?: string;
  errorMessage?: string;
  safeDetail?: string;
} {
  const { pdfBase64, mimeType, fileSize } = body || {};

  if (!pdfBase64 || typeof pdfBase64 !== 'string' || pdfBase64.trim().length === 0) {
    return {
      valid: false,
      cleanBase64: '',
      byteLength: 0,
      errorCode: 'PDF_NO_RECIBIDO',
      errorMessage: 'El servidor no recibió el contenido binario del archivo PDF.',
      safeDetail:
        'Se requiere el contenido real del PDF en Base64 (inlineData). No se admite enviar únicamente nombre de archivo, ruta local o metadatos.',
    };
  }

  // Verificar MIME type cuando es provisto
  if (mimeType && typeof mimeType === 'string' && mimeType.trim() !== '' && mimeType !== 'application/pdf') {
    return {
      valid: false,
      cleanBase64: '',
      byteLength: 0,
      errorCode: 'MIME_TYPE_INVALIDO',
      errorMessage: 'El archivo recibido no tiene el MIME type obligatorio application/pdf.',
      safeDetail: `MIME type recibido: ${mimeType}`,
    };
  }

  // Verificar prefijo data URL si existe (no debe ser otro tipo distinto de application/pdf)
  if (pdfBase64.startsWith('data:') && !/^data:application\/pdf;base64,/i.test(pdfBase64)) {
    return {
      valid: false,
      cleanBase64: '',
      byteLength: 0,
      errorCode: 'PREFIJO_DATA_URL_INVALIDO',
      errorMessage: 'El prefijo data URL no corresponde a data:application/pdf;base64.',
      safeDetail: 'El encabezado data URL debe ser application/pdf.',
    };
  }

  // Eliminar prefijo data:application/pdf;base64, y espacios en blanco
  const cleanBase64 = pdfBase64
    .replace(/^data:application\/pdf;base64,/i, '')
    .replace(/\s+/g, '');

  if (cleanBase64.length === 0 || cleanBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64)) {
    return {
      valid: false,
      cleanBase64: '',
      byteLength: 0,
      errorCode: 'BASE64_INVALIDO',
      errorMessage: 'El contenido del archivo PDF no tiene una codificación Base64 válida.',
      safeDetail: `Longitud de cadena Base64: ${cleanBase64.length}`,
    };
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = Buffer.from(cleanBase64, 'base64');
  } catch {
    return {
      valid: false,
      cleanBase64: '',
      byteLength: 0,
      errorCode: 'ERROR_DECODIFICACION_BASE64',
      errorMessage: 'No fue posible decodificar el contenido Base64 del archivo PDF.',
      safeDetail: 'Fallo en Buffer.from(cleanBase64, "base64").',
    };
  }

  if (!pdfBuffer || pdfBuffer.byteLength <= 0 || (fileSize !== undefined && Number(fileSize) <= 0)) {
    return {
      valid: false,
      cleanBase64: '',
      byteLength: 0,
      errorCode: 'ARCHIVO_PDF_VACIO',
      errorMessage: 'El archivo PDF recibido tiene tamaño cero.',
      safeDetail: `Bytes decodificados: ${pdfBuffer ? pdfBuffer.byteLength : 0}`,
    };
  }

  // Comprobar firma binaria %PDF- en los primeros bytes
  const headerAscii = pdfBuffer.subarray(0, 12).toString('ascii');
  if (!headerAscii.includes('%PDF-')) {
    return {
      valid: false,
      cleanBase64: '',
      byteLength: pdfBuffer.byteLength,
      errorCode: 'CABECERA_PDF_INVALIDA',
      errorMessage: 'El binario recibido no corresponde a un archivo PDF válido (cabecera %PDF- ausente).',
      safeDetail: `Bytes recibidos: ${pdfBuffer.byteLength}. El contenido binario no inicia con %PDF-.`,
    };
  }

  return {
    valid: true,
    cleanBase64,
    byteLength: pdfBuffer.byteLength,
  };
}

// ETAPA 3: Extractor de candidatos (Llamada 1)
apiRouter.get('/extract-commitment-candidates', (req, res) => {
  res.status(200).json({
    ok: true,
    status: 'ok',
    endpoint: '/api/extract-commitment-candidates',
    allowedMethods: ['POST'],
    mensaje: 'Ruta activa en el servidor. Utilice POST con el contenido en JSON para extraer candidatos.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.post('/extract-commitment-candidates', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const keyConfigured = isGeminiConfigured();
  const {
    fullText,
    pagesText,
    pageImages,
    isScanned,
    fileName,
    companyName,
    totalPages,
    bloques,
  } = req.body || {};

  const paginasCount = Number(totalPages) || (Array.isArray(pagesText) ? pagesText.length : 0);
  const bloquesCount = Number(bloques) || ( paginasCount > 0 ? Math.max(1, Math.ceil(paginasCount / 5)) : 1 );

  try {
    // 1. Verificar credencial en el servidor
    if (!keyConfigured) {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
          etapa: 'etapa_3_extractor',
          detalle_seguro: 'Credencial de IA no configurada en el servidor.',
        },
        meta: {
          modelo: GEMINI_MODEL,
          paginas: paginasCount,
          bloques: bloquesCount,
          servidorEjecutado: true,
          geminiApiKey: 'no configurada',
          pdfEnviadoAlSdk: false,
          estadoGemini: 'NO_CONFIGURADO',
        },
      });
    }

    // 2. Validar existencia, MIME type application/pdf, tamaño > 0 y Base64 limpio del PDF
    const pdfCheck = validateAndSanitizePdfInput(req.body);
    if (!pdfCheck.valid) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: pdfCheck.errorCode || 'ERROR_LECTURA_PDF',
          mensaje: pdfCheck.errorMessage || 'El archivo PDF enviado no es válido.',
          etapa: 'etapa_3_validacion_pdf_servidor',
          detalle_seguro: pdfCheck.safeDetail || 'Validación de binario PDF fallida.',
        },
        meta: {
          modelo: GEMINI_MODEL,
          paginas: paginasCount,
          bloques: bloquesCount,
          servidorEjecutado: true,
          geminiApiKey: 'configurada',
          pdfEnviadoAlSdk: false,
          estadoGemini: 'NO_EJECUTADO',
        },
      });
    }

    const rawText =
      fullText ||
      (pagesText && Array.isArray(pagesText) ? pagesText.map((p: any) => p.text).join(' ') : '');

    // 3. Ejecutar llamada al SDK oficial de Gemini enviando inlineData application/pdf
    const extractionResult = await extractCommitmentCandidates({
      fullText: rawText,
      pagesText,
      pdfBase64: pdfCheck.cleanBase64,
      pageImages,
      isScanned,
      fileName: fileName || 'PMMRS.pdf',
      companyName: companyName || 'Titular',
      totalPages: paginasCount || 1,
    });

    const candidates = Array.isArray(extractionResult)
      ? extractionResult
      : (extractionResult as any).candidates || (extractionResult as any).candidatos || [];
    const rawDiagnostics = (extractionResult as any).rawDiagnostics || null;

    return res.status(200).json({
      ok: true,
      candidates,
      data: {
        candidates,
        candidatos: candidates,
      },
      rawDiagnostics,
      meta: {
        modelo: GEMINI_MODEL,
        paginas: paginasCount || 1,
        bloques: bloquesCount,
        servidorEjecutado: true,
        geminiApiKey: 'configurada',
        pdfEnviadoAlSdk: true,
        bytesPdfRecibidos: pdfCheck.byteLength,
        estadoGemini: 'COMPLETADO_OK',
        candidatosAntesValidacion: candidates.length,
        diagnosticoExtractor: rawDiagnostics,
      },
      candidatos: candidates,
      total: candidates.length,
    });
  } catch (error: any) {
    console.error('Error al extraer candidatos con Gemini (Etapa 3):', error?.message || error);
    if (error instanceof GeminiNotConfiguredError || error?.code === 'AI_SERVICE_NOT_CONFIGURED') {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
          etapa: 'etapa_3_extractor',
          detalle_seguro: 'Credencial de IA no configurada en el servidor.',
        },
        meta: {
          modelo: GEMINI_MODEL,
          paginas: paginasCount,
          bloques: bloquesCount,
          servidorEjecutado: true,
          geminiApiKey: 'no configurada',
          pdfEnviadoAlSdk: false,
          estadoGemini: 'NO_CONFIGURADO',
        },
      });
    }
    const isTransient = Boolean(error?.isTransient || isTransientGeminiError(error));
    const statusCode = isTransient ? 503 : 500;
    const isJsonErr = Boolean(
      error?.isJsonStructureError ||
      error?.message?.includes('JSON') ||
      error?.message?.includes('interpretar') ||
      error?.message?.includes('candidates') ||
      error?.message?.includes('candidatos')
    );
    const errorCode = isTransient
      ? 'GEMINI_TEMPORALMENTE_NO_DISPONIBLE'
      : isJsonErr
      ? 'ERROR_ESTRUCTURA_JSON'
      : 'ERROR_EXTRACTOR_GEMINI';

    const errorMessage = isTransient
      ? 'Gemini está temporalmente ocupado o con alta demanda (503 UNAVAILABLE).'
      : isJsonErr
      ? 'No fue posible interpretar la respuesta del modelo.'
      : error?.message || 'Error en la etapa de extracción de candidatos.';

    const rawDiagnostics = error?.rawDiagnostics || null;

    return res.status(statusCode).json({
      ok: false,
      error: {
        codigo: errorCode,
        mensaje: errorMessage,
        etapa: 'etapa_3_extractor',
        detalle_seguro: `${error?.name || 'Error'}: ${(error?.message || 'Error desconocido').slice(0, 300)}`,
      },
      rawDiagnostics,
      meta: {
        modelo: GEMINI_MODEL,
        paginas: paginasCount,
        bloques: bloquesCount,
        servidorEjecutado: true,
        geminiApiKey: keyConfigured ? 'configurada' : 'no configurada',
        pdfEnviadoAlSdk: true,
        estadoGemini: isTransient ? 'ERROR_TRANSITORIO_503' : 'ERROR_EJECUCION',
        diagnosticoExtractor: rawDiagnostics,
      },
      isTemporary: isTransient,
      canRetry: true,
    });
  }
});

// ETAPA 4: Validador técnico independiente (Pasada 2: Validación y Consolidación + Pasada 3: Auditoría de Omisiones)
apiRouter.get('/validate-commitment-candidates', (req, res) => {
  res.status(200).json({
    ok: true,
    status: 'ok',
    endpoint: '/api/validate-commitment-candidates',
    allowedMethods: ['POST'],
    mensaje: 'Ruta activa en el servidor. Utilice POST con candidatos y contenido del documento para ejecutar la validación.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.post('/validate-commitment-candidates', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const keyConfigured = isGeminiConfigured();
  const { candidatos, fileName, totalPages, bloques, fullText, pagesText, pdfBase64, companyName } = req.body || {};

  const paginasCount = Number(totalPages) || (Array.isArray(pagesText) ? pagesText.length : 0);
  const bloquesCount = Number(bloques) || 1;

  try {
    if (!Array.isArray(candidatos) || candidatos.length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: 'CANDIDATOS_VACIOS_O_INVALIDOS',
          mensaje: 'No se enviaron candidatos válidos para ejecutar la Etapa 4 de validación.',
          etapa: 'etapa_4_validador',
          detalle_seguro: 'El validador requiere que la Etapa 3 haya finalizado con al menos 1 candidato.',
        },
        meta: {
          modelo: GEMINI_MODEL,
          paginas: paginasCount,
          bloques: bloquesCount,
          servidorEjecutado: true,
          geminiApiKey: keyConfigured ? 'configurada' : 'no configurada',
          estadoGemini: 'NO_EJECUTADO',
        },
      });
    }

    if (!keyConfigured) {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
          etapa: 'etapa_4_validador',
          detalle_seguro: 'Credencial de IA no configurada en el servidor.',
        },
        meta: {
          modelo: GEMINI_MODEL,
          paginas: paginasCount,
          bloques: bloquesCount,
          servidorEjecutado: true,
          geminiApiKey: 'no configurada',
          estadoGemini: 'NO_CONFIGURADO',
        },
      });
    }

    const result = await validateCommitmentCandidates(candidatos, fileName || 'PMMRS.pdf', {
      fullText,
      pagesText,
      pdfBase64,
      companyName,
    });

    const validaciones = result.validaciones;
    const rawDiagnostics = (result as any).rawDiagnostics || null;

    return res.status(200).json({
      ok: true,
      validaciones,
      data: {
        validaciones,
        candidatosFinales: result.candidatosFinales || candidatos,
        omisionesRecuperadas: result.omisionesRecuperadas || 0,
        resumenAuditoriaOmisiones: result.resumenAuditoriaOmisiones || '',
        contradicciones: result.contradicciones || [],
      },
      rawDiagnostics,
      meta: {
        modelo: GEMINI_MODEL,
        paginas: paginasCount,
        bloques: bloquesCount,
        servidorEjecutado: true,
        geminiApiKey: 'configurada',
        estadoGemini: 'COMPLETADO_OK',
        candidatosRecibidos: candidatos.length,
        validacionesDevueltas: validaciones.length,
        diagnosticoValidador: rawDiagnostics,
      },
      candidatosFinales: result.candidatosFinales || candidatos,
      omisionesRecuperadas: result.omisionesRecuperadas || 0,
      resumenAuditoriaOmisiones: result.resumenAuditoriaOmisiones || '',
      contradicciones: result.contradicciones || [],
      total: validaciones.length,
    });
  } catch (error: any) {
    console.error('Error al validar candidatos con Gemini (Etapa 4):', error?.message || error);
    if (error instanceof GeminiNotConfiguredError || error?.code === 'AI_SERVICE_NOT_CONFIGURED') {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
          etapa: 'etapa_4_validador',
          detalle_seguro: 'Credencial de IA no configurada en el servidor.',
        },
        meta: {
          modelo: GEMINI_MODEL,
          paginas: paginasCount,
          bloques: bloquesCount,
          servidorEjecutado: true,
          geminiApiKey: 'no configurada',
          estadoGemini: 'NO_CONFIGURADO',
        },
      });
    }
    const isTransient = Boolean(error?.isTransient || isTransientGeminiError(error));
    const statusCode = isTransient ? 503 : 500;
    const isJsonErr = Boolean(
      error?.isJsonStructureError ||
      error?.message?.includes('JSON') ||
      error?.message?.includes('validaciones') ||
      error?.message?.includes('arreglo')
    );
    const errorCode = isTransient
      ? 'GEMINI_TEMPORALMENTE_NO_DISPONIBLE'
      : isJsonErr
      ? 'ERROR_ESTRUCTURA_JSON_VALIDADOR'
      : 'ERROR_VALIDADOR_GEMINI';

    const errorMessage = isTransient
      ? 'Gemini está temporalmente ocupado o con alta demanda (503 UNAVAILABLE).'
      : isJsonErr
      ? 'El validador no devolvió un arreglo válido de validaciones.'
      : error?.message || 'Error en la etapa de validación independiente.';

    const rawDiagnostics = error?.rawDiagnostics || null;

    return res.status(statusCode).json({
      ok: false,
      error: {
        codigo: errorCode,
        mensaje: errorMessage,
        etapa: 'etapa_4_validador',
        detalle_seguro: `${error?.name || 'Error'}: ${(error?.message || 'Error desconocido').slice(0, 300)}`,
      },
      rawDiagnostics,
      meta: {
        modelo: GEMINI_MODEL,
        paginas: paginasCount,
        bloques: bloquesCount,
        servidorEjecutado: true,
        geminiApiKey: keyConfigured ? 'configurada' : 'no configurada',
        estadoGemini: isTransient ? 'ERROR_TRANSITORIO_503' : 'ERROR_EJECUCION',
        diagnosticoValidador: rawDiagnostics,
      },
      isTemporary: isTransient,
      canRetry: true,
    });
  }
});

// DETECCIÓN DE CONTRADICCIONES EN COMPROMISOS
apiRouter.post('/detect-commitment-contradictions', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const keyConfigured = isGeminiConfigured();
  const { candidatos, fileName, fullText, pagesText, pdfBase64, companyName } = req.body || {};

  try {
    if (!Array.isArray(candidatos) || candidatos.length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: 'CANDIDATOS_VACIOS_O_INVALIDOS',
          mensaje: 'No se proporcionaron compromisos candidatos para detectar contradicciones.',
          etapa: 'deteccion_contradicciones',
        },
      });
    }

    if (!keyConfigured) {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
          etapa: 'deteccion_contradicciones',
        },
      });
    }

    const result = await validateCommitmentCandidates(candidatos, fileName || 'PMMRS.pdf', {
      fullText,
      pagesText,
      pdfBase64,
      companyName,
    });

    return res.status(200).json({
      ok: true,
      contradicciones: result.contradicciones || [],
      total: (result.contradicciones || []).length,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: {
        codigo: 'ERROR_DETECCION_CONTRADICCIONES',
        mensaje: error?.message || 'Error al analizar contradicciones entre compromisos.',
        etapa: 'deteccion_contradicciones',
      },
    });
  }
});

// NORMALIZACIÓN DE COMPROMISOS (Servidor Backend)
apiRouter.post('/normalize-commitments', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const rawItems = req.body?.commitments || req.body?.candidatos || req.body?.candidates || [];
    if (!Array.isArray(rawItems)) {
      return res.status(400).json({ ok: false, error: 'Se requiere un arreglo de compromisos o candidatos en commitments.' });
    }
    const normalized = rawItems.map((item: any, idx: number) => ({
      ...item,
      codigo: item.codigo || `PMMRS-${String(idx + 1).padStart(2, '0')}`,
      etapa: item.etapa || 'Manejo integral',
      tema: item.tema || item.categoria || 'Gestión de residuos sólidos',
      tipo: item.tipo || 'Medida operativa',
      compromiso_normalizado: item.compromiso_normalizado || item.compromiso || item.commitment || '',
      texto_fuente: item.texto_fuente || item.textoFuente || item.sourceText || '',
      frecuencia_plazo: item.frecuencia_plazo || item.frecuencia || item.frequency || 'Frecuencia no precisada',
      responsable: item.responsable || item.responsible || 'Titular de la actividad',
      evidencia_sugerida:
        item.evidencia_sugerida ||
        item.indicador_evidencia ||
        item.indicator ||
        'Evidencia sugerida: Registro documental o fotográfico de verificación.',
      pagina_pdf: item.pagina_pdf || item.page || 1,
      estado_revision: item.estado_revision || 'Validado',
      integridad_registro: item.integridad_registro || 'Completo',
    }));
    return res.status(200).json({ ok: true, commitments: normalized, total: normalized.length });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Error en normalización.' });
  }
});

// DEDUPLICACIÓN DE COMPROMISOS (Servidor Backend)
apiRouter.post('/deduplicate-commitments', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const rawItems = req.body?.commitments || req.body?.candidatos || req.body?.candidates || [];
    if (!Array.isArray(rawItems)) {
      return res.status(400).json({ ok: false, error: 'Se requiere un arreglo de compromisos o candidatos en commitments.' });
    }
    const seen = new Set<string>();
    const deduplicated = rawItems.filter((item: any) => {
      const text = (item.compromiso_normalizado || item.compromiso || item.commitment || '').trim().toLowerCase();
      const page = item.pagina_pdf || item.page || 0;
      const key = `${text.slice(0, 80)}|${page}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return res.status(200).json({
      ok: true,
      commitments: deduplicated,
      totalOriginal: rawItems.length,
      totalDeduplicated: deduplicated.length,
      duplicadosEliminados: rawItems.length - deduplicated.length,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Error en deduplicación.' });
  }
});

// EXPORTACIÓN DE EXCEL REAL (.XLSX) CON SHEETJS
apiRouter.post('/export-commitments-excel', (req, res) => {
  try {
    const report = req.body;
    const allItems = Array.isArray(report?.compromisos) ? report.compromisos : [];
    const included = allItems.filter(
      (c: any) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision !== 'Descartado'
    );

    if (included.length === 0) {
      return res.status(400).setHeader('Content-Type', 'application/json; charset=utf-8').json({
        ok: false,
        error: 'La matriz no contiene compromisos válidos para exportar.',
      });
    }

    const rows = included.map((item: any, idx: number) => ({
      'Código': item.codigo || `PMMRS-${String(idx + 1).padStart(2, '0')}`,
      'Etapa': item.etapa || 'No identificado',
      'Tema': item.tema || item.categoria || 'No identificado',
      'Tipo': item.tipo || 'Medida operativa',
      'Compromiso normalizado': item.compromiso_normalizado || item.compromiso || 'No identificado',
      'Texto original / fuente': item.texto_fuente || item.textoFuente || 'No identificado',
      'Frecuencia o plazo': item.frecuencia_plazo || item.frecuencia || item.plazo || 'Frecuencia no precisada',
      'Responsable': item.responsable || report.nombreTitular || 'No identificado',
      'Evidencia sugerida':
        item.evidencia_sugerida ||
        item.indicador_evidencia ||
        item.indicador ||
        'Evidencia sugerida: Registro documental o fotográfico de verificación.',
      'Página PDF':
        item.pagina_pdf !== undefined && item.pagina_pdf !== null ? String(item.pagina_pdf) : 'No identificado',
      'Página impresa': item.pagina_impresa || 'No identificado',
      'Sección / tabla': item.seccion_tabla || item.seccion || 'No identificado',
      'Observaciones':
        item.observaciones || item.observacion || 'El PMMRS no identifica un cargo o área responsable específica.',
      'Estado de revisión': item.estado_revision || 'Validado',
      'Integridad': item.integridad_registro || 'Completo',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 30 },
      { wch: 22 },
      { wch: 55 },
      { wch: 55 },
      { wch: 26 },
      { wch: 28 },
      { wch: 45 },
      { wch: 12 },
      { wch: 14 },
      { wch: 28 },
      { wch: 45 },
      { wch: 20 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Compromisos');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Matriz_Compromisos_PMMRS.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('Error al generar Excel en backend:', error);
    return res.status(500).setHeader('Content-Type', 'application/json; charset=utf-8').json({
      ok: false,
      error: 'Error interno al generar el libro Excel .xlsx en el servidor.',
      detalle: error?.message || 'Error desconocido',
    });
  }
});

// PIPELINE COMPLETO (Compatibilidad con pruebas de integración)
apiRouter.post('/extract-commitments', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const keyConfigured = isGeminiConfigured();
  try {
    const { fullText, pagesText, pdfBase64, pageImages, isScanned, fileName, companyName, totalPages, bloques } = req.body || {};

    const rawText = fullText || (pagesText && Array.isArray(pagesText) ? pagesText.map((p: any) => p.text).join(' ') : '');
    const hasImages = Array.isArray(pageImages) && pageImages.length > 0;

    let cleanPdfBase64 = '';
    if (pdfBase64) {
      const pdfCheck = validateAndSanitizePdfInput(req.body);
      if (!pdfCheck.valid) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: pdfCheck.errorCode || 'ERROR_LECTURA_PDF',
            mensaje: pdfCheck.errorMessage || 'Error en el archivo PDF enviado.',
            etapa: 'validacion_pdf_servidor',
            detalle_seguro: pdfCheck.safeDetail || 'PDF inválido.',
          },
          tipoError: 'ERROR_LECTURA_PDF',
          isScannedOrEmpty: true,
        });
      }
      cleanPdfBase64 = pdfCheck.cleanBase64;
    }

    const hasPdfBinary = Boolean(cleanPdfBase64 && cleanPdfBase64.length > 50);

    if (!hasPdfBinary && (!rawText || rawText.trim().length < 50) && !hasImages) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: 'CONTENIDO_INSUFICIENTE',
          mensaje: 'Error de lectura del PDF: Contenido insuficiente para extraer compromisos.',
          etapa: 'validacion_entrada',
          detalle_seguro: 'No se recibió PDF binario ni texto suficiente.',
        },
        tipoError: 'ERROR_LECTURA_PDF',
        isScannedOrEmpty: true,
      });
    }

    if (!keyConfigured) {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
          etapa: 'configuracion_servidor',
          detalle_seguro: 'Credencial de IA no configurada en el servidor.',
        },
        tipoError: 'ERROR_CONEXION_GEMINI',
      });
    }

    const result = await extractCommitments({
      fullText: rawText,
      pagesText,
      pdfBase64: cleanPdfBase64 || undefined,
      pageImages,
      isScanned,
      fileName,
      companyName,
      totalPages,
    });

    return res.status(200).json({
      ok: true,
      data: {
        candidatos: result.candidatos || result.compromisos,
        compromisos: result.compromisos,
        contradicciones: result.contradicciones,
      },
      meta: {
        modelo: GEMINI_MODEL,
        paginas: Number(totalPages) || result.metadata?.totalPaginas || 1,
        bloques: Number(bloques) || 1,
        servidorEjecutado: true,
        geminiApiKey: 'configurada',
        pdfEnviadoAlSdk: hasPdfBinary,
      },
      ...result,
    });
  } catch (error: any) {
    console.error('Error al extraer compromisos con Gemini:', error?.message || error);
    if (error instanceof GeminiNotConfiguredError || error?.code === 'AI_SERVICE_NOT_CONFIGURED') {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
          etapa: 'configuracion_servidor',
          detalle_seguro: 'Credencial de IA no configurada en el servidor.',
        },
        tipoError: 'ERROR_CONEXION_GEMINI',
      });
    }
    const isTransient = Boolean(error?.isTransient || isTransientGeminiError(error));
    const statusCode = isTransient ? 503 : 500;
    return res.status(statusCode).json({
      ok: false,
      error: {
        codigo: isTransient ? 'GEMINI_TEMPORALMENTE_NO_DISPONIBLE' : 'ERROR_PROCESAMIENTO_GEMINI',
        mensaje: isTransient
          ? 'Gemini está temporalmente ocupado o con alta demanda (503 UNAVAILABLE).'
          : error?.message || 'Error al procesar la extracción de compromisos con el modelo.',
        etapa: 'extraccion_compromisos',
        detalle_seguro: `${error?.name || 'Error'}: ${(error?.message || 'Error técnico desconocido').slice(0, 300)}`,
      },
      tipoError: isTransient
        ? 'ERROR_CONEXION_GEMINI'
        : error?.message?.includes('JSON')
        ? 'ERROR_ESTRUCTURA_JSON'
        : 'ERROR_PROCESAMIENTO',
      isTemporary: isTransient,
      detalle: error?.message || 'Error técnico desconocido',
    });
  }
});

// =========================================================================
// 3. ENDPOINT: APOYO DE REDACCIÓN ESTRUCTURADA EN ELABORAR PMMRS
// =========================================================================
apiRouter.post('/assist-section', async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const { sectionId, sectionTitle, currentData, companyProfile, promptInstruction } = req.body || {};

    if (!currentData || typeof currentData !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'Datos de la sección no proporcionados o inválidos.',
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(503).json({
        ok: false,
        error: {
          code: 'AI_SERVICE_NOT_CONFIGURED',
          message: 'El servicio de análisis con IA no está disponible temporalmente.',
          codigo: 'AI_SERVICE_NOT_CONFIGURED',
          mensaje: 'El servicio de análisis con IA no está disponible temporalmente.',
        },
      });
    }

    const result = await draftPmmrsSection({
      sectionId: sectionId || 'general',
      sectionTitle: sectionTitle || sectionId,
      currentData,
      companyProfile,
      promptInstruction,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error en asistencia técnica de redacción:', error?.message || error);
    return res.status(500).json({
      ok: false,
      error: 'No fue posible completar la redacción asistida con IA. Intente nuevamente.',
      detalle: error?.message || 'Error técnico desconocido',
    });
  }
});

// =========================================================================
// 4. ENDPOINTS: PERSISTENCIA DEL EQUIPO PROFESIONAL EN EL SERVIDOR
// =========================================================================
const TEAM_DATA_DIR = path.resolve(__dirname, 'server', 'data');
const TEAM_DATA_FILE = path.resolve(TEAM_DATA_DIR, 'team_members.json');

function ensureTeamDataFile(): any[] {
  try {
    if (!fs.existsSync(TEAM_DATA_DIR)) {
      fs.mkdirSync(TEAM_DATA_DIR, { recursive: true });
    }
    const backupFile = path.resolve(TEAM_DATA_DIR, 'team_members.backup.json');
    if (fs.existsSync(TEAM_DATA_FILE)) {
      const raw = fs.readFileSync(TEAM_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 8) {
        return parsed;
      }
    }
    // Si no existe o tiene menos de 8 miembros, restaurar desde el respaldo oficial inmutable
    if (fs.existsSync(backupFile)) {
      const backupRaw = fs.readFileSync(backupFile, 'utf-8');
      const backupParsed = JSON.parse(backupRaw);
      if (Array.isArray(backupParsed) && backupParsed.length >= 8) {
        fs.writeFileSync(TEAM_DATA_FILE, backupRaw, 'utf-8');
        return backupParsed;
      }
    }
    fs.writeFileSync(TEAM_DATA_FILE, JSON.stringify(INITIAL_TEAM_MEMBERS, null, 2), 'utf-8');
    return INITIAL_TEAM_MEMBERS;
  } catch (err) {
    console.warn('Error al leer/inicializar archivo de equipo en servidor:', err);
    return INITIAL_TEAM_MEMBERS;
  }
}

// GET /api/team
apiRouter.get('/team', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const data = ensureTeamDataFile();
    let updatedAt = 0;
    const metaFile = path.resolve(TEAM_DATA_DIR, 'team_meta.json');
    if (fs.existsSync(metaFile)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        updatedAt = Number(meta?.updatedAt) || 0;
      } catch (e) {}
    }
    return res.status(200).json({
      ok: true,
      data,
      total: data.length,
      updatedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error al obtener equipo de profesionales en servidor:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al recuperar equipo de profesionales.',
      data: INITIAL_TEAM_MEMBERS,
      updatedAt: 0,
    });
  }
});

// POST /api/team (Guardar cambios y persistir en disco protegiendo a los 8 oficiales)
apiRouter.post('/team', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const rawMembers = Array.isArray(req.body) ? req.body : req.body?.members;
    const updatedAt = Number(req.body?.updatedAt) || Date.now();
    if (!Array.isArray(rawMembers) || rawMembers.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'El cuerpo de la solicitud debe incluir un arreglo de profesionales no vacío.',
      });
    }

    // Cargar respaldo oficial inmutable para blindar la presencia de los 8 profesionales
    const backupFile = path.resolve(TEAM_DATA_DIR, 'team_members.backup.json');
    let officialList: any[] = INITIAL_TEAM_MEMBERS;
    if (fs.existsSync(backupFile)) {
      try {
        const parsedBackup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
        if (Array.isArray(parsedBackup) && parsedBackup.length >= 8) {
          officialList = parsedBackup;
        }
      } catch (e) {}
    }

    // Proteger y blindar que los 8 profesionales oficiales de EcoSerpentis permanezcan siempre intactos
    const incomingMap = new Map((rawMembers as any[]).map((m: any) => [m.id, m]));
    officialList.forEach((officialMember: any) => {
      if (!incomingMap.has(officialMember.id)) {
        incomingMap.set(officialMember.id, officialMember);
      }
    });
    const protectedMembers = Array.from(incomingMap.values());

    if (!fs.existsSync(TEAM_DATA_DIR)) {
      fs.mkdirSync(TEAM_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TEAM_DATA_FILE, JSON.stringify(protectedMembers, null, 2), 'utf-8');

    // Mantener respaldo inmutable sincronizado
    try {
      fs.writeFileSync(backupFile, JSON.stringify(protectedMembers, null, 2), 'utf-8');
    } catch (e) {}

    // Sincronizar también en src/data/teamData.ts para que cualquier rebuild estático o despliegue lo preserve
    const teamDataTsPath = path.resolve(__dirname, 'src', 'data', 'teamData.ts');
    try {
      const tsContent = `import type { TeamMember } from '../types/team.ts';\n\nexport const INITIAL_TEAM_MEMBERS: TeamMember[] = ${JSON.stringify(protectedMembers, null, 2)};\n`;
      fs.writeFileSync(teamDataTsPath, tsContent, 'utf-8');
    } catch (e) {
      console.warn('Advertencia al sincronizar teamData.ts:', e);
    }

    const metaFile = path.resolve(TEAM_DATA_DIR, 'team_meta.json');
    fs.writeFileSync(metaFile, JSON.stringify({ updatedAt, total: protectedMembers.length }), 'utf-8');

    return res.status(200).json({
      ok: true,
      data: protectedMembers,
      total: protectedMembers.length,
      updatedAt,
      mensaje: 'Equipo de profesionales guardado y blindado exitosamente en el servidor.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error al guardar equipo de profesionales en servidor:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al persistir el equipo en el servidor.',
      detalle: error?.message || 'Error desconocido',
    });
  }
});

// POST /api/team/reset (Restaurar a valores predeterminados)
apiRouter.post('/team/reset', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    if (!fs.existsSync(TEAM_DATA_DIR)) {
      fs.mkdirSync(TEAM_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TEAM_DATA_FILE, JSON.stringify(INITIAL_TEAM_MEMBERS, null, 2), 'utf-8');

    return res.status(200).json({
      ok: true,
      data: INITIAL_TEAM_MEMBERS,
      total: INITIAL_TEAM_MEMBERS.length,
      mensaje: 'Equipo restaurado a los valores predeterminados de EcoSerpentis.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error al restablecer equipo en servidor:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al restablecer el equipo en el servidor.',
    });
  }
});

// Montar el router principal de API en /api
app.use('/api', apiRouter);

// =========================================================================
// PROTECCIÓN ESTRICTA DE RUTAS API (PROHIBIDO DEVOLVER HTML O INDEX.HTML)
// =========================================================================
app.use('/api', (req, res) => {
  const nowIso = new Date().toISOString();
  const envName = process.env.NODE_ENV || 'development';
  res.status(404).setHeader('Content-Type', 'application/json; charset=utf-8').json({
    ok: false,
    error: {
      codigo: 'RUTA_API_NO_ENCONTRADA',
      mensaje: 'No fue posible completar el análisis porque el servicio interno no está disponible en esta versión de la aplicación.',
      etapa: 'enrutamiento_api',
      ruta: req.originalUrl,
      metodo: req.method,
      entorno: envName,
      timestamp: nowIso,
      respuestaHttp: 404,
      rutasActivas: ACTIVE_COMMITMENTS_ROUTES,
      detalle_seguro: `Ruta: ${req.originalUrl} | Método: ${req.method} | Entorno: ${envName} | Timestamp: ${nowIso} | HTTP: 404`,
    },
  });
});

// Manejador global de errores para garantizar respuesta JSON en cualquier fallo de /api/*
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    const statusCode = err?.status || err?.statusCode || 500;
    return res.status(statusCode).setHeader('Content-Type', 'application/json; charset=utf-8').json({
      ok: false,
      error: {
        codigo: err?.type === 'entity.too.large' ? 'PAYLOAD_DEMASIADO_GRANDE' : 'ERROR_MIDDLEWARE_API',
        mensaje:
          err?.type === 'entity.too.large'
            ? 'El archivo PDF excede el límite de tamaño de solicitud permitido.'
            : err?.message || 'Error en el procesamiento de la solicitud API.',
        etapa: 'recepcion_http_servidor',
        detalle_seguro: `${err?.name || 'Error'}: ${(err?.message || 'Error interno').slice(0, 250)}`,
      },
    });
  }
  next(err);
});

// Vite Middleware for Development / Static serve for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).setHeader('Content-Type', 'application/json; charset=utf-8').json({
          ok: false,
          error: {
            codigo: 'RUTA_API_NO_ENCONTRADA',
            mensaje: `La ruta API solicitada (${req.method} ${req.originalUrl}) no existe.`,
            etapa: 'enrutamiento_produccion',
            detalle_seguro: `Bloqueado intento de devolver index.html para ${req.originalUrl}`,
          },
        });
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server PMMRS Perú listening on http://0.0.0.0:${PORT} (Gemini Model: ${GEMINI_MODEL})`);
    console.log(`Gemini configurado: ${isGeminiConfigured() ? 'Sí' : 'No'}`);
  });
}

startServer();
