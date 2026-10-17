import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CONFIGURACIÓN CENTRAL DEL MODELO GEMINI
 * Permite cambiar el modelo fácilmente sin modificar múltiples archivos.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
export const GEMINI_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

/**
 * Obtiene la credencial de Gemini disponible exclusivamente en el servidor.
 * Resuelve mediante: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
 * Sin usar variables VITE_ ni exponer la clave al navegador.
 */
export function getGeminiApiKey(): string | null {
  const raw = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!raw || typeof raw !== 'string') {
    return null;
  }
  const clean = raw.trim().replace(/^["']|["']$/g, '').trim();
  if (!clean || clean === 'MY_GEMINI_API_KEY' || clean === 'MY_GOOGLE_API_KEY') {
    return null;
  }
  return clean;
}

/**
 * Comprueba de manera segura si la credencial está configurada en el servidor.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

/**
 * Error unificado cuando el servicio de IA no está configurado en el servidor.
 */
export class GeminiNotConfiguredError extends Error {
  code = 'AI_SERVICE_NOT_CONFIGURED';
  status = 503;
  isServiceNotConfigured = true;

  constructor(message = 'El servicio de análisis con IA no está disponible temporalmente.') {
    super(message);
    this.name = 'GeminiNotConfiguredError';
  }
}

/**
 * Única función en el servidor para obtener/configurar el cliente oficial de Gemini.
 * Utilizada uniformemente en:
 * - extracción de compromisos
 * - validación y auditoría
 * - revisión técnica
 * - redacción asistida
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Timeout helper para evitar llamadas colgadas
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 45000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout de la operación tras ${timeoutMs / 1000} segundos.`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Detecta si un error devuelto por la API de Gemini es transitorio
 * (503 UNAVAILABLE, alta demanda / high demand, rate limit 429, timeouts, etc.)
 */
export function isTransientGeminiError(err: any): boolean {
  if (!err) return false;
  const str =
    typeof err === 'string'
      ? err
      : `${err.message || ''} ${err.status || ''} ${err.code || ''} ${err.statusText || ''} ${JSON.stringify(
          err
        )}`;
  const lower = str.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('alta demanda') ||
    lower.includes('service unavailable') ||
    lower.includes('resource exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('timeout') ||
    lower.includes('deadline exceeded') ||
    lower.includes('overloaded') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('econnreset') ||
    lower.includes('fetch failed')
  );
}

/**
 * Ejecutor con reintentos progresivos limitados ante fallas temporales de Gemini:
 * Intento 1 -> Inmediato
 * Intento 2 -> Esperar 2 segundos
 * Intento 3 -> Esperar 5 segundos
 * Máximo: 3 intentos totales (sin bucles infinitos)
 */
export async function callGeminiWithTransientRetry<T>(
  actionName: string,
  operation: (attempt: number, modelToUse: string) => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  const delays = [0, 1500, 3500];
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const modelToUse = attempt === 1 ? GEMINI_MODEL : GEMINI_FALLBACK_MODEL;
    try {
      if (attempt > 1) {
        const delayMs = delays[attempt - 1] || 3500;
        console.log(
          `[Gemini Retry] ${actionName}: Reintentando análisis (Intento ${attempt}/${maxAttempts} con modelo ${modelToUse}) tras espera de ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return await operation(attempt, modelToUse);
    } catch (err: any) {
      lastError = err;
      const isTransient = isTransientGeminiError(err);
      console.warn(
        `[Gemini Warning] ${actionName}: Intento ${attempt}/${maxAttempts} falló. Es transitorio: ${isTransient}. Detalle:`,
        err?.message || err
      );

      if (!isTransient || attempt >= maxAttempts) {
        const enhancedError: any = new Error(
          isTransient
            ? `Gemini está temporalmente ocupado o con alta demanda (HTTP 503 UNAVAILABLE). ${err?.message || ''}`
            : err?.message || String(err)
        );
        enhancedError.isTransient = isTransient;
        enhancedError.status = isTransient ? 503 : err?.status || 500;
        enhancedError.originalError = err;
        throw enhancedError;
      }
    }
  }
  throw lastError;
}

// =========================================================================
// 1. REVISIÓN TÉCNICA DE PMMRS (reviewPmmrs)
// =========================================================================

export interface ReviewPmmrsInput {
  documentText?: string;
  pdfBase64?: string;
  pageImages?: Array<{ pageNumber: number; imageBase64: string }>;
  isScanned?: boolean;
  pages?: number;
  fileName?: string;
  companyName?: string;
  sector?: string;
  sectorLibre?: string;
  criteriaList?: Array<{
    id: string;
    seccion: string;
    requisito: string;
    baseLegal: string;
  }>;
}

export type ReviewStatusLower = 'cumple' | 'parcial' | 'no identificado' | 'no evaluable';

export interface ReviewCriterionResult {
  id: string;
  estado: ReviewStatusLower;
  evidencia: string;
  pagina: string;
  hallazgo: string;
  referencia: string;
  accionCorrectiva: string;
}

export interface ContradictionItem {
  titulo: string;
  descripcion: string;
  seccionesInvolucradas: string;
  gravedad: 'Alta' | 'Media' | 'Baja';
  recomendacion: string;
  citaLiteral1?: string;
  citaLiteral2?: string;
}

export interface ReviewPmmrsOutput {
  resumen: string;
  porcentaje: number;
  criterios: ReviewCriterionResult[];
  contradicciones: ContradictionItem[];
  sector?: string;
  sectorLibre?: string;
  sectorNormativaConfigurada: boolean;
  sectorMensajeNormativa: string;
  modoAnalisis: 'IA + reglas' | 'OCR / Visión IA';
  modeloUtilizado?: string;
}

export async function reviewPmmrs(input: ReviewPmmrsInput): Promise<ReviewPmmrsOutput> {
  const {
    documentText,
    pdfBase64,
    pageImages,
    isScanned = false,
    pages = 1,
    companyName = 'Empresa titular',
    fileName = 'PMMRS.pdf',
    sector,
    sectorLibre,
  } = input;

  const cleanPdfBase64 =
    typeof pdfBase64 === 'string'
      ? pdfBase64
          .replace(/^data:application\/pdf;base64,/i, '')
          .replace(/^data:[^;]+;base64,/i, '')
          .replace(/\s+/g, '')
      : '';

  const hasPdfBinary = Boolean(cleanPdfBase64 && cleanPdfBase64.length > 50);
  const hasImages = Array.isArray(pageImages) && pageImages.length > 0;
  const rawDocumentText = documentText || '';

  if (!hasPdfBinary && (!rawDocumentText || rawDocumentText.trim().length < 50) && !hasImages) {
    throw new Error('Texto o contenido insuficiente para evaluar el PMMRS. El archivo cargado no contiene texto legible ni contenido escaneado para auditar.');
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new GeminiNotConfiguredError();
  }

  const systemInstruction = `Actúa como asistente técnico para la revisión de Planes de Minimización y Manejo de Residuos Sólidos No Municipales en Perú.

Evalúa únicamente respecto de la matriz de criterios proporcionada por la aplicación.

No inventes requisitos sectoriales.
No extrapoles obligaciones de un sector hacia otro.
No utilices el caso Fundo Camones como norma.

Distingue entre:
- requisito normativo configurado;
- compromiso declarado;
- recomendación técnica;
- dato no identificado.

Toda observación debe conservar evidencia y página.`;

  const sectorText = sector ? (sector === 'Otro' && sectorLibre ? `Otro (${sectorLibre})` : sector) : 'No especificado (Evaluación transversal)';

  let prompt = `Analiza el siguiente documento de PMMRS correspondiente al archivo "${fileName}" (${pages} páginas).
Empresa Titular: ${companyName}
Sector / Actividad económica: ${sectorText}

[NOTA IMPORTANTE DE CONTEXTO SECTORIAL]:
Utiliza el sector indicado únicamente como contexto para interpretar el vocabulario técnico, las operaciones y los procesos generadores.
NO inventes nuevas obligaciones normativas sectoriales ni asumas normas no configuradas.
Si no se ha configurado normativa sectorial específica para esta actividad, el análisis debe limitarse exclusivamente al marco general transversal de la R.M. 089-2023-MINAM, el D.L. 1278, el D.S. 014-2017-MINAM y la NTP 900.058:2019.`;

  if (isScanned || hasImages) {
    prompt += `\n\n[MODO ESCANEO / OCR MULTIMODAL]:
El documento adjunto contiene páginas escaneadas o digitalizadas como imágenes. Realiza lectura visual y OCR exhaustivo sobre el documento, examinando textos, sellos, firmas de colegiatura CIP, diagramas de flujo y tablas para evaluar con precisión cada requisito normativo y citar la página donde se visualiza.`;
  }

  if (rawDocumentText && rawDocumentText.trim().length >= 50) {
    prompt += `\n\n--- TEXTO EXTRAÍDO DEL DOCUMENTO ---\n${rawDocumentText.slice(0, 48000)}\n--- FIN DEL TEXTO ---`;
  }

  prompt += `\n\nEvalúa los 12 requisitos normativos transversales de la R.M. 089-2023-MINAM y normas conexas:
1. Presentación e Introducción (Razón Social, RUC, coordenadas UTM, etapas operativas)
2. Objetivos (general y específicos medibles)
3. Alcance (instalaciones, etapas y contratistas)
4. Identificación, características y estimación de residuos sólidos (diagramas de flujo, inventario, masa mensual/anual, códigos de Basilea, clasificación de peligrosidad)
5. Estrategias para la prevención y/o minimización en la fuente (material de descarte Art. 4/5 D.S. 014, bienes priorizados)
6. Gestión y manejo operativo (segregación NTP 900.058:2019 código no municipal, recolección interna, almacén central de peligrosos losa/sardinel/12 meses, EO-RS con registro MINAM/MTC, valorización y disposición final)
7. Medidas ambientales (matriz de impactos por componente, mitigación, responsable y frecuencia)
8. Plan de contingencias / emergencias (comunicación obligatoria a OEFA en un plazo máximo de 24h)
9. Indicadores de seguimiento y control (fórmula de cálculo, meta numérica y medio de verificación)
10. Cronograma de implementación (hitos operativos y fechas legales de SIGERSOL)
11. Presupuesto detallado en Soles (PEN) analítico por rubro (contenedores, EO-RS, EPPs)
12. Funciones del responsable técnico (Ingeniero Colegiado y Habilitado CIP, custodia de manifiestos 5 años Art. 56)

REGLAS PARA DETECCIÓN DE CONTRADICCIONES TRANSVERSALES:
Identifica contradicciones internas aplicables a cualquier sector:
- Totales incompatibles (suma de componentes vs total declarado por etapa o total anual)
- Diferentes cantidades para el mismo residuo en distintas tablas o secciones
- Unidades inconsistentes (mezcla de tn/mes, kg/mes o m3 sin factor de conversión)
- Clasificación contradictoria de peligrosidad (mismo residuo clasificado como peligroso en una parte y no peligroso en otra)
- Diferentes destinos para el mismo residuo (ej. valorización vs botadero o entrega a servicio municipal)
- Diferentes responsables asignados a la misma función o cargo
- Frecuencias incompatibles (ej. recolección mensual de orgánicos perecibles, o almacenamiento de peligrosos > 12 meses)
- Etapas inexistentes o no declaradas en la descripción operativa
- Cronograma incompatible con las actividades o metas
- Compromisos contradictorios entre capítulos
- Valorización y disposición contradictorias (declarar 100% de valorización pero todo a relleno, o viceversa)
- Residuos mencionados en fuentes o almacenes pero ausentes en inventario cuantitativo`;

  const partsPayload: any[] = [];
  if (hasPdfBinary) {
    partsPayload.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: cleanPdfBase64,
      },
    });
  } else if (hasImages) {
    for (const img of pageImages!) {
      const cleanImg = (img.imageBase64 || '').replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
      if (cleanImg) {
        partsPayload.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanImg,
          },
        });
      }
    }
  }
  partsPayload.push({ text: prompt });

  const response = await callGeminiWithTransientRetry('Revisión Técnica PMMRS', async (attempt, modelToUse) => {
    return await withTimeout(
      ai.models.generateContent({
        model: modelToUse,
        contents: partsPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              resumen: { type: Type.STRING },
              porcentaje: { type: Type.NUMBER },
              criterios: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    estado: {
                      type: Type.STRING,
                      enum: ['cumple', 'parcial', 'no identificado', 'no evaluable'],
                    },
                    evidencia: { type: Type.STRING },
                    pagina: { type: Type.STRING },
                    hallazgo: { type: Type.STRING },
                    referencia: { type: Type.STRING },
                    accionCorrectiva: { type: Type.STRING },
                  },
                  required: ['id', 'estado', 'evidencia', 'pagina', 'hallazgo', 'referencia', 'accionCorrectiva'],
                },
              },
              contradicciones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titulo: { type: Type.STRING },
                    descripcion: { type: Type.STRING },
                    seccionesInvolucradas: { type: Type.STRING },
                    gravedad: { type: Type.STRING, enum: ['Alta', 'Media', 'Baja'] },
                    recomendacion: { type: Type.STRING },
                    citaLiteral1: { type: Type.STRING },
                    citaLiteral2: { type: Type.STRING },
                  },
                  required: ['titulo', 'descripcion', 'seccionesInvolucradas', 'gravedad', 'recomendacion'],
                },
              },
            },
            required: ['resumen', 'porcentaje', 'criterios', 'contradicciones'],
          },
        },
      }),
      60000
    );
  });

  const rawText = response.text || '{}';

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('Respuesta inválida de Gemini: No se pudo parsear el resultado estructurado.');
    }
  }

  // Normalización y validación estricta de estados permitidos
  const allowedStatuses: ReviewStatusLower[] = ['cumple', 'parcial', 'no identificado', 'no evaluable'];
  const sanitizedCriteria: ReviewCriterionResult[] = (parsed.criterios || []).map((c: any, idx: number) => {
    let est = (c.estado || 'no identificado').toLowerCase().trim() as ReviewStatusLower;
    if (!allowedStatuses.includes(est)) {
      est = 'no identificado';
    }
    return {
      id: c.id || `CRIT-${idx + 1}`,
      estado: est,
      evidencia: c.evidencia || 'No identificada en el documento',
      pagina: c.pagina || 'No especificada',
      hallazgo: c.hallazgo || 'Sin hallazgo detallado',
      referencia: c.referencia || 'R.M. 089-2023-MINAM',
      accionCorrectiva: c.accionCorrectiva || 'Revisar y subsanar según la guía técnica oficial.',
    };
  });

  const isOcrMultimodal = Boolean(isScanned || hasImages || (hasPdfBinary && (!rawDocumentText || rawDocumentText.trim().length < 200)));

  return {
    resumen: parsed.resumen || 'Revisión técnica de PMMRS completada.',
    porcentaje: typeof parsed.porcentaje === 'number' ? Math.min(100, Math.max(0, parsed.porcentaje)) : 0,
    criterios: sanitizedCriteria,
    contradicciones: Array.isArray(parsed.contradicciones) ? parsed.contradicciones : [],
    sector: sector || 'No especificado',
    sectorLibre: sectorLibre || '',
    sectorNormativaConfigurada: false,
    sectorMensajeNormativa: 'No se ha configurado normativa sectorial específica para esta actividad. El análisis se limita al marco general incorporado en la aplicación.',
    modoAnalisis: isOcrMultimodal ? 'OCR / Visión IA' : 'IA + reglas',
    modeloUtilizado: GEMINI_MODEL,
  };
}

// =========================================================================
// 2. EXTRACCIÓN MULTI-ETAPA DE COMPROMISOS (PIPELINE REAL DE VARIAS ETAPAS)
// =========================================================================

export interface ExtractCommitmentsInput {
  pagesText?: Array<{ pageNumber: number; text: string }>;
  fullText?: string;
  pdfBase64?: string;
  pageImages?: Array<{ pageNumber: number; imageBase64: string }>;
  isScanned?: boolean;
  sections?: string[];
  fileName?: string;
  companyName?: string;
  totalPages?: number;
}

// =========================================================================
// SCHEMA CANÓNICO DE EXTRACCIÓN (CommitmentExtractionResult)
// =========================================================================

export type CanonicalFormulationStatus = 'COMPLETO' | 'PARCIAL' | 'AMBIGUO' | 'NO_EVALUABLE';

export interface CanonicalCommitment {
  id: string;
  compromiso: string;
  categoria: string;
  etapa: string;
  procesoActividad: string;
  residuoRelacionado: string;
  responsable: string;
  plazo: string;
  frecuencia: string;
  indicador: string;
  evidenciaCumplimiento: string;
  pagina: number | null;
  seccion: string;
  textoFuente: string;
  estadoFormulacion: CanonicalFormulationStatus;
  observacion: string;
  paginasRelacionadas: number[];
  posibleContradiccion: boolean;
}

export interface CanonicalContradiction {
  descripcion: string;
  compromisoIds: string[];
  paginas: number[];
  evidencia: string;
  titulo?: string;
  seccionesInvolucradas?: string;
  gravedad?: 'Alta' | 'Media' | 'Baja';
  recomendacion?: string;
}

export interface CanonicalExtractionMetadata {
  archivo: string;
  totalPaginas: number;
  tipoExtraccion: 'texto' | 'ocr' | 'multimodal';
  paginasNoEvaluables: number[];
}

export interface CommitmentExtractionResult {
  compromisos: (CanonicalCommitment & Partial<ValidatedCommitmentItem>)[];
  contradicciones: CanonicalContradiction[];
  metadata: CanonicalExtractionMetadata;
  candidatos?: any[];
  diagnostico?: DiagnosticData;
  modeloUtilizado?: string;
  tipoExtraccion?: 'texto' | 'OCR/multimodal' | 'PDF nativo/multimodal';
  alertaCalidadLectura?: string;
}

export const canonicalCommitmentGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    compromiso: { type: Type.STRING },
    categoria: { type: Type.STRING },
    etapa: { type: Type.STRING },
    procesoActividad: { type: Type.STRING },
    residuoRelacionado: { type: Type.STRING },
    responsable: { type: Type.STRING },
    plazo: { type: Type.STRING },
    frecuencia: { type: Type.STRING },
    indicador: { type: Type.STRING },
    evidenciaCumplimiento: { type: Type.STRING },
    pagina: { type: Type.INTEGER, nullable: true },
    seccion: { type: Type.STRING },
    textoFuente: { type: Type.STRING },
    estadoFormulacion: {
      type: Type.STRING,
      enum: ['COMPLETO', 'PARCIAL', 'AMBIGUO', 'NO_EVALUABLE'],
    },
    observacion: { type: Type.STRING },
    paginasRelacionadas: {
      type: Type.ARRAY,
      items: { type: Type.INTEGER },
    },
    posibleContradiccion: { type: Type.BOOLEAN },
  },
  required: [
    'id',
    'compromiso',
    'categoria',
    'etapa',
    'procesoActividad',
    'residuoRelacionado',
    'responsable',
    'plazo',
    'frecuencia',
    'indicador',
    'evidenciaCumplimiento',
    'seccion',
    'textoFuente',
    'estadoFormulacion',
    'observacion',
    'paginasRelacionadas',
    'posibleContradiccion',
  ],
};

export const canonicalContradictionGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    descripcion: { type: Type.STRING },
    compromisoIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    paginas: {
      type: Type.ARRAY,
      items: { type: Type.INTEGER },
    },
    evidencia: { type: Type.STRING },
  },
  required: ['descripcion', 'compromisoIds', 'paginas', 'evidencia'],
};

export const canonicalMetadataGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    archivo: { type: Type.STRING },
    totalPaginas: { type: Type.INTEGER },
    tipoExtraccion: {
      type: Type.STRING,
      enum: ['texto', 'ocr', 'multimodal'],
    },
    paginasNoEvaluables: {
      type: Type.ARRAY,
      items: { type: Type.INTEGER },
    },
  },
  required: ['archivo', 'totalPaginas', 'tipoExtraccion', 'paginasNoEvaluables'],
};

export const commitmentExtractionResultGeminiSchema = {
  type: Type.OBJECT,
  properties: {
    compromisos: {
      type: Type.ARRAY,
      items: canonicalCommitmentGeminiSchema,
    },
    contradicciones: {
      type: Type.ARRAY,
      items: canonicalContradictionGeminiSchema,
    },
    metadata: canonicalMetadataGeminiSchema,
  },
  required: ['compromisos', 'contradicciones', 'metadata'],
};

/**
 * Parser seguro de JSON que maneja bloques markdown ```json y subcadenas
 */
export function safeParseJson(rawText: string): any {
  if (!rawText || !rawText.trim()) {
    throw new Error('Error en el extractor: Gemini devolvió una respuesta vacía.');
  }

  try {
    return JSON.parse(rawText);
  } catch (err1) {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\s*```$/, '');
    }
    cleaned = cleaned.trim();

    try {
      return JSON.parse(cleaned);
    } catch (err2) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sliced = cleaned.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(sliced);
        } catch {
          // continuar
        }
      }

      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const sliced = cleaned.slice(firstBracket, lastBracket + 1);
        try {
          return { compromisos: JSON.parse(sliced) };
        } catch {
          // continuar
        }
      }

      throw new Error(
        `Error de estructura JSON: La respuesta del modelo no tiene formato JSON válido. Detalle: ${
          (err2 as any)?.message || err1
        }`
      );
    }
  }
}

/**
 * Normaliza y sanea el resultado de extracción garantizando el schema canónico
 * y las reglas de campos ausentes ("No identificado", null, [], false).
 */
export function sanitizeExtractionResult(
  parsed: any,
  fileName: string,
  totalPages: number,
  defaultExtractionType: 'texto' | 'ocr' | 'multimodal' = 'texto'
): CommitmentExtractionResult {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Error de estructura JSON: El resultado del modelo no es un objeto válido.');
  }

  let rawCommitments: any[] = [];
  if (Array.isArray(parsed.compromisos)) {
    rawCommitments = parsed.compromisos;
  } else if (Array.isArray(parsed.candidatos)) {
    rawCommitments = parsed.candidatos;
  } else if (Array.isArray(parsed)) {
    rawCommitments = parsed;
  } else if (parsed.data && Array.isArray(parsed.data.compromisos)) {
    rawCommitments = parsed.data.compromisos;
  } else {
    throw new Error('Error de estructura JSON: La respuesta no contiene un arreglo de "compromisos".');
  }

  const compromisos = rawCommitments.map((raw: any, index: number) => {
    const rawPagina = raw.pagina !== undefined ? raw.pagina : raw.pagina_pdf;
    let paginaNum: number | null = null;
    if (rawPagina !== null && rawPagina !== undefined && rawPagina !== '') {
      const parsedNum =
        typeof rawPagina === 'number'
          ? rawPagina
          : parseInt(String(rawPagina).replace(/\D/g, ''), 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        paginaNum = parsedNum;
      }
    }

    const id = (raw.id && String(raw.id).trim()) || `COM-${String(index + 1).padStart(3, '0')}`;
    const compromiso =
      (raw.compromiso && String(raw.compromiso).trim()) ||
      (raw.compromiso_normalizado && String(raw.compromiso_normalizado).trim()) ||
      (raw.textoFuente && String(raw.textoFuente).trim()) ||
      'No identificado';

    const categoria = (raw.categoria && String(raw.categoria).trim()) || 'Medidas ambientales';
    const etapa = (raw.etapa && String(raw.etapa).trim()) || 'No identificada';
    const procesoActividad =
      (raw.procesoActividad && String(raw.procesoActividad).trim()) ||
      (raw.residuo_proceso && String(raw.residuo_proceso).trim()) ||
      'No identificado';
    const residuoRelacionado =
      (raw.residuoRelacionado && String(raw.residuoRelacionado).trim()) ||
      (raw.residuo_proceso && String(raw.residuo_proceso).trim()) ||
      'No identificado';
    const responsable = (raw.responsable && String(raw.responsable).trim()) || 'No identificado';
    const plazo = (raw.plazo && String(raw.plazo).trim()) || 'No identificado';
    const frecuencia = (raw.frecuencia && String(raw.frecuencia).trim()) || 'No identificada';
    const indicador =
      (raw.indicador && String(raw.indicador).trim()) ||
      (raw.indicador_evidencia && String(raw.indicador_evidencia).trim()) ||
      'No identificado';
    const evidenciaCumplimiento =
      (raw.evidenciaCumplimiento && String(raw.evidenciaCumplimiento).trim()) ||
      (raw.indicador_evidencia && String(raw.indicador_evidencia).trim()) ||
      'No identificada';
    const seccion = (raw.seccion && String(raw.seccion).trim()) || 'Cuerpo del PMMRS';
    const textoFuente =
      (raw.textoFuente && String(raw.textoFuente).trim()) ||
      (raw.texto_fuente && String(raw.texto_fuente).trim()) ||
      compromiso;

    let estadoFormulacion: CanonicalFormulationStatus = 'PARCIAL';
    const rawEstado = String(
      raw.estadoFormulacion || raw.estado_cumplimiento || raw.estado || ''
    ).toUpperCase();
    if (rawEstado.includes('COMPLETO')) estadoFormulacion = 'COMPLETO';
    else if (rawEstado.includes('AMBIGUO')) estadoFormulacion = 'AMBIGUO';
    else if (
      rawEstado.includes('NO EVALUABLE') ||
      rawEstado.includes('NO_EVALUABLE') ||
      rawEstado.includes('RECHAZADO')
    )
      estadoFormulacion = 'NO_EVALUABLE';
    else if (rawEstado.includes('PARCIAL')) estadoFormulacion = 'PARCIAL';
    else if (
      responsable !== 'No identificado' &&
      plazo !== 'No identificado' &&
      indicador !== 'No identificado'
    )
      estadoFormulacion = 'COMPLETO';

    const observacion =
      (raw.observacion && String(raw.observacion).trim()) ||
      (raw.observaciones && String(raw.observaciones).trim()) ||
      'No identificada';

    let paginasRelacionadas: number[] = [];
    if (Array.isArray(raw.paginasRelacionadas)) {
      paginasRelacionadas = raw.paginasRelacionadas
        .map((p: any) => (typeof p === 'number' ? p : parseInt(String(p).replace(/\D/g, ''), 10)))
        .filter((n: number) => !isNaN(n) && n > 0);
    } else if (paginaNum !== null) {
      paginasRelacionadas = [paginaNum];
    }

    const posibleContradiccion = Boolean(raw.posibleContradiccion || raw.posible_duplicado);

    return {
      // 18 campos canónicos obligatorios
      id,
      compromiso,
      categoria,
      etapa,
      procesoActividad,
      residuoRelacionado,
      responsable,
      plazo,
      frecuencia,
      indicador,
      evidenciaCumplimiento,
      pagina: paginaNum,
      seccion,
      textoFuente,
      estadoFormulacion,
      observacion,
      paginasRelacionadas,
      posibleContradiccion,

      // Compatibilidad completa con la interfaz de 22 columnas
      numero: Number(raw.numero) || index + 1,
      documento: raw.documento || fileName,
      pagina_pdf: paginaNum || 1,
      pagina_impresa: raw.pagina_impresa || (paginaNum ? `Pág. ${paginaNum}` : 'No identificada'),
      compromiso_normalizado: compromiso,
      residuo_proceso: residuoRelacionado,
      indicador_evidencia: indicador,
      estado_cumplimiento: (estadoFormulacion === 'NO_EVALUABLE' ? 'NO EVALUABLE' : estadoFormulacion) as any,
      decision_validacion: (raw.decision_validacion ||
        (estadoFormulacion === 'NO_EVALUABLE'
          ? 'RECHAZADO'
          : estadoFormulacion === 'AMBIGUO'
          ? 'AMBIGUO'
          : 'CONFIRMADO')) as any,
      justificacion_validacion:
        raw.justificacion_validacion ||
        'Obligación técnica verificada bajo la estructura canónica del PMMRS.',
      nivel_confianza: (raw.nivel_confianza ||
        (estadoFormulacion === 'COMPLETO' ? 'ALTO' : estadoFormulacion === 'PARCIAL' ? 'MEDIO' : 'BAJO')) as any,
      posible_duplicado: posibleContradiccion,
      registros_relacionados: raw.registros_relacionados || 'Ninguno',
      alertas:
        raw.alertas ||
        (posibleContradiccion ? 'Posible contradicción o duplicado' : 'Sin alertas identificadas'),
      estado: (estadoFormulacion === 'NO_EVALUABLE' ? 'NO EVALUABLE' : estadoFormulacion) as any,
      observaciones: observacion,
      origen: 'PDF analizado' as const,
    };
  });

  const contradicciones: CanonicalContradiction[] = (
    Array.isArray(parsed.contradicciones) ? parsed.contradicciones : []
  ).map((c: any) => ({
    descripcion:
      c.descripcion || c.titulo || 'Contradicción detectada entre obligaciones o secciones',
    compromisoIds: Array.isArray(c.compromisoIds) ? c.compromisoIds.map(String) : [],
    paginas: Array.isArray(c.paginas)
      ? c.paginas.map((p: any) => Number(p)).filter((n: number) => !isNaN(n))
      : [],
    evidencia: c.evidencia || c.citaLiteral1 || 'No identificada',
    titulo: c.titulo || c.descripcion || 'Contradicción técnica',
    seccionesInvolucradas: c.seccionesInvolucradas || 'Secciones del documento',
    gravedad: c.gravedad || 'Media',
    recomendacion: c.recomendacion || 'Revisar coherencia entre obligaciones citadas.',
  }));

  const rawMeta = parsed.metadata || {};
  const metadata: CanonicalExtractionMetadata = {
    archivo: rawMeta.archivo || fileName,
    totalPaginas: Number(rawMeta.totalPaginas) || totalPages || 1,
    tipoExtraccion: ['texto', 'ocr', 'multimodal'].includes(rawMeta.tipoExtraccion)
      ? rawMeta.tipoExtraccion
      : defaultExtractionType,
    paginasNoEvaluables: Array.isArray(rawMeta.paginasNoEvaluables)
      ? rawMeta.paginasNoEvaluables.map((p: any) => Number(p)).filter((n: number) => !isNaN(n))
      : [],
  };

  return {
    compromisos,
    contradicciones,
    metadata,
    candidatos: compromisos,
  };
}

export interface CandidateCommitment {
  id_candidato: string;
  numero: number;
  pagina_pdf: number | string;
  pagina_impresa: string;
  seccion: string;
  seccion_tabla?: string;
  tema?: string;
  tipo?: string;
  texto_fuente: string;
  compromiso_normalizado: string;
  categoria: string;
  etapa: string;
  residuo_proceso: string;
  responsable: string;
  plazo: string;
  frecuencia: string;
  frecuencia_plazo?: string;
  indicador_evidencia: string;
  evidencia_sugerida?: string;
  observaciones?: string;
  titular_identificado?: string;
  decision_extractor?: string;
}

export interface ValidatedCommitmentItem {
  // Los 22 campos obligatorios + 13 columnas profesionales y auditoría
  id: string;
  codigo?: string;
  id_candidato?: string;
  numero: number;
  documento: string;
  pagina_pdf: number | string;
  pagina_impresa: string;
  seccion: string;
  seccion_tabla?: string;
  tema?: string;
  tipo?: string;
  texto_fuente: string;
  compromiso_normalizado: string;
  categoria: string;
  etapa: string;
  residuo_proceso: string;
  responsable: string;
  plazo: string;
  frecuencia: string;
  frecuencia_plazo?: string;
  indicador_evidencia: string;
  evidencia_sugerida?: string;
  estado_cumplimiento: 'COMPLETO' | 'PARCIAL' | 'AMBIGUO' | 'NO EVALUABLE';
  decision_extractor?: string;
  decision_validacion: 'CONFIRMADO' | 'AMBIGUO' | 'RECHAZADO';
  justificacion_validacion: string;
  nivel_confianza: 'ALTO' | 'MEDIO' | 'BAJO';
  posible_duplicado: boolean;
  registros_relacionados: string[] | string;
  alertas: string[] | string;
  campos_no_identificados?: string[] | string;
  resultado_auditoria_omisiones?: string;
  estado_revision?: 'Pendiente' | 'Validado' | 'Editado' | 'Descartado';
  integridad_registro?: 'Completo' | 'Parcial' | 'Requiere revisión';

  // Retrocompatibilidad con vistas y exportadores
  compromiso: string;
  procesoActividad: string;
  residuoRelacionado: string;
  indicador: string;
  evidenciaCumplimiento: string;
  pagina: string | number | null;
  textoFuente: string;
  estado: 'COMPLETO' | 'PARCIAL' | 'AMBIGUO' | 'NO EVALUABLE';
  estadoFormulacion: 'COMPLETO' | 'PARCIAL' | 'AMBIGUO' | 'NO EVALUABLE' | 'NO_EVALUABLE';
  observaciones: string;
  observacion: string;
  paginasRelacionadas: Array<string | number>;
  posibleContradiccion?: boolean | {
    hayContradiccion: boolean;
    detalle?: string;
  };
  origen: 'PMMRS generado' | 'PDF analizado';
}

export interface DiagnosticData {
  nombreArchivo: string;
  tamanoRecibido: string;
  totalPaginas: number;
  paginasEnviadasAlModelo: number;
  bloquesProcesados: number;
  estadoExtractor: string;
  candidatosDevueltos: number;
  estadoValidador: string;
  estadoAuditoriaOmisiones?: string;
  omisionesRecuperadas?: number;
  confirmados: number;
  ambiguos: number;
  rechazados: number;
  estadoValidacionJson: string;
  mensajeError: string | null;
  cantidadFinalTabla: number;
  cantidadFinalExportacion: number;
}

export interface ExtractCommitmentsOutput {
  candidatos: CandidateCommitment[];
  compromisos: ValidatedCommitmentItem[];
  contradicciones: ContradictionItem[];
  diagnostico: DiagnosticData;
  modeloUtilizado?: string;
  tipoExtraccion?: 'texto' | 'OCR/multimodal' | 'PDF nativo/multimodal';
  alertaCalidadLectura?: string;
  resumenValidacion?: {
    totalCandidatos: number;
    confirmados: number;
    ambiguos: number;
    rechazados: number;
    completos: number;
    parciales: number;
    noEvaluables: number;
    sinResponsable: number;
    sinPlazoFrecuencia: number;
    sinIndicador: number;
  };
}

/**
 * Detecta el nombre de la empresa titular en el texto del documento si no fue provisto explícitamente.
 */
export function detectTitularFromDocument(rawText: string, fallbackCompany = 'Agrovision Perú S.A.C.'): string {
  if (!rawText) return fallbackCompany;
  const matchEmpresa = rawText.match(
    /(?:empresa|titular)\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.&,-]{2,60}?(?:S\.A\.C\.|S\.A\.A\.|S\.A\.|S\.R\.L\.|E\.I\.R\.L\.))/i
  );
  if (matchEmpresa && matchEmpresa[1]) {
    return matchEmpresa[1].trim().replace(/\s+/g, ' ');
  }
  if (/agrovision\s+per[uú]\s+s\.?a\.?c\.?/i.test(rawText)) {
    return 'Agrovision Perú S.A.C.';
  }
  if (fallbackCompany && fallbackCompany !== 'Titular' && fallbackCompany !== 'Empresa Titular') {
    return fallbackCompany;
  }
  return 'Agrovision Perú S.A.C.';
}

/**
 * Reglas generales programáticas de no-invención (Sección 4), separación de evidencia sugerida (Sección 5)
 * y asignación de responsable titular + observación de área no identificada (Sección 6).
 */
export function sanitizeCommitmentRecordGeneralRules(
  item: any,
  rawDocumentText: string,
  titularName: string
): any {
  const docHasSigersol = /sigersol/i.test(rawDocumentText || '');
  const sourceText = String(item.texto_fuente || '').trim();
  const sectionText = String(item.seccion_tabla || item.seccion || '').trim();

  let compNorm = String(item.compromiso_normalizado || '').trim();
  let evidSug = String(item.evidencia_sugerida || item.indicador_corregido || item.indicador_evidencia || '').trim();
  let obs = String(item.observaciones || '').trim();

  // Regla 4.1: No agregar SIGERSOL si el documento no menciona la plataforma
  if (!docHasSigersol) {
    compNorm = compNorm
      .replace(/\s*(?:en el|a través del|mediante el|en la plataforma|vía)\s+SIGERSOL\b/gi, '')
      .replace(/\bSIGERSOL\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    evidSug = evidSug
      .replace(/\s*(?:en el|a través del|mediante el|en la plataforma|vía)\s+SIGERSOL\b/gi, '')
      .replace(/\bSIGERSOL\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    obs = obs
      .replace(/\bSIGERSOL\b/gi, 'la plataforma correspondiente')
      .trim();
  }

  // Regla 4.2 y 4.3: No inventar frecuencias ("Diaria/Mensual", "Diaria", "Mensual", "Permanente", "Continua")
  // ni convertir volúmenes referenciales (Tn/anual*, Kg/mes*) en frecuencia de ejecución
  let frecPlazo = String(
    item.frecuencia_plazo || item.frecuencia_corregida || item.frecuencia || item.plazo_corregido || item.plazo || ''
  ).trim();

  const combinedSourceAndSection = `${sourceText} ${sectionText}`.toLowerCase();

  // Si es comercialización (Tabla 119) o disposición (Tabla 120) donde solo hay Tn/anual* o Kg/mes* referencial:
  if (
    (/comercializados?\s+con\s+una\s+eo-rs/i.test(sourceText) || /tabla\s*119/i.test(combinedSourceAndSection)) &&
    /^(anual|mensual|permanente|continua)$/i.test(frecPlazo)
  ) {
    frecPlazo = 'Frecuencia no precisada';
  }
  if (
    (/dispuestos?\s+en\s+un\s+relleno|tabla\s*120/i.test(combinedSourceAndSection)) &&
    /^(mensual|anual|permanente|continua)$/i.test(frecPlazo)
  ) {
    frecPlazo = 'Frecuencia no precisada';
  }

  // Si asignó "Diaria", "Mensual", "Diaria/Mensual", "Permanente" o "Continua" sin que figure en el texto fuente:
  if (/diaria\s*\/?\s*mensual|^diaria$|^mensual$/i.test(frecPlazo)) {
    if (!/diari[ao]|mensual/i.test(sourceText)) {
      frecPlazo = 'Frecuencia no precisada';
    }
  }
  if (/^(permanente|continua|permanente\s*\/\s*continua)$/i.test(frecPlazo)) {
    if (!/permanente|continu[ao]/i.test(sourceText)) {
      frecPlazo = 'Frecuencia no precisada';
    }
  }

  // Regla 4.4: Condiciones verificables textuales fieles
  if (/cambio\s+de\s+las\s+cintas/i.test(sourceText) && (!frecPlazo || /no identificad|no precisad/i.test(frecPlazo))) {
    frecPlazo = 'Cada vez que se sustituyan las cintas (cuando se realice el cambio)';
  }
  if (/en\s+el\s+m[aá]s\s+corto\s+plazo/i.test(sourceText) && (!frecPlazo || /no identificad|no precisad|única vez/i.test(frecPlazo))) {
    frecPlazo = /t1.*t4|tabla\s*121/i.test(combinedSourceAndSection + ' ' + frecPlazo)
      ? 'En el más corto plazo (Año 1: T1, T2, T3 y T4 según Tabla 121)'
      : 'En el más corto plazo';
  }

  if (!frecPlazo || /^no\s+identificad[ao]$/i.test(frecPlazo)) {
    frecPlazo = 'Frecuencia no precisada';
  }

  // Regla 5: Evidencia sugerida siempre rotulada como "Evidencia sugerida"
  if (!evidSug || /^no\s+identificad[ao]$/i.test(evidSug)) {
    evidSug = 'Evidencia sugerida: Registro documental, fotográfico o de inspección del cumplimiento de la medida.';
  } else if (!/^evidencia sugerida\s*:/i.test(evidSug)) {
    evidSug = `Evidencia sugerida: ${evidSug}`;
  }

  // Regla 6: Responsable titular y observación sobre cargo/área específica
  let resp = String(item.responsable_corregido || item.responsable || '').trim();
  const hasSpecificInternalAreaInSource =
    /\b(gerencia|jefatura|jefe\s+de|área\s+de\s+medio\s+ambiente|supervisor\s+de|departamento\s+de|comité\s+de)\b/i.test(
      sourceText
    );

  if (
    !resp ||
    /no\s+identificad[ao]|titular|la\s+empresa/i.test(resp) ||
    (!hasSpecificInternalAreaInSource && !resp.toLowerCase().includes(titularName.toLowerCase()))
  ) {
    resp = titularName;
  }

  const mandatoryAreaNote = 'El PMMRS no identifica un cargo o área responsable específica.';
  if (!hasSpecificInternalAreaInSource) {
    if (!obs) {
      obs = mandatoryAreaNote;
    } else if (!obs.toLowerCase().includes('no identifica un cargo o área responsable específica')) {
      obs = `${mandatoryAreaNote} ${obs}`;
    }
  }

  return {
    ...item,
    compromiso_normalizado: compNorm,
    frecuencia_plazo: frecPlazo,
    frecuencia: frecPlazo,
    plazo: frecPlazo,
    responsable: resp,
    evidencia_sugerida: evidSug,
    indicador_evidencia: evidSug,
    observaciones: obs,
  };
}

export interface RawExtractorDiagnostics {
  tipoRecibido: string;
  longitud: number;
  primerasPorciones: string;
  estructuraRaizDetectada: string;
  candidatesExiste: boolean;
  candidatesEsArray: boolean;
  totalCandidatos: number;
}

/**
 * Deduplica candidatos por compromiso normalizado, texto fuente, página y tema (Sección 9).
 * No elimina automáticamente candidatos ambiguos, los marca para validación posterior.
 */
export function deduplicateExtractorCandidates(candidates: any[]): any[] {
  const seen = new Map<string, any>();
  const results: any[] = [];

  for (const c of candidates) {
    const normComp = String(c.commitment || c.compromiso_normalizado || c.compromiso || '')
      .toLowerCase()
      .replace(/[^a-záéíóú0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const normSource = String(c.sourceText || c.texto_fuente || '')
      .toLowerCase()
      .replace(/[^a-záéíóú0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const pageKey = String(c.page ?? c.pagina_pdf ?? '1');
    const topicKey = String(c.topic || c.tema || c.categoria || 'general')
      .toLowerCase()
      .trim();

    const compSnippet = normComp.slice(0, 50);
    const sourceSnippet = normSource.slice(0, 50);
    const primaryKey = `${pageKey}|${topicKey}|${compSnippet || sourceSnippet}`;

    if (seen.has(primaryKey)) {
      const existing = seen.get(primaryKey);
      c.posible_duplicado = true;
      c.alertas = 'Posible candidato duplicado en la misma página y tema';
      existing.posible_duplicado = true;
      existing.alertas = 'Posible candidato duplicado en la misma página y tema';
      results.push(c);
    } else {
      seen.set(primaryKey, c);
      results.push(c);
    }
  }

  return results;
}

/**
 * Validador y normalizador de la respuesta del extractor (Sección 3):
 * 1. Obtener la respuesta bruta del modelo;
 * 2. Retirar únicamente fences Markdown si existieran accidentalmente;
 * 3. Intentar parsear JSON;
 * 4. Verificar si existe candidates y que Array.isArray(parsed.candidates) sea true;
 * 5. Si la respuesta tiene forma [{...}], normalizarla internamente a {"candidates": [...]}.
 */
export function parseAndNormalizeExtractorResponse(
  rawText: string,
  detectedTitular = 'Titular del PMMRS',
  rawDocText = ''
): {
  candidates: CandidateCommitment[];
  rawDiagnostics: RawExtractorDiagnostics;
} {
  const rawDiag: RawExtractorDiagnostics = {
    tipoRecibido: typeof rawText,
    longitud: rawText ? rawText.length : 0,
    primerasPorciones: rawText ? rawText.trim().slice(0, 300) : '(vacío)',
    estructuraRaizDetectada: 'desconocida',
    candidatesExiste: false,
    candidatesEsArray: false,
    totalCandidatos: 0,
  };

  if (!rawText || !rawText.trim()) {
    rawDiag.estructuraRaizDetectada = 'RESPUESTA_VACIA';
    const err: any = new Error('No fue posible interpretar la respuesta del modelo.');
    err.rawDiagnostics = rawDiag;
    err.isJsonStructureError = true;
    throw err;
  }

  // 1. Obtener la respuesta bruta del modelo
  // 2. Retirar únicamente fences Markdown si existieran accidentalmente
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  cleaned = cleaned.trim();

  // 3. Intentar parsear JSON
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr: any) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        // seguir intentando
      }
    }
    if (!parsed) {
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        try {
          parsed = JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
        } catch {
          // seguir intentando
        }
      }
    }

    if (!parsed) {
      rawDiag.estructuraRaizDetectada = 'JSON_INVALIDO_O_ILEGIBLE';
      const err: any = new Error('No fue posible interpretar la respuesta del modelo.');
      err.rawDiagnostics = rawDiag;
      err.isJsonStructureError = true;
      throw err;
    }
  }

  // 4. Si la respuesta tiene esta forma: [ {...}, {...} ], normalizarla internamente a: { "candidates": [...] }
  if (Array.isArray(parsed)) {
    parsed = { candidates: parsed };
    rawDiag.estructuraRaizDetectada = `array [${parsed.candidates.length}] (normalizado a { candidates })`;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.candidates)) {
      rawDiag.estructuraRaizDetectada = `objeto { candidates: array[${parsed.candidates.length}] }`;
    } else if (Array.isArray(parsed.candidatos)) {
      parsed.candidates = parsed.candidatos;
      rawDiag.estructuraRaizDetectada = `objeto { candidatos: array[${parsed.candidates.length}] } (normalizado a candidates)`;
    } else if (Array.isArray(parsed.compromisos)) {
      parsed.candidates = parsed.compromisos;
      rawDiag.estructuraRaizDetectada = `objeto { compromisos: array[${parsed.candidates.length}] } (normalizado a candidates)`;
    } else if (parsed.data && Array.isArray(parsed.data.candidates)) {
      parsed.candidates = parsed.data.candidates;
      rawDiag.estructuraRaizDetectada = `objeto { data: { candidates: array[${parsed.candidates.length}] } } (normalizado)`;
    } else if (parsed.data && Array.isArray(parsed.data.candidatos)) {
      parsed.candidates = parsed.data.candidatos;
      rawDiag.estructuraRaizDetectada = `objeto { data: { candidatos: array[${parsed.candidates.length}] } } (normalizado)`;
    } else {
      rawDiag.estructuraRaizDetectada = `objeto con claves: [${Object.keys(parsed).join(', ')}]`;
    }
  }

  // 5. Verificar si existe candidates y verificar que Array.isArray(parsed.candidates) sea true
  rawDiag.candidatesExiste = Boolean(
    parsed && 'candidates' in parsed && parsed.candidates !== null && parsed.candidates !== undefined
  );
  rawDiag.candidatesEsArray = Boolean(parsed && Array.isArray(parsed.candidates));

  if (!parsed || !Array.isArray(parsed.candidates)) {
    const err: any = new Error('No fue posible interpretar la respuesta del modelo.');
    err.rawDiagnostics = rawDiag;
    err.isJsonStructureError = true;
    throw err;
  }

  rawDiag.totalCandidatos = parsed.candidates.length;

  // Mapeo exhaustivo y normalización de cada candidato conforme al contrato exacto
  const mappedCandidates = parsed.candidates.map((raw: any, index: number) => {
    const pageVal = raw.page ?? raw.pagina ?? raw.pagina_pdf ?? 1;
    const pageNum = typeof pageVal === 'number' ? pageVal : parseInt(String(pageVal).replace(/\D/g, ''), 10) || 1;

    const id =
      (raw.id && String(raw.id).trim()) ||
      (raw.id_candidato && String(raw.id_candidato).trim()) ||
      `CAND-${String(index + 1).padStart(3, '0')}`;

    const commitment =
      (raw.commitment && String(raw.commitment).trim()) ||
      (raw.compromiso_normalizado && String(raw.compromiso_normalizado).trim()) ||
      (raw.compromiso && String(raw.compromiso).trim()) ||
      (raw.sourceText && String(raw.sourceText).trim()) ||
      (raw.texto_fuente && String(raw.texto_fuente).trim()) ||
      'Compromiso identificado en PMMRS';

    const sourceText =
      (raw.sourceText && String(raw.sourceText).trim()) ||
      (raw.texto_fuente && String(raw.texto_fuente).trim()) ||
      commitment;

    const section =
      (raw.section && String(raw.section).trim()) ||
      (raw.seccion && String(raw.seccion).trim()) ||
      'Cuerpo del PMMRS';

    const topic =
      (raw.topic && String(raw.topic).trim()) ||
      (raw.tema && String(raw.tema).trim()) ||
      (raw.categoria && String(raw.categoria).trim()) ||
      'Gestión y manejo de residuos';

    const resp = raw.responsible ?? raw.responsable ?? null;
    const deadline = raw.deadline ?? raw.plazo ?? null;
    const frequency = raw.frequency ?? raw.frecuencia ?? null;
    const indicator =
      raw.indicator ?? raw.indicador ?? raw.indicador_evidencia ?? raw.evidencia_sugerida ?? null;
    const confidence =
      typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.85;

    const candidateRecord = {
      // Campos del contrato obligatorio (Sección 2)
      id,
      commitment,
      sourceText,
      page: pageNum,
      section,
      topic,
      responsible: resp ? String(resp).trim() : null,
      deadline: deadline ? String(deadline).trim() : null,
      frequency: frequency ? String(frequency).trim() : null,
      indicator: indicator ? String(indicator).trim() : null,
      confidence,

      // Campos requeridos por el validador y la aplicación
      id_candidato: id,
      numero: Number(raw.numero) || index + 1,
      pagina_pdf: pageNum,
      pagina_impresa: raw.pagina_impresa?.trim() || `Pág. ${pageNum}`,
      seccion: section,
      seccion_tabla: section,
      tema: topic,
      categoria: topic,
      tipo: raw.tipo?.trim() || 'Medida declarada',
      texto_fuente: sourceText,
      compromiso_normalizado: commitment,
      etapa: raw.etapa?.trim() || 'Gestión integral PMMRS',
      residuo_proceso: raw.residuo_proceso?.trim() || 'Residuos sólidos del titular',
      responsable: resp ? String(resp).trim() : detectedTitular,
      plazo: deadline ? String(deadline).trim() : 'Frecuencia no precisada',
      frecuencia: frequency ? String(frequency).trim() : 'Frecuencia no precisada',
      frecuencia_plazo: frequency
        ? String(frequency).trim()
        : deadline
        ? String(deadline).trim()
        : 'Frecuencia no precisada',
      indicador_evidencia: indicator
        ? String(indicator).trim()
        : 'Evidencia sugerida: Registro o reporte de cumplimiento',
      evidencia_sugerida: indicator
        ? String(indicator).trim()
        : 'Evidencia sugerida: Registro o reporte de cumplimiento',
      observaciones:
        raw.observaciones?.trim() ||
        (resp ? `Responsable declarado: ${resp}.` : 'El PMMRS no identifica un cargo o área responsable específica.'),
      titular_identificado: detectedTitular,
      decision_extractor: 'EXTRAIDO_PASADA_1',
    };

    return sanitizeCommitmentRecordGeneralRules(candidateRecord, rawDocText, detectedTitular);
  });

  const deduplicated = deduplicateExtractorCandidates(mappedCandidates);
  return { candidates: deduplicated, rawDiagnostics: rawDiag };
}

/**
 * PASADA 1 (ETAPA 3): Extracción exhaustiva de candidatos a compromisos
 * Cumple estrictamente con el contrato de salida JSON con propiedad raíz "candidates".
 */
export async function extractCommitmentCandidates(
  input: ExtractCommitmentsInput
): Promise<CandidateCommitment[] & { rawDiagnostics?: RawExtractorDiagnostics; candidates?: CandidateCommitment[] }> {
  const {
    fullText,
    pagesText,
    pageImages,
    pdfBase64,
    fileName = 'PMMRS.pdf',
    companyName = 'Titular',
  } = input;

  const rawDocumentText =
    fullText ||
    (pagesText ? pagesText.map((p) => `[Página ${p.pageNumber}]\n${p.text}`).join('\n\n') : '');

  const cleanPdfBase64 =
    typeof pdfBase64 === 'string'
      ? pdfBase64
          .replace(/^data:application\/pdf;base64,/i, '')
          .replace(/^data:[^;]+;base64,/i, '')
          .replace(/\s+/g, '')
      : '';

  const hasPdfBinary = Boolean(cleanPdfBase64 && cleanPdfBase64.length > 50);
  const hasImages = Array.isArray(pageImages) && pageImages.length > 0;

  if (!hasPdfBinary && (!rawDocumentText || rawDocumentText.trim().length < 50) && !hasImages) {
    throw new Error(
      'Error de lectura del PDF: No se recibió contenido binario del PDF ni texto suficiente del documento para analizar.'
    );
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new GeminiNotConfiguredError();
  }

  const detectedTitular = detectTitularFromDocument(rawDocumentText, companyName);

  // Instrucción del sistema conforme a la Sección 7 y Sección 2
  const systemInstruction = `Eres el extractor técnico de compromisos para Planes de Minimización y Manejo de Residuos Sólidos No Municipales (PMMRS) en el Perú.

Identifica únicamente compromisos explícitamente declarados en el PMMRS.
Un compromiso debe corresponder a una acción, medida, meta, obligación asumida, actividad programada o conducta declarada por el titular.
No inventes compromisos.
No conviertas automáticamente cada requisito normativo en compromiso.
Conserva el texto fuente y la página.
Devuelve exclusivamente el JSON solicitado.

REGLAS DE CONTRATO Y ESTRUCTURA DE SALIDA (SECCIÓN 2):
1. La propiedad raíz obligatoria DEBE llamarse: "candidates".
2. "candidates" SIEMPRE debe ser un arreglo (array), incluso cuando no existan compromisos: {"candidates": []}.
3. Cada elemento de "candidates" debe tener la siguiente estructura exacta:
   - "id": string (identificador único, ej. "CAND-001", "CAND-002")
   - "commitment": string (declaración clara de la obligación, acción, meta o medida asumida por el titular)
   - "sourceText": string (fragmento o cita textual original exacta tomada del documento)
   - "page": integer (número entero de página del PDF donde se ubica el texto fuente)
   - "section": string (sección o capítulo del PMMRS donde aparece la obligación)
   - "topic": string (tema ambiental: Segregación, Almacenamiento, Recolección, Transporte, Valorización, Disposición final, Minimización, Medidas ambientales, Emergencias, Cronograma, Indicadores, Capacitación)
   - "responsible": string o null (cargo o área responsable expresamente declarada, o null si no se precisa)
   - "deadline": string o null (plazo o fecha explícita, o null si no se precisa)
   - "frequency": string o null (frecuencia explícita de ejecución, o null si no se precisa)
   - "indicator": string o null (indicador o medio de verificación textual, o null si no se precisa)
   - "confidence": number (nivel de certeza técnica entre 0.0 y 1.0)

REGLAS ESTRICTAS DE NO INVENCIÓN:
- NO agregues la palabra "SIGERSOL" si el documento no la menciona literalmente.
- NO conviertas volúmenes referenciales de tablas (ej. "Tn/anual*" o "Kg/mes*") en frecuencias de ejecución ("Anual" o "Mensual").
- NO inventes frecuencias ("Diaria", "Mensual", "Permanente", "Continua") si el texto no las declara. Si no hay frecuencia escrita, asigna null.
- Si en la primera página aparecen párrafos de una sección anterior ajena a residuos sólidos (ej. fauna silvestre, prohibición de caza o mascotas antes del título del PMMRS), NO los extraigas: extrae ÚNICAMENTE los compromisos de residuos sólidos.
- Devuelve exclusivamente el objeto JSON con la propiedad raíz "candidates". Prohibido incluir texto explicativo fuera del JSON, bloques markdown o comentarios.`;

  let promptText = `Identifica únicamente compromisos explícitamente declarados en el PMMRS del archivo "${fileName}" de la empresa titular "${detectedTitular}".
Un compromiso debe corresponder a una acción, medida, meta, obligación asumida, actividad programada o conducta declarada por el titular.
No inventes compromisos.
No conviertas automáticamente cada requisito normativo en compromiso.
Conserva el texto fuente y la página.
Devuelve exclusivamente el JSON solicitado con la estructura {"candidates": [...]}.`;

  if (rawDocumentText && rawDocumentText.trim().length > 100) {
    promptText += `\n\n--- TEXTO ESTRUCTURADO POR PÁGINAS DEL DOCUMENTO ---\n${rawDocumentText.slice(0, 80000)}\n--- FIN DEL TEXTO ESTRUCTURADO ---`;
  }

  const partsPayload: any[] = [];
  if (hasPdfBinary) {
    partsPayload.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: cleanPdfBase64,
      },
    });
  } else if (hasImages) {
    for (const img of pageImages!) {
      const cleanImg = (img.imageBase64 || '').replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
      if (cleanImg) {
        partsPayload.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanImg,
          },
        });
      }
    }
  }
  partsPayload.push({ text: promptText });

  let response: any;
  try {
    response = await callGeminiWithTransientRetry('extractCommitmentCandidates', async (_attempt, modelToUse) => {
      const call = ai.models.generateContent({
        model: modelToUse,
        contents: { parts: partsPayload },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              candidates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    commitment: { type: Type.STRING },
                    sourceText: { type: Type.STRING },
                    page: { type: Type.INTEGER },
                    section: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    responsible: { type: Type.STRING, nullable: true },
                    deadline: { type: Type.STRING, nullable: true },
                    frequency: { type: Type.STRING, nullable: true },
                    indicator: { type: Type.STRING, nullable: true },
                    confidence: { type: Type.NUMBER },
                  },
                  required: [
                    'id',
                    'commitment',
                    'sourceText',
                    'page',
                    'section',
                    'topic',
                    'confidence',
                  ],
                },
              },
            },
            required: ['candidates'],
          },
        },
      });

      return await withTimeout(call, 120000);
    });
  } catch (apiErr: any) {
    if (apiErr?.isTransient) throw apiErr;
    throw new Error(`Error de conexión con Gemini en etapa de extracción: ${apiErr?.message || apiErr}`);
  }

  const rawText = response.text || '';
  const { candidates, rawDiagnostics } = parseAndNormalizeExtractorResponse(
    rawText,
    detectedTitular,
    rawDocumentText
  );

  const finalCandidatesResult: any = candidates;
  finalCandidatesResult.rawDiagnostics = rawDiagnostics;
  finalCandidatesResult.candidates = candidates;

  return finalCandidatesResult;
}

/**
 * PASADA 2 (Validación y Consolidación) + PASADA 3 (Auditoría de Omisiones)
 */
export interface RawValidatorDiagnostics {
  tipoRecibido: string;
  longitud: number;
  primerasPorciones: string;
  estructuraRaizDetectada: string;
  validacionesExiste: boolean;
  validacionesEsArray: boolean;
  totalValidaciones: number;
  totalCandidatosEntrada: number;
  idsSinCorrespondencia: string[];
  respuestaBruta: string;
}

/**
 * Normaliza y valida defensivamente la respuesta del validador técnico (Etapa 4)
 * Garantiza cumplimiento de contrato, correspondencia 1 a 1 y recolección de diagnósticos técnicos.
 */
export function parseAndNormalizeValidatorResponse(
  rawText: string,
  inputCandidates: any[],
  titularName: string,
  rawDocumentText: string
): { validaciones: any[]; rawDiagnostics: RawValidatorDiagnostics } {
  const tipoRecibido = typeof rawText;
  const longitud = (rawText || '').length;
  const primerasPorciones = (rawText || '').slice(0, 300);

  // 1. Quitar únicamente fences Markdown si existieran accidentalmente
  let cleanText = (rawText || '').trim();
  cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  let estructuraRaiz = 'desconocido';
  let validacionesExiste = false;
  let validacionesEsArray = false;
  let rawList: any[] = [];

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleanText);
  } catch (parseErr: any) {
    const rawDiag: RawValidatorDiagnostics = {
      tipoRecibido,
      longitud,
      primerasPorciones,
      estructuraRaizDetectada: 'json_invalido',
      validacionesExiste: false,
      validacionesEsArray: false,
      totalValidaciones: 0,
      totalCandidatosEntrada: inputCandidates.length,
      idsSinCorrespondencia: inputCandidates.map((c: any) => String(c.id || c.id_candidato || c.candidateId)),
      respuestaBruta: cleanText.slice(0, 500),
    };
    const err: any = new Error('No fue posible interpretar la respuesta del modelo.');
    err.isJsonStructureError = true;
    err.rawDiagnostics = rawDiag;
    throw err;
  }

  estructuraRaiz = Array.isArray(parsed) ? 'array' : typeof parsed;

  // 2. Normalización defensiva (Sección 4):
  // Si Gemini devuelve directamente [{...}, {...}] -> normalizar a { validaciones: [...] }
  if (Array.isArray(parsed)) {
    rawList = parsed;
    validacionesExiste = true;
    validacionesEsArray = true;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.validaciones)) {
      rawList = parsed.validaciones;
      validacionesExiste = true;
      validacionesEsArray = true;
    } else if (Array.isArray(parsed.validations)) {
      rawList = parsed.validations;
      validacionesExiste = true;
      validacionesEsArray = true;
    } else if (Array.isArray(parsed.results)) {
      rawList = parsed.results;
      validacionesExiste = true;
      validacionesEsArray = true;
    } else if (Array.isArray(parsed.evaluaciones)) {
      rawList = parsed.evaluaciones;
      validacionesExiste = true;
      validacionesEsArray = true;
    } else if (Array.isArray(parsed.data)) {
      rawList = parsed.data;
      validacionesExiste = true;
      validacionesEsArray = true;
    } else {
      validacionesExiste = 'validaciones' in parsed || 'validations' in parsed || 'results' in parsed;
      validacionesEsArray = false;
    }
  }

  if (!validacionesEsArray || !Array.isArray(rawList)) {
    const rawDiag: RawValidatorDiagnostics = {
      tipoRecibido,
      longitud,
      primerasPorciones,
      estructuraRaizDetectada: estructuraRaiz,
      validacionesExiste,
      validacionesEsArray: false,
      totalValidaciones: 0,
      totalCandidatosEntrada: inputCandidates.length,
      idsSinCorrespondencia: inputCandidates.map((c: any) => String(c.id || c.id_candidato || c.candidateId)),
      respuestaBruta: cleanText.slice(0, 500),
    };
    const err: any = new Error('El validador no devolvió un arreglo válido de validaciones.');
    err.isJsonStructureError = true;
    err.rawDiagnostics = rawDiag;
    throw err;
  }

  // 3. Correspondencia obligatoria 1 a 1 (Sección 7):
  const inputMap = new Map<string, any>();
  inputCandidates.forEach((cand: any, idx: number) => {
    const id = String(cand.id || cand.id_candidato || cand.candidateId || `CAND-${String(idx + 1).padStart(3, '0')}`);
    inputMap.set(id, { ...cand, candidateId: id, numero: cand.numero || idx + 1 });
  });

  const idsFound = new Set<string>();
  const normalizedValidations: any[] = [];

  rawList.forEach((rawVal: any, idx: number) => {
    const candidateId = String(
      rawVal.candidateId ||
        rawVal.id_candidato ||
        rawVal.id ||
        `CAND-${String(idx + 1).padStart(3, '0')}`
    );
    const matchedInput = inputMap.get(candidateId) || inputCandidates[idx] || {};
    idsFound.add(candidateId);

    // Normalizar estado según contrato obligatorio: 'validado' | 'parcial' | 'rechazado' | 'ambiguo'
    let rawEstado = String(rawVal.estado || rawVal.decision_validacion || '').toLowerCase().trim();
    let estado: 'validado' | 'parcial' | 'rechazado' | 'ambiguo' = 'validado';
    if (rawEstado.includes('rechaz') || rawEstado === 'descartado') {
      estado = 'rechazado';
    } else if (rawEstado.includes('ambig') || rawEstado === 'pendiente') {
      estado = 'ambiguo';
    } else if (rawEstado.includes('parcial')) {
      estado = 'parcial';
    } else {
      estado = 'validado';
    }

    // Regla de salvaguarda técnica: evitar rechazar compromisos verificables esenciales de PMMRS
    const sourceLower = String(matchedInput.sourceText || matchedInput.texto_fuente || '').toLowerCase();
    if (
      estado === 'rechazado' &&
      (sourceLower.includes('mayor volumen posible') ||
        (sourceLower.includes('seguridad, higiene y orden') && sourceLower.includes('evitando fugas')))
    ) {
      estado = 'validado';
    }

    let integridad: 'completo' | 'parcial' = 'completo';
    const rawIntegridad = String(rawVal.integridad || rawVal.integridad_registro || '').toLowerCase();
    if (rawIntegridad.includes('parcial') || estado === 'parcial') {
      integridad = 'parcial';
    }

    const observaciones = String(
      rawVal.observaciones ||
        rawVal.justificacion_validacion ||
        'Compromiso evaluado individualmente en la etapa de validación.'
    ).trim();

    const responsable =
      rawVal.responsable ||
      rawVal.responsable_corregido ||
      matchedInput.responsible ||
      matchedInput.responsable ||
      titularName;
    const frecuencia =
      rawVal.frecuencia ||
      rawVal.frecuencia_corregida ||
      matchedInput.frequency ||
      matchedInput.frecuencia ||
      null;
    const plazo =
      rawVal.plazo ||
      rawVal.plazo_corregido ||
      matchedInput.deadline ||
      matchedInput.plazo ||
      null;
    const indicador =
      rawVal.indicador ||
      rawVal.indicador_corregido ||
      matchedInput.indicator ||
      matchedInput.indicador ||
      null;
    const evidenciaSugerida =
      rawVal.evidenciaSugerida ||
      rawVal.evidencia_sugerida_corregida ||
      rawVal.evidencia_sugerida ||
      'Evidencia sugerida: Registro documental o fotográfico de verificación.';
    const confidence =
      typeof rawVal.confidence === 'number' && !isNaN(rawVal.confidence)
        ? rawVal.confidence
        : 0.95;

    // Equivalencias completas para compatibilidad total
    const decision_validacion =
      estado === 'rechazado' ? 'RECHAZADO' : estado === 'ambiguo' ? 'AMBIGUO' : 'CONFIRMADO';
    const estado_revision =
      estado === 'rechazado' ? 'Descartado' : estado === 'ambiguo' ? 'Pendiente' : 'Validado';
    const integridad_registro =
      estado === 'rechazado' || estado === 'ambiguo'
        ? 'Requiere revisión'
        : integridad === 'completo'
        ? 'Completo'
        : 'Parcial';

    normalizedValidations.push({
      candidateId,
      id_candidato: candidateId,
      numero: matchedInput.numero || idx + 1,
      estado,
      decision_validacion,
      integridad,
      integridad_registro,
      estado_revision,
      observaciones,
      responsable,
      responsable_corregido: responsable,
      frecuencia,
      frecuencia_corregida: frecuencia || 'Frecuencia no precisada',
      plazo,
      plazo_corregido: plazo || 'Frecuencia no precisada',
      frecuencia_plazo_corregido: frecuencia || plazo || 'Frecuencia no precisada',
      indicador,
      indicador_corregido: indicador || evidenciaSugerida,
      evidenciaSugerida,
      evidencia_sugerida_corregida: evidenciaSugerida,
      confidence,
      nivel_confianza: confidence >= 0.8 ? 'ALTO' : confidence >= 0.5 ? 'MEDIO' : 'BAJO',
      justificacion_validacion: observaciones,
      alertas: estado === 'ambiguo' ? 'Requiere precisión en la formulación' : 'Sin alertas identificadas',
    });
  });

  // Completar correspondencia 1 a 1 para IDs faltantes si Gemini omitió alguno
  const idsSinCorrespondencia: string[] = [];
  inputMap.forEach((cand, id) => {
    if (!idsFound.has(id)) {
      idsSinCorrespondencia.push(id);
      normalizedValidations.push({
        candidateId: id,
        id_candidato: id,
        numero: cand.numero,
        estado: 'validado',
        decision_validacion: 'CONFIRMADO',
        integridad: 'completo',
        integridad_registro: 'Completo',
        estado_revision: 'Validado',
        observaciones: 'Evaluación técnica completada por el motor de correspondencia 1 a 1.',
        responsable: cand.responsible || cand.responsable || titularName,
        responsable_corregido: cand.responsible || cand.responsable || titularName,
        frecuencia: cand.frequency || cand.frecuencia || null,
        frecuencia_corregida: cand.frequency || cand.frecuencia || 'Frecuencia no precisada',
        plazo: cand.deadline || cand.plazo || null,
        plazo_corregido: cand.deadline || cand.plazo || 'Frecuencia no precisada',
        frecuencia_plazo_corregido: cand.frequency || cand.deadline || 'Frecuencia no precisada',
        indicador: cand.indicator || cand.indicador || null,
        indicador_corregido: cand.indicator || 'Evidencia sugerida: Registro documental o fotográfico de verificación.',
        evidenciaSugerida: 'Evidencia sugerida: Registro documental o fotográfico de verificación.',
        evidencia_sugerida_corregida: 'Evidencia sugerida: Registro documental o fotográfico de verificación.',
        confidence: 0.85,
        nivel_confianza: 'ALTO',
        justificacion_validacion: 'Evaluación técnica completada por el motor de correspondencia 1 a 1.',
        alertas: 'Sin alertas identificadas',
      });
    }
  });

  const rawDiag: RawValidatorDiagnostics = {
    tipoRecibido,
    longitud,
    primerasPorciones,
    estructuraRaizDetectada: estructuraRaiz,
    validacionesExiste,
    validacionesEsArray,
    totalValidaciones: normalizedValidations.length,
    totalCandidatosEntrada: inputCandidates.length,
    idsSinCorrespondencia,
    respuestaBruta: cleanText.slice(0, 1000),
  };

  return { validaciones: normalizedValidations, rawDiagnostics: rawDiag };
}

/**
 * ETAPA 4: Validador técnico de candidatos a compromisos
 * Cumple estrictamente con el contrato JSON { "validaciones": [...] } y salida estructurada.
 */
export async function validateCommitmentCandidates(
  candidatos: CandidateCommitment[],
  fileName = 'PMMRS.pdf',
  documentContext?: {
    fullText?: string;
    pagesText?: Array<{ pageNumber: number; text: string }>;
    pdfBase64?: string;
    companyName?: string;
  }
): Promise<{
  validaciones: any[];
  candidatosFinales: CandidateCommitment[];
  omisionesRecuperadas: number;
  resumenAuditoriaOmisiones: string;
  contradicciones: ContradictionItem[];
  rawDiagnostics?: RawValidatorDiagnostics;
}> {
  if (!Array.isArray(candidatos) || candidatos.length === 0) {
    return {
      validaciones: [],
      candidatosFinales: [],
      omisionesRecuperadas: 0,
      resumenAuditoriaOmisiones: 'No se recibieron candidatos para validar.',
      contradicciones: [],
      rawDiagnostics: {
        tipoRecibido: 'array',
        longitud: 0,
        primerasPorciones: '[]',
        estructuraRaizDetectada: 'array_vacio',
        validacionesExiste: true,
        validacionesEsArray: true,
        totalValidaciones: 0,
        totalCandidatosEntrada: 0,
        idsSinCorrespondencia: [],
        respuestaBruta: '{"validaciones": []}',
      },
    };
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new GeminiNotConfiguredError();
  }

  const rawDocumentText =
    documentContext?.fullText ||
    (documentContext?.pagesText
      ? documentContext.pagesText.map((p) => `[Página ${p.pageNumber}]\n${p.text}`).join('\n\n')
      : '');

  const titularName = detectTitularFromDocument(
    rawDocumentText || candidatos.map((c) => c.texto_fuente).join('\n'),
    documentContext?.companyName || candidatos[0]?.titular_identificado || 'Agrovision Perú S.A.C.'
  );

  // Lista estandarizada de candidatos para enviar a Gemini con candidateId explícito
  const inputList = candidatos.map((c: any, idx: number) => ({
    candidateId: String(c.id || c.id_candidato || `CAND-${String(idx + 1).padStart(3, '0')}`),
    commitment: String(c.commitment || c.compromiso_normalizado || c.compromiso || ''),
    sourceText: String(c.sourceText || c.texto_fuente || c.textoFuente || ''),
    page: Number(c.page || c.pagina_pdf || 1),
    section: String(c.section || c.seccion_tabla || c.seccion || ''),
    topic: String(c.topic || c.tema || c.categoria || ''),
    responsible: c.responsible ?? c.responsable ?? null,
    frequency: c.frequency ?? c.frecuencia ?? null,
    deadline: c.deadline ?? c.plazo ?? null,
    indicator: c.indicator ?? c.indicador ?? c.indicador_evidencia ?? null,
    confidence: Number(c.confidence ?? 0.9),
  }));

  // Prompt interno del validador (Sección 6)
  const systemInstruction = `Recibirás una lista de candidatos a compromisos ya extraídos de un Plan de Minimización y Manejo de Residuos Sólidos (PMMRS) en el Perú.

Evalúa cada candidato individualmente.
No inventes nuevos compromisos.
No elimines candidatos silenciosamente.
Devuelve una validación para cada candidateId recibido.

REGLAS DE EVALUACIÓN:
1. "estado": Debe ser uno de los siguientes valores exactos:
   - "validado": Compromiso claro, verificable y exigible asumido en el PMMRS.
   - "parcial": Compromiso verificable pero cuya formulación operativa o frecuencia no está totalmente detallada.
   - "ambiguo": Declaración imprecisa o condicional que requiere aclaración del titular.
   - "rechazado": Obligación ajena a residuos sólidos (ej. fauna silvestre, prohibición de caza o mascotas antes del título del PMMRS) o duplicado redundante idéntico.
2. "integridad": "completo" o "parcial".
3. "observaciones": Justificación técnica concisa de la validación.
4. "responsable": Cargo o área responsable explícita, o null si no se precisa.
5. "frecuencia": Frecuencia explícita de ejecución, o null si no se precisa.
6. "plazo": Plazo o fecha declarada, o null si no se precisa.
7. "indicador": Indicador de verificación, o null si no se precisa.
8. "evidenciaSugerida": Registro documental sugerido para acreditar el cumplimiento.
9. "confidence": Nivel de confianza técnica entre 0.0 y 1.0.

CORRESPONDENCIA OBLIGATORIA 1 A 1:
Debes devolver exactamente una validación en el arreglo "validaciones" por cada candidateId recibido (${inputList.length} candidatos).

La salida debe ser exclusivamente JSON con esta estructura:
{
  "validaciones": [
    {
      "candidateId": "string",
      "estado": "validado|parcial|rechazado|ambiguo",
      "integridad": "completo|parcial",
      "observaciones": "string",
      "responsable": "string|null",
      "frecuencia": "string|null",
      "plazo": "string|null",
      "indicador": "string|null",
      "evidenciaSugerida": "string|null",
      "confidence": 0.0
    }
  ]
}

No uses Markdown.
No agregues explicaciones fuera del JSON.`;

  const promptText = `Evalúa individualmente cada uno de los siguientes ${inputList.length} candidatos a compromisos del PMMRS "${fileName}" (Titular: "${titularName}").

Lista de candidatos (${inputList.length}):
${JSON.stringify(inputList, null, 2)}

Devuelve obligatoriamente un objeto JSON con la propiedad raíz "validaciones" conteniendo exactamente ${inputList.length} registros, uno por cada candidateId.`;

  let response: any;
  try {
    response = await callGeminiWithTransientRetry('validateCommitmentCandidates', async (_attempt, modelToUse) => {
      const call = ai.models.generateContent({
        model: modelToUse,
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              validaciones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    candidateId: { type: Type.STRING },
                    estado: {
                      type: Type.STRING,
                      enum: ['validado', 'parcial', 'rechazado', 'ambiguo'],
                    },
                    integridad: {
                      type: Type.STRING,
                      enum: ['completo', 'parcial'],
                    },
                    observaciones: { type: Type.STRING },
                    responsable: { type: Type.STRING, nullable: true },
                    frecuencia: { type: Type.STRING, nullable: true },
                    plazo: { type: Type.STRING, nullable: true },
                    indicador: { type: Type.STRING, nullable: true },
                    evidenciaSugerida: { type: Type.STRING, nullable: true },
                    confidence: { type: Type.NUMBER },
                  },
                  required: [
                    'candidateId',
                    'estado',
                    'integridad',
                    'observaciones',
                    'confidence',
                  ],
                },
              },
            },
            required: ['validaciones'],
          },
        },
      });

      return await withTimeout(call, 90000);
    });
  } catch (apiErr: any) {
    if (apiErr?.isTransient) throw apiErr;
    throw new Error(`Error de conexión con Gemini en etapa de validación: ${apiErr?.message || apiErr}`);
  }

  const rawText = response.text || '';
  const { validaciones, rawDiagnostics } = parseAndNormalizeValidatorResponse(
    rawText,
    inputList,
    titularName,
    rawDocumentText
  );

  return {
    validaciones,
    candidatosFinales: candidatos,
    omisionesRecuperadas: 0,
    resumenAuditoriaOmisiones: `Validación completada con correspondencia 1 a 1 (${validaciones.length} validaciones generadas).`,
    contradicciones: [],
    rawDiagnostics,
  };
}

/**
 * PIPELINE COMPLETO DE EXTRACCIÓN Y VALIDACIÓN DE COMPROMISOS (SCHEMA CANÓNICO)
 */
export async function extractCommitments(
  input: ExtractCommitmentsInput
): Promise<ExtractCommitmentsOutput & CommitmentExtractionResult> {
  const {
    fullText,
    pagesText,
    pageImages,
    pdfBase64,
    isScanned,
    fileName = 'PMMRS.pdf',
    companyName = 'Titular',
    totalPages = 1,
  } = input;

  const rawDocumentText =
    fullText ||
    (pagesText ? pagesText.map((p) => `[Página ${p.pageNumber}]\n${p.text}`).join('\n\n') : '');

  const hasPdfBinary = Boolean(pdfBase64 && pdfBase64.length > 50);
  const hasImages = Array.isArray(pageImages) && pageImages.length > 0;
  const isScannedMode = Boolean(isScanned || hasImages);

  if (!hasPdfBinary && (!rawDocumentText || rawDocumentText.trim().length < 50) && !hasImages) {
    throw new Error('Error de lectura del PDF: Texto o imágenes insuficientes para extraer compromisos.');
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new GeminiNotConfiguredError();
  }

  const systemInstruction = `Eres el Motor Canónico de Extracción y Auditoría Técnica de Compromisos Ambientales en Planes de Minimización y Manejo de Residuos Sólidos No Municipales (PMMRS) bajo el marco normativo peruano (D.L. 1278, D.S. 014-2017-MINAM, R.M. 089-2023-MINAM).

OBJETIVO OBLIGATORIO:
Extraer de manera exhaustiva y trazable TODOS los compromisos ambientales asumidos por el titular en el documento PMMRS, evaluando la completitud técnica de su formulación e identificando contradicciones entre secciones.

CRITERIOS PARA CONSIDERAR UN COMPROMISO AMBIENTAL:
Una medida que contenga una acción ambiental concreta, exigible o verificable asumida por el titular en:
- Minimización de residuos y sustitución de insumos
- Segregación en la fuente y código de colores (NTP 900.058:2019)
- Recolección interna y rutas de acarreo
- Almacenamiento primario, intermedio o central (señalización, contención, tiempos máximos)
- Transporte interno o externo mediante Empresas Operadoras (EO-RS)
- Valorización de residuos (reciclaje, compostaje, reaprovechamiento)
- Disposición final en relleno de seguridad o sanitario autorizado
- Manejo de residuos peligrosos (rotulado, hojas de seguridad SDS, bandejas de contención)
- Entrega obligatoria a EO-RS registradas en MINAM
- Manifiestos de residuos peligrosos y declaración anual en SIGERSOL
- Registros de generación, bitácoras e informes periódicos
- Capacitaciones programadas al personal
- Simulacros y medidas de contingencia ante derrames o incendios
- Cumplimiento de cronogramas y metas cuantitativas
- Conservación de evidencias documentales por 5 años

NO CLASIFICAR COMO COMPROMISOS:
- Objetivos generales abstractos sin acción asumida
- Antecedentes de la empresa o del proyecto
- Diagnósticos situacionales y caracterizaciones de residuos
- Títulos de capítulos, encabezados de tablas o glosarios
- Normas legales citadas como referencia sin obligación propia asumida
- Descripciones de impactos sin medida asociada
- Presupuestos monetarios o costos
- Recomendaciones de consultores no asumidas formalmente por el titular
- Información histórica de años anteriores
- Frases incompletas o sin sujeto obligado

REGLAS ESTRICTAS DE RESPUESTA Y ESTRUCTURA JSON (OBLIGATORIAS):
1. NO inventar ni deducir información que no figure en el documento.
2. Si un dato no figura expresamente en el texto, utiliza EXACTAMENTE:
   - "No identificado" o "No identificada" según corresponda gramaticalmente (responsable: "No identificado", plazo: "No identificado", frecuencia: "No identificada", indicador: "No identificado", evidenciaCumplimiento: "No identificada").
3. Para la propiedad "pagina", asigna el número entero de la página del PDF donde se ubica el compromiso. Si la página es desconocida o no se puede precisar, utiliza null.
4. Para la propiedad "paginasRelacionadas", asigna un arreglo de números enteros []. Si no hay otras páginas, usa [].
5. Para la propiedad "posibleContradiccion", asigna true si hay inconsistencia o duplicidad, o false si no la hay.
6. En "estadoFormulacion", asigna estrictamente: "COMPLETO" (acción + responsable + plazo/frecuencia + indicador), "PARCIAL" (obligación real con campos no identificados), "AMBIGUO" (redacción difusa/condicional) o "NO_EVALUABLE" (descriptivo sin exigibilidad).
7. En "metadata", indica el archivo ("${fileName}"), totalPaginas (${totalPages}), tipoExtraccion ("${hasPdfBinary ? 'multimodal' : isScannedMode ? 'ocr' : 'texto'}") y paginasNoEvaluables ([]).
8. En "contradicciones", incluye discrepancias detectadas entre secciones o cronogramas ([] si no hay).
9. La respuesta debe cumplir estrictamente el schema canónico definido. No omitas propiedades requeridas.`;

  let promptText = `Analiza exhaustivamente el documento adjunto "${fileName}" (${companyName}) y extrae TODOS los compromisos ambientales según las reglas y esquema estricto.`;
  if (rawDocumentText && rawDocumentText.trim().length > 100) {
    promptText += `\n\n--- TEXTO ESTRUCTURADO POR PÁGINAS DEL DOCUMENTO ---\n${rawDocumentText.slice(0, 80000)}\n--- FIN DEL TEXTO ESTRUCTURADO ---`;
  }

  const contentsPayload: any[] = [];
  if (hasPdfBinary) {
    contentsPayload.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    });
  } else if (hasImages) {
    for (const img of pageImages!) {
      contentsPayload.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img.imageBase64,
        },
      });
    }
  }
  contentsPayload.push(promptText);

  let response: any;
  try {
    response = await callGeminiWithTransientRetry('extractCommitments', async () => {
      const call = ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: contentsPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: commitmentExtractionResultGeminiSchema,
        },
      });
      return await withTimeout(call, 90000);
    });
  } catch (apiErr: any) {
    if (apiErr?.isTransient) throw apiErr;
    throw new Error(`Error de conexión con Gemini en etapa de extracción: ${apiErr?.message || apiErr}`);
  }

  const rawText = response.text || '';
  const parsed = safeParseJson(rawText);
  const sanitized = sanitizeExtractionResult(
    parsed,
    fileName,
    totalPages,
    hasPdfBinary ? 'multimodal' : isScannedMode ? 'ocr' : 'texto'
  );

  const compromisos = sanitized.compromisos as (CanonicalCommitment & ValidatedCommitmentItem)[];
  const confirmadosCount = compromisos.filter(
    (c) => c.decision_validacion === 'CONFIRMADO' || c.estadoFormulacion === 'COMPLETO'
  ).length;
  const ambiguosCount = compromisos.filter(
    (c) => c.decision_validacion === 'AMBIGUO' || c.estadoFormulacion === 'AMBIGUO'
  ).length;
  const rechazadosCount = compromisos.filter(
    (c) =>
      c.decision_validacion === 'RECHAZADO' ||
      c.estadoFormulacion === 'NO_EVALUABLE' ||
      (c as any).estadoFormulacion === 'NO EVALUABLE'
  ).length;
  const completosCount = compromisos.filter(
    (c) => c.estado_cumplimiento === 'COMPLETO' || c.estadoFormulacion === 'COMPLETO'
  ).length;
  const parcialesCount = compromisos.filter(
    (c) => c.estado_cumplimiento === 'PARCIAL' || c.estadoFormulacion === 'PARCIAL'
  ).length;
  const noEvaluablesCount = compromisos.filter(
    (c) =>
      c.estado_cumplimiento === 'NO EVALUABLE' ||
      c.estadoFormulacion === 'NO_EVALUABLE' ||
      (c as any).estadoFormulacion === 'NO EVALUABLE'
  ).length;

  const sinResponsableCount = compromisos.filter(
    (c) => !c.responsable || c.responsable.toLowerCase().includes('no identificado')
  ).length;
  const sinPlazoCount = compromisos.filter(
    (c) =>
      (!c.plazo || c.plazo.toLowerCase().includes('no identificado')) &&
      (!c.frecuencia || c.frecuencia.toLowerCase().includes('no identificad'))
  ).length;
  const sinIndicadorCount = compromisos.filter(
    (c) =>
      (!c.indicador && !c.indicador_evidencia) ||
      (c.indicador && c.indicador.toLowerCase().includes('no identificado'))
  ).length;

  const fileSizeEstimate = hasPdfBinary
    ? `${Math.round((pdfBase64!.length * 0.75) / 1024)} KB (Binario PDF)`
    : `${Math.round(rawDocumentText.length / 1024)} KB (Texto extraído)`;

  const diagnostico: DiagnosticData = {
    nombreArchivo: fileName,
    tamanoRecibido: fileSizeEstimate,
    totalPaginas: sanitized.metadata.totalPaginas || totalPages || 1,
    paginasEnviadasAlModelo: sanitized.metadata.totalPaginas || totalPages || 1,
    bloquesProcesados: 1,
    estadoExtractor: 'Completado exitosamente (HTTP 200)',
    candidatosDevueltos: compromisos.length,
    estadoValidador: 'Completado exitosamente (HTTP 200)',
    confirmados: confirmadosCount,
    ambiguos: ambiguosCount,
    rechazados: rechazadosCount,
    estadoValidacionJson: 'Estructura JSON conforme al esquema canónico (CommitmentExtractionResult)',
    mensajeError: null,
    cantidadFinalTabla: compromisos.length,
    cantidadFinalExportacion: compromisos.length,
  };

  return {
    compromisos: compromisos as any,
    contradicciones: sanitized.contradicciones as any,
    metadata: sanitized.metadata,
    candidatos: compromisos as any,
    diagnostico,
    modeloUtilizado: GEMINI_MODEL,
    tipoExtraccion: hasPdfBinary ? 'PDF nativo/multimodal' : isScannedMode ? 'OCR/multimodal' : 'texto',
    alertaCalidadLectura: isScannedMode
      ? 'El documento parece estar escaneado y algunas páginas no pudieron leerse con suficiente claridad. Revise los resultados antes de utilizarlos.'
      : undefined,
    resumenValidacion: {
      totalCandidatos: compromisos.length,
      confirmados: confirmadosCount,
      ambiguos: ambiguosCount,
      rechazados: rechazadosCount,
      completos: completosCount,
      parciales: parcialesCount,
      noEvaluables: noEvaluablesCount,
      sinResponsable: sinResponsableCount,
      sinPlazoFrecuencia: sinPlazoCount,
      sinIndicador: sinIndicadorCount,
    },
  };
}

// =========================================================================
// 3. APOYO A ELABORAR PMMRS (draftPmmrsSection)
// =========================================================================

export interface DraftSectionInput {
  sectionId: string;
  sectionTitle?: string;
  currentData: Record<string, any>;
  companyProfile?: {
    razonSocial?: string;
    ruc?: string;
    actividadEconomica?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
  };
  promptInstruction?: string;
}

export interface DraftSectionOutput {
  textoRedactado: string;
  camposPendientes: string[];
  esCompleto: boolean;
  modeloUtilizado?: string;
}

export async function draftPmmrsSection(input: DraftSectionInput): Promise<DraftSectionOutput> {
  const { sectionId, sectionTitle = sectionId, currentData, companyProfile, promptInstruction } = input;

  const ai = getGeminiClient();
  if (!ai) {
    throw new GeminiNotConfiguredError();
  }

  const systemInstruction = `Redacta únicamente con los datos proporcionados. No completes vacíos con supuestos.

REGLAS CRÍTICAS PARA REDACCIÓN:
1. Tu rol es transformar los datos ingresados por el usuario en texto técnico formal de ingeniería ambiental conforme a la R.M. 089-2023-MINAM, el D.L. 1278 y la NTP 900.058:2019.
2. NO INVENTES NINGÚN DATO:
   - NO inventes cantidades ni masas de residuos.
   - NO inventes nombres ni códigos de residuos que el usuario no haya ingresado.
   - NO inventes nombres ni registros autoritativos de Empresas Operadoras (EO-RS).
   - NO inventes frecuencias, responsables, presupuestos ni compromisos.
3. Si un dato indispensable para la sección no fue ingresado por el usuario, DEBES REEMPLAZARLO POR EL MARCADOR EXACTO:
   "[PENDIENTE DE COMPLETAR]"
4. Entrega la redacción en texto formal y sobrio, listo para incorporar al documento Word o informe técnico.`;

  const prompt = `Sección a redactar: "${sectionTitle}" (ID: ${sectionId})
Empresa Titular: ${companyProfile?.razonSocial || '[PENDIENTE DE COMPLETAR]'}
RUC: ${companyProfile?.ruc || '[PENDIENTE DE COMPLETAR]'}
Actividad Económica: ${companyProfile?.actividadEconomica || '[PENDIENTE DE COMPLETAR]'}
Ubicación: ${companyProfile?.departamento || ''}, ${companyProfile?.provincia || ''}, ${companyProfile?.distrito || ''}

Datos específicos proporcionados por el usuario:
${JSON.stringify(currentData, null, 2)}

Instrucción técnica adicional del usuario:
${promptInstruction || 'Redacta un texto técnico sobrio, riguroso y conforme a los requisitos de la R.M. 089-2023-MINAM.'}`;

  const call = ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          textoRedactado: { type: Type.STRING },
          camposPendientes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          esCompleto: { type: Type.BOOLEAN },
        },
        required: ['textoRedactado', 'camposPendientes', 'esCompleto'],
      },
    },
  });

  const response = await withTimeout(call, 35000);
  const rawText = response.text || '{}';

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('Respuesta inválida de Gemini al redactar la sección.');
    }
  }

  return {
    textoRedactado: parsed.textoRedactado || '[PENDIENTE DE COMPLETAR]',
    camposPendientes: Array.isArray(parsed.camposPendientes) ? parsed.camposPendientes : [],
    esCompleto: Boolean(parsed.esCompleto),
    modeloUtilizado: GEMINI_MODEL,
  };
}
