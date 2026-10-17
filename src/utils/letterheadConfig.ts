import {
  Header,
  Footer,
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  ImageRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageNumber,
} from 'docx';
import type jsPDF from 'jspdf';
import { ECOSERPENTIS_LOGO_BASE64, ECOSERPENTIS_LOGO_DATA_URI } from './letterheadAssets';

/**
 * CONFIGURACIÓN OFICIAL DE HOJA MEMBRETADA ECOSERPENTIS CONSULTING & APA 7.ª EDICIÓN
 * Basada fielmente en "Hoja membretada.docx" y "Hoja membretada.pdf":
 * - Franja superior verde claro (#C4D9A0) con logotipo a la izquierda y derecha.
 * - Nombre "EcoSerpentis Consulting" en marrón dorado (#9E7B3B).
 * - Lema "Año de la Esperanza y el Fortalecimiento de la Democracia" en verde oliva cursiva (#4F6128).
 * - Área central blanca para contenido con márgenes de 2.54 cm (1 pulgada APA 7).
 * - Elemento gráfico curvo verde claro (#C4D9A0) en la parte inferior.
 * - Tipografía Times New Roman conforme a normas APA 7.ª edición.
 */

export const LETTERHEAD_COLORS = {
  headerBg: 'C4D9A0', // Verde claro pastel institucional
  titleGold: '9E7B3B', // Marrón dorado oficial
  lemaOlive: '4F6128', // Verde oliva profundo para el lema
  waveBg: 'C4D9A0', // Curva inferior verde claro
  textBody: '1F2937', // Charcoal APA 7 (#1F2937)
  textTitle: '0F172A', // Slate 900
  muted: '64748B', // Gris secundario
  apaTableLine: '334155', // Línea horizontal de tabla APA 7
  apaTableBg: 'F8FAFC',
};

export const LETTERHEAD_RGB = {
  headerBg: [196, 217, 160] as [number, number, number], // #C4D9A0
  titleGold: [158, 123, 59] as [number, number, number], // #9E7B3B
  lemaOlive: [79, 97, 40] as [number, number, number], // #4F6128
  waveBg: [196, 217, 160] as [number, number, number], // #C4D9A0
  textBody: [31, 41, 55] as [number, number, number],
  textTitle: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  apaTableLine: [51, 65, 85] as [number, number, number],
};

export const APA7_MARGINS_MM = {
  top: 34, // Espacio superior seguro debajo de la franja membretada (26mm + 8mm)
  bottom: 28, // Espacio inferior seguro sobre la curva gráfica (275mm)
  left: 25.4, // 1 pulgada = 2.54 cm exactos APA 7
  right: 25.4, // 1 pulgada = 2.54 cm exactos APA 7
  contentWidth: 159.2, // 210 - 25.4 - 25.4 mm
};

export const APA7_MARGINS_TWIPS = {
  top: 1928, // 3.4 cm
  bottom: 1587, // 2.8 cm
  left: 1440, // 2.54 cm (1 pulgada APA 7)
  right: 1440, // 2.54 cm (1 pulgada APA 7)
  header: 360, // Encabezado superior pegado a la franja
  footer: 420, // Pie de página sobre la franja inferior
};

/**
 * Convierte el Base64 del logotipo a Uint8Array para incrustarlo en Word (.docx)
 */
export function getLogoUint8Array(): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(ECOSERPENTIS_LOGO_BASE64, 'base64'));
  }
  const binaryString = atob(ECOSERPENTIS_LOGO_BASE64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Crea el Encabezado Oficial Membretado para Microsoft Word (.docx)
 * Reproduce fielmente la franja verde, los logotipos y la tipografía en marrón dorado y verde oliva.
 */
export function createOfficialDocxHeader(logoBytes: Uint8Array): Header {
  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };

  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: borderNone,
          bottom: borderNone,
          left: borderNone,
          right: borderNone,
          insideHorizontal: borderNone,
          insideVertical: borderNone,
        },
        rows: [
          new TableRow({
            children: [
              // 1. Logotipo izquierdo
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { fill: LETTERHEAD_COLORS.headerBg, type: ShadingType.CLEAR },
                borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: logoBytes,
                        type: 'png',
                        transformation: { width: 48, height: 48 },
                      }),
                    ],
                  }),
                ],
              }),

              // 2. Tipografía institucional central
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                shading: { fill: LETTERHEAD_COLORS.headerBg, type: ShadingType.CLEAR },
                borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 40, after: 30 },
                    children: [
                      new TextRun({
                        font: 'Times New Roman',
                        text: 'EcoSerpentis Consulting',
                        bold: true,
                        size: 30, // 15 pt en Word
                        color: LETTERHEAD_COLORS.titleGold,
                        noProof: true,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 40 },
                    children: [
                      new TextRun({
                        font: 'Times New Roman',
                        text: '“Año de la Esperanza y el Fortalecimiento de la Democracia”',
                        italics: true,
                        size: 18, // 9 pt en Word
                        color: LETTERHEAD_COLORS.lemaOlive,
                        noProof: true,
                      }),
                    ],
                  }),
                ],
              }),

              // 3. Logotipo derecho
              new TableCell({
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { fill: LETTERHEAD_COLORS.headerBg, type: ShadingType.CLEAR },
                borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: logoBytes,
                        type: 'png',
                        transformation: { width: 48, height: 48 },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Crea el Pie de Página Oficial con Franja Decorativa y Numeración APA 7 para Word (.docx)
 */
export function createOfficialDocxFooter(): Footer {
  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };

  return new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: borderNone,
          bottom: borderNone,
          left: borderNone,
          right: borderNone,
          insideHorizontal: borderNone,
          insideVertical: borderNone,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: LETTERHEAD_COLORS.waveBg, type: ShadingType.CLEAR },
                borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 80, after: 80 },
                    children: [
                      new TextRun({
                        font: 'Times New Roman',
                        text: 'EcoSerpentis Consulting · R.M. N.° 089-2023-MINAM · D.L. N.° 1278          Página ',
                        size: 17, // 8.5 pt
                        color: LETTERHEAD_COLORS.lemaOlive,
                        noProof: true,
                      }),
                      new TextRun({
                        font: 'Times New Roman',
                        children: [PageNumber.CURRENT],
                        size: 17,
                        color: LETTERHEAD_COLORS.lemaOlive,
                        bold: true,
                        noProof: true,
                      }),
                      new TextRun({
                        font: 'Times New Roman',
                        text: ' de ',
                        size: 17,
                        color: LETTERHEAD_COLORS.lemaOlive,
                        noProof: true,
                      }),
                      new TextRun({
                        font: 'Times New Roman',
                        children: [PageNumber.TOTAL_PAGES],
                        size: 17,
                        color: LETTERHEAD_COLORS.lemaOlive,
                        bold: true,
                        noProof: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Dibuja la Hoja Membretada Oficial EcoSerpentis en una página de jsPDF:
 * - Franja verde claro superior (#C4D9A0) con logotipo a izquierda y derecha.
 * - Título "EcoSerpentis Consulting" en marrón dorado (#9E7B3B).
 * - Lema institucional "Año de la Esperanza y el Fortalecimiento de la Democracia" (#4F6128).
 * - Curva inferior verde claro (#C4D9A0).
 * - Numeración de página APA 7 (Página X de Y).
 */
export function drawOfficialPdfLetterhead(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number
): void {
  // 1. Franja superior verde claro
  doc.setFillColor(LETTERHEAD_RGB.headerBg[0], LETTERHEAD_RGB.headerBg[1], LETTERHEAD_RGB.headerBg[2]);
  doc.rect(0, 0, 210, 26, 'F');

  // 2. Logotipos en alta resolución (izquierda y derecha con alias para optimización)
  try {
    doc.addImage(ECOSERPENTIS_LOGO_DATA_URI, 'PNG', 7, 3, 20, 20, 'ECOSERPENTIS_LOGO');
    doc.addImage(ECOSERPENTIS_LOGO_DATA_URI, 'PNG', 183, 3, 20, 20, 'ECOSERPENTIS_LOGO');
  } catch (err) {
    console.warn('Advertencia al renderizar logotipo en PDF:', err);
  }

  // 3. Tipografía oficial del encabezado
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(LETTERHEAD_RGB.titleGold[0], LETTERHEAD_RGB.titleGold[1], LETTERHEAD_RGB.titleGold[2]);
  doc.text('EcoSerpentis Consulting', 105, 13.5, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(LETTERHEAD_RGB.lemaOlive[0], LETTERHEAD_RGB.lemaOlive[1], LETTERHEAD_RGB.lemaOlive[2]);
  doc.text('“Año de la Esperanza y el Fortalecimiento de la Democracia”', 105, 20.5, { align: 'center' });

  // 4. Elemento gráfico curvo inferior verde claro (onda orgánica idéntica a la plantilla)
  doc.setFillColor(LETTERHEAD_RGB.waveBg[0], LETTERHEAD_RGB.waveBg[1], LETTERHEAD_RGB.waveBg[2]);
  doc.lines(
    [
      [70, -4, 140, -12, 210, -10], // Curva Bézier cúbica ascendente hacia la derecha (y: 278)
      [0, 19], // Baja a la esquina inferior derecha (x: 210, y: 297)
      [-210, 0], // Línea recta por la base hasta la esquina izquierda (x: 0, y: 297)
      [0, -9], // Cierra la figura en el punto inicial (x: 0, y: 288)
    ],
    0,
    288,
    [1, 1],
    'F',
    true
  );

  // 5. Numeración de página oficial APA 7
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(LETTERHEAD_RGB.lemaOlive[0], LETTERHEAD_RGB.lemaOlive[1], LETTERHEAD_RGB.lemaOlive[2]);
  doc.text(`Página ${pageNumber} de ${totalPages}`, 105, 293, { align: 'center' });
}
