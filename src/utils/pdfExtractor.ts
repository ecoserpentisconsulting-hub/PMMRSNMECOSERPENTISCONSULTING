import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for Vite
try {
  // @ts-ignore
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/build/pdf.worker.min.mjs`;
    }
  }
} catch (e) {
  console.warn('No se pudo inicializar worker de PDF, se procesará en hilo principal:', e);
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  characterCount: number;
  paragraphs: string[];
  tablesOrLists: string[];
  requiresOcrOrManualReview: boolean;
  warning?: string;
}

export interface ScannedPageImage {
  pageNumber: number;
  imageBase64: string;
}

export interface PageBlock {
  blockIndex: number;
  startPage: number;
  endPage: number;
  overlapPage?: number;
  pages: ExtractedPage[];
  combinedText: string;
}

export interface PdfValidationReport {
  isValidPdf: boolean;
  totalPages: number;
  pagesAnalyzed: number;
  pagesWithWarnings: number[];
  pagesRequiringOcr: number[];
  warningsDetail: Array<{ pageNumber: number; reason: string }>;
  isScannedOrEmpty: boolean;
  errorMessage?: string;
}

export interface PdfExtractionResult {
  fileName: string;
  fileSizeBytes: number;
  totalPages: number;
  pages: ExtractedPage[];
  blocks: PageBlock[];
  fullText: string;
  isScannedOrEmpty: boolean;
  totalCharacters: number;
  tipoExtraccion: 'texto' | 'OCR/multimodal';
  validationReport: PdfValidationReport;
  scannedImages?: ScannedPageImage[];
}

/**
 * Convierte un objeto File a base64 limpio (sin prefijo data URL)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(new Error('No se pudo convertir el archivo a Base64: ' + err));
    reader.readAsDataURL(file);
  });
}

/**
 * Renderiza páginas de un PDF escaneado como imágenes JPEG para visión/OCR
 */
export async function renderPdfPagesAsImages(
  file: File,
  maxPages = 15
): Promise<ScannedPageImage[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/cmaps/`,
      cMapPacked: true,
    });
    const pdfDocument = await loadingTask.promise;
    const pagesToRender = Math.min(pdfDocument.numPages, maxPages);
    const result: ScannedPageImage[] = [];

    for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.25 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // @ts-ignore
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const base64 = dataUrl.split(',')[1];
          if (base64) {
            result.push({ pageNumber: pageNum, imageBase64: base64 });
          }
        }
      } catch (pageErr) {
        console.warn(`Error al renderizar página ${pageNum} de PDF:`, pageErr);
      }
    }
    return result;
  } catch (err) {
    console.warn('Error general al renderizar páginas escaneadas:', err);
    return [];
  }
}

/**
 * ETAPA 1 Y ETAPA 2: Validación e inspección estructurada del archivo PDF
 */
export async function extractTextFromPdfFile(
  file: File,
  onProgress?: (percent: number, etapa: string) => void
): Promise<PdfExtractionResult> {
  // Validación preliminar de tipo y cabecera
  if (!file) {
    throw new Error('No se proporcionó ningún archivo para procesar.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer.slice(0, 10));
  const headerStr = String.fromCharCode(...bytes);
  const isValidHeader = headerStr.includes('%PDF-');

  if (!isValidHeader && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('El archivo seleccionado no corresponde a un documento PDF válido.');
  }

  if (onProgress) onProgress(10, 'Validando estructura y cabecera del PDF...');

  let pdfDocument;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.3.289'}/cmaps/`,
      cMapPacked: true,
    });
    pdfDocument = await loadingTask.promise;
  } catch (err: any) {
    try {
      const fallbackTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      pdfDocument = await fallbackTask.promise;
    } catch (fallbackErr: any) {
      throw new Error(`El archivo PDF no pudo ser abierto o está protegido con contraseña: ${err?.message || err}`);
    }
  }

  const totalPages = pdfDocument.numPages;
  if (totalPages <= 0) {
    throw new Error('El documento PDF no contiene páginas válidas para analizar.');
  }

  if (onProgress) onProgress(25, `Leyendo documento (${totalPages} páginas identificadas)...`);

  const pages: ExtractedPage[] = [];
  const pagesWithWarnings: number[] = [];
  const pagesRequiringOcr: number[] = [];
  const warningsDetail: Array<{ pageNumber: number; reason: string }> = [];

  let fullText = '';
  let totalCharacters = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Reconocer líneas, párrafos y potenciales tablas
      const lines: string[] = [];
      let currentLine = '';
      let lastY: number | null = null;

      for (const item of textContent.items as any[]) {
        const str = item.str || '';
        const y = item.transform ? item.transform[5] : null;

        if (lastY !== null && y !== null && Math.abs(y - lastY) > 8) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = str;
        } else {
          currentLine += (currentLine ? ' ' : '') + str;
        }
        lastY = y;
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      const pageText = lines.join('\n').trim();
      const charCount = pageText.replace(/\s+/g, '').length;
      totalCharacters += charCount;

      // Detección de párrafos
      const paragraphs = pageText
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.length > 0);

      // Detección de tablas o listas (líneas que contienen separadores tabulares, fechas o viñetas)
      const tablesOrLists = lines.filter(
        (l) =>
          /^[-•*–\d+\.]\s/.test(l.trim()) ||
          l.includes('\t') ||
          (l.split(/\s{2,}/).length >= 3 && /\d/.test(l))
      );

      // Evaluación de legibilidad de la página
      let requiresOcr = false;
      let warningText: string | undefined = undefined;

      if (charCount < 40) {
        requiresOcr = true;
        pagesRequiringOcr.push(pageNum);
        pagesWithWarnings.push(pageNum);
        warningText = 'Página sin texto suficiente. Requiere OCR o revisión manual.';
        warningsDetail.push({
          pageNumber: pageNum,
          reason: 'Contenido textual inferior a 40 caracteres (posible imagen o escaneo). Requiere OCR o revisión manual.',
        });
      } else if (charCount < 100) {
        pagesWithWarnings.push(pageNum);
        warningText = 'Baja densidad de texto. Verificar posible tabla gráfica o fragmento escaneado.';
        warningsDetail.push({
          pageNumber: pageNum,
          reason: 'Densidad reducida de caracteres. Revise que la página no contenga gráficos no leídos.',
        });
      }

      pages.push({
        pageNumber: pageNum,
        text: pageText,
        characterCount: charCount,
        paragraphs,
        tablesOrLists,
        requiresOcrOrManualReview: requiresOcr,
        warning: warningText,
      });

      fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageText;

      if (onProgress) {
        const stepProgress = 25 + Math.round((pageNum / totalPages) * 35);
        onProgress(stepProgress, `Procesando página ${pageNum} de ${totalPages}...`);
      }
    } catch (pageErr: any) {
      console.warn(`Error al leer página ${pageNum}:`, pageErr);
      pagesWithWarnings.push(pageNum);
      pagesRequiringOcr.push(pageNum);
      warningsDetail.push({
        pageNumber: pageNum,
        reason: `No se pudo interpretar la página: ${pageErr?.message || 'Error de lectura'}. Requiere OCR o revisión manual.`,
      });
      pages.push({
        pageNumber: pageNum,
        text: '',
        characterCount: 0,
        paragraphs: [],
        tablesOrLists: [],
        requiresOcrOrManualReview: true,
        warning: 'Error en la lectura de la página. Requiere OCR o revisión manual.',
      });
    }
  }

  // Si el documento carece de texto suficiente en general
  const isScannedOrEmpty =
    totalCharacters < 120 || (totalPages > 2 && totalCharacters / totalPages < 25);

  // Segmentación en bloques con solapamiento de una página entre bloques
  const blockSize = 6;
  const blocks: PageBlock[] = [];
  let blockIndex = 1;

  for (let i = 0; i < pages.length; i += (blockSize - 1)) {
    const slice = pages.slice(i, i + blockSize);
    if (slice.length === 0) break;

    const startPage = slice[0].pageNumber;
    const endPage = slice[slice.length - 1].pageNumber;
    const overlapPage = i > 0 ? slice[0].pageNumber : undefined;

    const combinedText = slice
      .map((p) => `[Página ${p.pageNumber}${p.requiresOcrOrManualReview ? ' - Requiere OCR' : ''}]\n${p.text}`)
      .join('\n\n');

    blocks.push({
      blockIndex,
      startPage,
      endPage,
      overlapPage,
      pages: slice,
      combinedText,
    });

    blockIndex++;
    if (i + blockSize >= pages.length) break;
  }

  const validationReport: PdfValidationReport = {
    isValidPdf: true,
    totalPages,
    pagesAnalyzed: pages.length,
    pagesWithWarnings,
    pagesRequiringOcr,
    warningsDetail,
    isScannedOrEmpty,
  };

  if (onProgress) onProgress(65, 'Lectura y estructuración de bloques completada.');

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    totalPages,
    pages,
    blocks,
    fullText,
    isScannedOrEmpty,
    totalCharacters,
    tipoExtraccion: isScannedOrEmpty ? 'OCR/multimodal' : 'texto',
    validationReport,
  };
}
