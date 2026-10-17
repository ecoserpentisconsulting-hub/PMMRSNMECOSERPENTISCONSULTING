import * as XLSX from 'xlsx';
import { CommitmentsMatrixReport, PmmrsCommitment } from '../types/pmrs';

/**
 * Extrae el primer número de página de un valor de página PDF para ordenamiento.
 */
function parsePdfPageNumber(val: number | string | undefined): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const match = val.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return 9999;
}

/**
 * Normaliza un valor de texto asegurando que no quede vacío ni contenga artefactos técnicos.
 */
function cleanCellText(val: string | number | undefined | null, fallback = 'No identificado'): string {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  if (!str || str === '-' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
    return fallback;
  }
  return str;
}

/**
 * Formatea la evidencia sugerida para dejar claro que es una propuesta de verificación
 * y no un requisito textual del PMMRS.
 */
function formatSuggestedEvidence(raw: string | undefined): string {
  const cleaned = cleanCellText(raw, 'Evidencia sugerida: Registro documental o fotográfico de verificación.');
  if (cleaned.toLowerCase() === 'no identificado' || cleaned.toLowerCase() === 'no identificada') {
    return 'Evidencia sugerida: Registro documental o fotográfico de verificación.';
  }
  if (/^evidencia sugerida\s*:/i.test(cleaned)) {
    return cleaned;
  }
  return `Evidencia sugerida: ${cleaned}`;
}

/**
 * Filtra y ordena los compromisos incluidos en la matriz (excluyendo rechazados y descartados)
 * y asigna códigos secuenciales definitivos PMMRS-01, PMMRS-02, etc.
 */
export function getIncludedSortedCommitments(compromisos: PmmrsCommitment[]): PmmrsCommitment[] {
  const included = compromisos.filter(
    (c) => c.decision_validacion !== 'RECHAZADO' && c.estado_revision !== 'Descartado'
  );

  const sorted = [...included].sort((a, b) => {
    const pageA = parsePdfPageNumber(a.pagina_pdf);
    const pageB = parsePdfPageNumber(b.pagina_pdf);
    if (pageA !== pageB) return pageA - pageB;
    return (a.numero || 0) - (b.numero || 0);
  });

  return sorted.map((item, idx) => ({
    ...item,
    codigo: `PMMRS-${String(idx + 1).padStart(2, '0')}`,
  }));
}

/**
 * Nombre de archivo oficial reglamentario para descarga directa.
 */
export const COMMITMENTS_EXCEL_FILE_NAME = 'Matriz_Compromisos_PMMRS.xlsx';

/**
 * Nombre de archivo con metadatos contextuales del documento.
 */
export function buildCommitmentsExcelFileName(report: CommitmentsMatrixReport): string {
  return COMMITMENTS_EXCEL_FILE_NAME;
}

/**
 * Construye las filas de datos con las 15 columnas exactas requeridas por la especificación:
 * - Código
 * - Etapa
 * - Tema
 * - Tipo
 * - Compromiso normalizado
 * - Texto original / fuente
 * - Frecuencia o plazo
 * - Responsable
 * - Evidencia sugerida
 * - Página PDF
 * - Página impresa
 * - Sección / tabla
 * - Observaciones
 * - Estado de revisión
 * - Integridad
 */
export function buildCommitmentsExcelRows(report: CommitmentsMatrixReport): Record<string, string | number>[] {
  const allItems = Array.isArray(report.compromisos) ? report.compromisos : [];
  const includedItems = getIncludedSortedCommitments(allItems);
  const titularName = cleanCellText(report.nombreTitular, 'Titular del PMMRS');

  return includedItems.map((item, idx) => {
    const codigoDefinitivo = `PMMRS-${String(idx + 1).padStart(2, '0')}`;
    const etapaVal = cleanCellText(item.etapa, 'No identificado');
    const temaVal = cleanCellText(item.tema || item.categoria, 'No identificado');
    const tipoVal = cleanCellText(item.tipo, 'Medida operativa');
    const compromisoNormVal = cleanCellText(
      item.compromiso_normalizado || item.compromiso,
      'No identificado'
    );
    const textoFuenteVal = cleanCellText(item.texto_fuente || item.textoFuente, 'No identificado');

    // Frecuencia o plazo
    let frecPlazoVal = cleanCellText(item.frecuencia_plazo, '');
    if (!frecPlazoVal || frecPlazoVal === 'No identificado') {
      const f = cleanCellText(item.frecuencia, 'No identificado');
      const p = cleanCellText(item.plazo, 'No identificado');
      if (f !== 'No identificado' && f !== 'No identificada' && p !== 'No identificado') {
        frecPlazoVal = f.toLowerCase() === p.toLowerCase() ? f : `${f} (${p})`;
      } else if (f !== 'No identificado' && f !== 'No identificada') {
        frecPlazoVal = f;
      } else if (p !== 'No identificado') {
        frecPlazoVal = p;
      } else {
        frecPlazoVal = 'Frecuencia no precisada';
      }
    }

    const responsableVal = cleanCellText(item.responsable, titularName);
    const evidenciaSugeridaVal = formatSuggestedEvidence(
      item.evidencia_sugerida || item.indicador_evidencia || item.indicador
    );
    const paginaPdfVal =
      item.pagina_pdf !== undefined && item.pagina_pdf !== null
        ? String(item.pagina_pdf)
        : 'No identificado';
    const paginaImpresaVal = cleanCellText(item.pagina_impresa, 'No identificado');
    const seccionTablaVal = cleanCellText(item.seccion_tabla || item.seccion, 'No identificado');

    let obsVal = cleanCellText(
      item.observaciones || item.observacion,
      'El PMMRS no identifica un cargo o área responsable específica.'
    );
    if (item.estado_revision === 'Pendiente' && !obsVal.toLowerCase().includes('pendiente de validación')) {
      obsVal = `Pendiente de validación. ${obsVal}`;
    }

    const estadoRevisionVal = cleanCellText(item.estado_revision, 'Validado');
    const integridadVal = cleanCellText(item.integridad_registro, 'Completo');

    return {
      'Código': codigoDefinitivo,
      'Etapa': etapaVal,
      'Tema': temaVal,
      'Tipo': tipoVal,
      'Compromiso normalizado': compromisoNormVal,
      'Texto original / fuente': textoFuenteVal,
      'Frecuencia o plazo': frecPlazoVal,
      'Responsable': responsableVal,
      'Evidencia sugerida': evidenciaSugeridaVal,
      'Página PDF': paginaPdfVal,
      'Página impresa': paginaImpresaVal,
      'Sección / tabla': seccionTablaVal,
      'Observaciones': obsVal,
      'Estado de revisión': estadoRevisionVal,
      'Integridad': integridadVal,
    };
  });
}

/**
 * Crea el workbook SheetJS con hoja principal "Compromisos" y hoja opcional "Resumen"
 */
export function createCommitmentsWorkbook(report: CommitmentsMatrixReport): XLSX.WorkBook {
  const rows = buildCommitmentsExcelRows(report);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Anchos de columna optimizados para visualización profesional sin texto truncado
  worksheet['!cols'] = [
    { wch: 14 }, // Código
    { wch: 28 }, // Etapa
    { wch: 30 }, // Tema
    { wch: 22 }, // Tipo
    { wch: 55 }, // Compromiso normalizado
    { wch: 55 }, // Texto original / fuente
    { wch: 26 }, // Frecuencia o plazo
    { wch: 28 }, // Responsable
    { wch: 45 }, // Evidencia sugerida
    { wch: 12 }, // Página PDF
    { wch: 14 }, // Página impresa
    { wch: 28 }, // Sección / tabla
    { wch: 45 }, // Observaciones
    { wch: 20 }, // Estado de revisión
    { wch: 18 }, // Integridad
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Compromisos');

  // Hoja 2: Resumen ejecutivo del PMMRS
  const allItems = Array.isArray(report.compromisos) ? report.compromisos : [];
  const includedItems = getIncludedSortedCommitments(allItems);
  const totalEvaluados =
    report.candidatosEvaluadosTotal ||
    report.candidatosExtraidosTotal ||
    allItems.length;
  const validadosCount = includedItems.filter(
    (c) => (c.estado_revision || 'Validado') === 'Validado'
  ).length;
  const editadosCount = includedItems.filter((c) => c.estado_revision === 'Editado').length;
  const pendientesCount = includedItems.filter((c) => c.estado_revision === 'Pendiente').length;
  const descartadosCount = allItems.filter(
    (c) => c.estado_revision === 'Descartado' || c.decision_validacion === 'RECHAZADO'
  ).length;

  const resumenData = [
    { Indicador: 'Documento procesado', Valor: cleanCellText(report.archivoAnalizado, 'PMMRS.pdf') },
    { Indicador: 'Titular de la actividad', Valor: cleanCellText(report.nombreTitular, 'Titular PMMRS') },
    { Indicador: 'Fecha de análisis', Valor: cleanCellText(report.fechaAnalisis, new Date().toLocaleDateString('es-PE')) },
    { Indicador: 'Total de páginas analizadas', Valor: report.totalPaginas || 12 },
    { Indicador: 'Candidatos evaluados', Valor: totalEvaluados },
    { Indicador: 'Compromisos incluidos en la matriz', Valor: includedItems.length },
    { Indicador: 'Compromisos validados', Valor: validadosCount },
    { Indicador: 'Compromisos editados', Valor: editadosCount },
    { Indicador: 'Compromisos pendientes de validación', Valor: pendientesCount },
    { Indicador: 'Compromisos descartados / no aplicables', Valor: descartadosCount },
  ];

  const wsResumen = XLSX.utils.json_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 38 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

  return workbook;
}

/**
 * Genera el ArrayBuffer binario real .xlsx compatible con Microsoft Excel, LibreOffice y Google Sheets.
 */
export async function generateCommitmentsExcelBuffer(report: CommitmentsMatrixReport): Promise<ArrayBuffer> {
  const workbook = createCommitmentsWorkbook(report);
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });
  return excelBuffer as ArrayBuffer;
}

/**
 * Genera un Blob XLSX con el MIME type reglamentario y validación de tamaño > 0.
 */
export function generateCommitmentsExcelBlob(report: CommitmentsMatrixReport): Blob {
  const workbook = createCommitmentsWorkbook(report);
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if (!blob || blob.size === 0) {
    throw new Error('Error al generar el archivo Excel: el archivo resultante tiene tamaño cero.');
  }

  return blob;
}

/**
 * Ejecuta la descarga segura en navegador tras validar que existan filas y datos válidos.
 */
export function downloadCommitmentsExcel(report: CommitmentsMatrixReport): { ok: boolean; count: number; error?: string } {
  const allItems = Array.isArray(report.compromisos) ? report.compromisos : [];
  const included = getIncludedSortedCommitments(allItems);

  if (included.length === 0) {
    return {
      ok: false,
      count: 0,
      error: 'La matriz no contiene compromisos válidos para exportar. Verifique que existan compromisos incluidos.',
    };
  }

  try {
    const blob = generateCommitmentsExcelBlob(report);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', COMMITMENTS_EXCEL_FILE_NAME);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { ok: true, count: included.length };
  } catch (err: any) {
    console.error('Error al exportar archivo Excel:', err);
    return {
      ok: false,
      count: included.length,
      error: err?.message || 'Error técnico al generar el archivo Excel.',
    };
  }
}
