import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  EmptyElement,
} from 'docx';
import { PmmrsData, AuditReport, CommitmentsMatrixReport } from '../types/pmrs';
import {
  createOfficialDocxHeader,
  createOfficialDocxFooter,
  getLogoUint8Array,
  APA7_MARGINS_TWIPS,
  LETTERHEAD_COLORS,
} from './letterheadConfig';

/**
 * Technical Styling Constants for Official Engineering Document
 * Standard: A4 (210 x 297 mm), Times New Roman / Arial typography.
 */
const FONT_FAMILY = 'Times New Roman';
const COLOR_TITLE = '0F172A'; // Slate 900
const COLOR_BODY = '1F2937'; // Slate 800 (clean technical black/charcoal)
const COLOR_ACCENT = '185844'; // Deep Emerald Green
const COLOR_MUTED = '64748B'; // Muted Slate
const COLOR_BORDER = 'CBD5E1'; // Soft border
const COLOR_HEADER_BG = '185844'; // Deep Emerald technical table header
const COLOR_ZEBRA_BG = 'F8FAFC'; // Soft row background

// 2.5 cm in twips = 1417 twips (1 cm = 567 twips)
const MARGIN_25MM = 1417;
const MARGIN_HEADER_FOOTER = 709; // 1.25 cm

/**
 * Generates an official, editable Word (.docx) document for the PMMRS
 * using EcoSerpentis Consulting institutional letterhead template on interior pages
 * and adhering strictly to R.M. N.º 089-2023-MINAM, D.L. N.º 1278 and D.S. N.º 014-2017-MINAM.
 */
export async function generatePmmrsDocx(data: PmmrsData): Promise<Blob> {
  const logoBytes = getLogoUint8Array();

  const doc = new Document({
    sections: [
      // =========================================================================
      // SECCIÓN 1: PÁGINA DE PORTADA PROFESIONAL CON LOGOTIPO CENTRADO
      // =========================================================================
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in twips
              height: 16838, // A4 height in twips
            },
            margin: {
              top: 1440, // 2.54 cm
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // 1. Logotipo oficial centrado en la parte superior
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 140 },
            children: [
              new ImageRun({
                data: logoBytes,
                type: 'png',
                transformation: { width: 110, height: 110 },
              }),
            ],
          }),

          // 2. Identidad corporativa y lema oficial institucional
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'ECOSERPENTIS CONSULTING PERÚ',
                bold: true,
                size: 26, // 13 pt
                color: LETTERHEAD_COLORS.titleGold,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 260 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: '“Año de la Esperanza y el Fortalecimiento de la Democracia”',
                italics: true,
                size: 19, // 9.5 pt
                color: LETTERHEAD_COLORS.lemaOlive,
              }),
            ],
          }),

          // 3. Título del Documento Centrado
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 120, line: 280 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'PLAN DE MINIMIZACIÓN Y MANEJO DE RESIDUOS SÓLIDOS NO MUNICIPALES',
                bold: true,
                size: 32, // 16 pt
                color: COLOR_TITLE,
              }),
            ],
          }),

          // 4. Subtítulo Contextual Normativo Centrado
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 320 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'Formulado conforme a la R.M. N.° 089-2023-MINAM, el D.L. N.° 1278 y el D.S. N.° 014-2017-MINAM',
                size: 21, // 10.5 pt
                color: COLOR_ACCENT,
                bold: true,
              }),
            ],
          }),

          // 5. Cuadro Técnico de Identificación del Titular y Proyecto
          createCoverMetadataTable(data),

          // 6. Pie de portada: Lugar y Año centrado
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 380, after: 40 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'LIMA – PERÚ',
                bold: true,
                size: 20, // 10 pt
                color: COLOR_MUTED,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: '2026',
                size: 18, // 9 pt
                color: COLOR_MUTED,
              }),
            ],
          }),
        ],
      },

      // =========================================================================
      // SECCIÓN 2: PÁGINAS INTERIORES CON PLANTILLA MEMBRETADA ECOSERPENTIS
      // =========================================================================
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in twips
              height: 16838, // A4 height in twips
            },
            margin: {
              top: APA7_MARGINS_TWIPS.top, // 1928 twips = 3.4 cm (área segura debajo del membrete)
              bottom: APA7_MARGINS_TWIPS.bottom, // 1587 twips = 2.8 cm (área segura sobre la curva)
              left: APA7_MARGINS_TWIPS.left, // 1440 twips = 2.54 cm
              right: APA7_MARGINS_TWIPS.right, // 1440 twips = 2.54 cm
              header: APA7_MARGINS_TWIPS.header, // 360 twips
              footer: APA7_MARGINS_TWIPS.footer, // 420 twips
            },
          },
        },
        headers: {
          default: createOfficialDocxHeader(logoBytes),
        },
        footers: {
          default: createOfficialDocxFooter(),
        },
        children: [
          // ==========================================
          // ÍNDICE GENERAL DEL CONTENIDO MÍNIMO
          // ==========================================
          createSectionHeader('ÍNDICE GENERAL DEL CONTENIDO MÍNIMO'),
          createIndexParagraph('1. Presentación e Introducción', '1'),
          createIndexParagraph('2. Objetivos del Plan (General y Específicos)', '2'),
          createIndexParagraph('3. Alcance del Plan', '3'),
          createIndexParagraph('4. Identificación, Características y Estimación de Residuos Sólidos', '4'),
          createIndexParagraph('5. Estrategias para la Prevención y/o Minimización', '5'),
          createIndexParagraph('6. Gestión y Manejo Operativo de Residuos Sólidos', '6'),
          createIndexParagraph('7. Descripción de las Medidas Ambientales', '7'),
          createIndexParagraph('8. Medidas de Atención ante Emergencias (Plan de Contingencias)', '8'),
          createIndexParagraph('9. Indicadores de Seguimiento y Control', '9'),
          createIndexParagraph('10. Cronograma de Implementación', '10'),
          createIndexParagraph('11. Presupuesto y Recursos Necesarios', '11'),
          createIndexParagraph('12. Funciones del Responsable de la Gestión de Residuos', '12'),
          createIndexParagraph('Firmas de Responsabilidad y Declaración de Veracidad', '13'),

          new Paragraph({ text: '', pageBreakBefore: true }),

          // ==========================================
          // SECCIÓN 1: PRESENTACIÓN E INTRODUCCIÓN
          // ==========================================
          createSectionHeader('1. PRESENTACIÓN E INTRODUCCIÓN'),
          createBodyParagraph(
            `El presente documento constituye el Plan de Minimización y Manejo de Residuos Sólidos No Municipales (PMMRS) correspondiente a la empresa ${data.generalInfo.razonSocial || '[Razón Social del Titular]'}, con R.U.C. N° ${data.generalInfo.ruc || '[Número de RUC]'}, formulado en estricto cumplimiento del Decreto Legislativo N° 1278 (Ley de Gestión Integral de Residuos Sólidos), su Reglamento aprobado mediante Decreto Supremo N° 014-2017-MINAM y la Resolución Ministerial N° 089-2023-MINAM, que aprueba la Guía para la Elaboración del Plan de Minimización y Manejo de Residuos Sólidos No Municipales.`
          ),
          createBodyParagraph(
            `Descripción General de la Operación: ${data.generalInfo.descripcionOperacion || '[Detalle de los procesos productivos o de servicios desarrollados en la instalación]'}. La vida útil proyectada de la operación corresponde a ${data.generalInfo.vidaUtilAnios || 20} años, abarcando las etapas operativas de: ${(data.generalInfo.etapasOperativas || []).join(', ')}.`
          ),

          // ==========================================
          // SECCIÓN 2: OBJETIVOS
          // ==========================================
          createSectionHeader('2. OBJETIVOS DEL PLAN'),
          createSubsectionHeader('2.1 Objetivo General'),
          createBodyParagraph(data.objetivos.general || '[Objetivo general orientado a la minimización y gestión ambiental de residuos no municipales]'),
          createSubsectionHeader('2.2 Objetivos Específicos'),
          ...(data.objetivos.especificos || []).map((obj) => createBulletParagraph(obj)),

          // ==========================================
          // SECCIÓN 3: ALCANCE DEL PLAN
          // ==========================================
          createSectionHeader('3. ALCANCE DEL PLAN'),
          createBodyParagraph(data.alcance.descripcion || '[Definición del alcance físico, operativo y de personal involucrado en el plan]'),
          createBodyParagraph(`Instalaciones y Áreas Comprendidas: ${(data.alcance.instalacionesComprendidas || []).join('; ') || 'Totalidad de las áreas operativas y administrativas de la sede'}.`),
          createBodyParagraph(`Personal y Terceros: Comprende al personal directo (${data.alcance.personalComprendido || 'personal propio'}) y a empresas contratistas (${data.alcance.contratistasComprendidos || 'contratistas y prestadores de servicios'}).`),

          // ==========================================
          // SECCIÓN 4: ESTIMACIÓN Y CARACTERIZACIÓN
          // ==========================================
          createSectionHeader('4. IDENTIFICACIÓN, CARACTERÍSTICAS Y ESTIMACIÓN DE RESIDUOS SÓLIDOS'),
          createBodyParagraph(
            'En el siguiente cuadro se detalla el balance cuantitativo y cualitativo de residuos generados en las instalaciones, categorizados según peligrosidad (Art. 30 del D.L. N° 1278) y codificados conforme al Convenio de Basilea (Anexos III y V del D.S. N° 014-2017-MINAM).'
          ),
          createWasteTable(data.inventarioResiduos),

          // ==========================================
          // SECCIÓN 5: ESTRATEGIAS DE MINIMIZACIÓN
          // ==========================================
          createSectionHeader('5. ESTRATEGIAS PARA LA PREVENCIÓN Y/O MINIMIZACIÓN'),
          createBodyParagraph(
            'De acuerdo con el principio de jerarquía de gestión de residuos establecido en el D.L. N° 1278, se establecen las medidas preventivas, de optimización y valorización en la fuente:'
          ),
          createMinimizationTable(data.estrategiasMinimizacion),

          // ==========================================
          // SECCIÓN 6: GESTIÓN Y MANEJO DE RESIDUOS
          // ==========================================
          createSectionHeader('6. GESTIÓN Y MANEJO OPERATIVO DE RESIDUOS SÓLIDOS'),
          createSubsectionHeader('6.1 Segregación en la Fuente y Código de Colores (NTP 900.058:2019)'),
          createBodyParagraph(data.gestionManejo.segregacion.descripcion || 'Se implementa la segregación en el punto de generación empleando recipientes rotulados y codificados conforme a la Norma Técnica Peruana NTP 900.058:2019 para el ámbito no municipal.'),
          createColorTable(data.gestionManejo.segregacion.colores),

          createSubsectionHeader('6.2 Almacenamiento Central de Residuos Peligrosos (Art. 54 D.S. 014-2017-MINAM)'),
          createBodyParagraph(
            `${data.gestionManejo.almacenamiento.centralPeligrosos.descripcion}. La infraestructura cuenta con piso impermeable, sistema de contención estanco contra derrames, ventilación cruzada, señalética de seguridad y kits antiderrames. Tiempo máximo de almacenamiento interno: hasta ${data.gestionManejo.almacenamiento.centralPeligrosos.tiempoMaximoMeses} meses (conforme al Art. 55 del D.S. 014-2017-MINAM).`
          ),

          createSubsectionHeader('6.3 Transporte Externo, Valorización y Disposición Final'),
          createBodyParagraph(
            `El transporte externo y retiro de residuos es ejecutado exclusivamente por Empresa Operadora de Residuos Sólidos (EO-RS) debidamente registrada ante el MINAM: "${data.gestionManejo.transporteExterno.nombreEORS}" (Registro MINAM: ${data.gestionManejo.transporteExterno.registroMINAM}, Habilitación MTC: ${data.gestionManejo.transporteExterno.autorizacionMTC}). Frecuencia de recojo: ${data.gestionManejo.transporteExterno.frecuenciaRecojo}. Disposición final efectuada en: ${data.gestionManejo.disposicionFinal.tipoInfraestructura} "${data.gestionManejo.disposicionFinal.nombrePlanta}" (Instrumento de Gestión Ambiental: ${data.gestionManejo.disposicionFinal.resolucionAprobacionIGA}), operado por ${data.gestionManejo.disposicionFinal.operadorResponsable}.`
          ),

          // ==========================================
          // SECCIÓN 7: MEDIDAS AMBIENTALES
          // ==========================================
          createSectionHeader('7. DESCRIPCIÓN DE LAS MEDIDAS AMBIENTALES'),
          createBodyParagraph('Matriz de medidas de prevención, control y mitigación ambiental asociadas a las operaciones de manejo de residuos sólidos:'),
          createEnvironmentalTable(data.medidasAmbientales),

          // ==========================================
          // SECCIÓN 8: CONTINGENCIAS Y EMERGENCIAS
          // ==========================================
          createSectionHeader('8. MEDIDAS DE ATENCIÓN ANTE EMERGENCIAS (PLAN DE CONTINGENCIAS)'),
          createBodyParagraph(
            `Conforme al Artículo 50 del D.S. N° 014-2017-MINAM, todo evento crítico, derrame o emergencia ambiental será reportado formalmente a OEFA dentro de un plazo improrrogable de ${data.planEmergencias.comunicacionAutoridadHoras} horas. Contacto designado para emergencias: ${data.planEmergencias.responsableEmergencia} (Teléfono: ${data.planEmergencias.telefonoEmergencia}).`
          ),
          createBodyParagraph(`Protocolo ante Derrames: ${data.planEmergencias.procedimientoDerrame}`),
          createBodyParagraph(`Protocolo ante Incendios: ${data.planEmergencias.procedimientoIncendio}`),

          // ==========================================
          // SECCIÓN 9: INDICADORES DE SEGUIMIENTO
          // ==========================================
          createSectionHeader('9. INDICADORES DE SEGUIMIENTO Y CONTROL'),
          createBodyParagraph('Indicadores técnicos para la medición y verificación del desempeño ambiental del plan:'),
          createIndicatorTable(data.indicadores),

          // ==========================================
          // SECCIÓN 10: CRONOGRAMA DE IMPLEMENTACIÓN
          // ==========================================
          createSectionHeader('10. CRONOGRAMA DE IMPLEMENTACIÓN'),
          createBodyParagraph('Programación temporal de las actividades operativas, de capacitación y monitoreo del PMMRS:'),
          createScheduleTable(data.cronograma),

          // ==========================================
          // SECCIÓN 11: PRESUPUESTO Y RECURSOS
          // ==========================================
          createSectionHeader('11. PRESUPUESTO Y RECURSOS NECESARIOS'),
          createBodyParagraph(
            'En cumplimiento del contenido mínimo de la R.M. N° 089-2023-MINAM, se presenta la estimación económica analítica desagregada por partida para la ejecución efectiva del plan:'
          ),
          createBudgetTable(data.presupuesto),

          // ==========================================
          // SECCIÓN 12: FUNCIONES DEL RESPONSABLE
          // ==========================================
          createSectionHeader('12. FUNCIONES DEL RESPONSABLE DE LA GESTIÓN DE RESIDUOS SÓLIDOS'),
          createBodyParagraph(
            `Profesional Designado: ${data.funcionesResponsable.nombres} | Cargo: ${data.funcionesResponsable.cargo} | Colegiatura: ${data.funcionesResponsable.cip} (${data.funcionesResponsable.profesion}).`
          ),
          ...(data.funcionesResponsable.funciones || []).map((f) => createBulletParagraph(f)),

          // ==========================================
          // FIRMAS TÉCNICAS Y REPRESENTACIÓN LEGAL
          // ==========================================
          new Paragraph({ text: '', spacing: { before: 600 } }),
          createSectionHeader('FIRMAS DE RESPONSABILIDAD TÉCNICA'),
          createBodyParagraph(
            'Los abajo firmantes declaran que la información técnica y los datos contenidos en el presente documento son verídicos, verificables y responden a las condiciones operativas de la instalación, asumiendo la responsabilidad conforme al marco normativo vigente.'
          ),
          new Paragraph({ text: '', spacing: { before: 400 } }),
          createSignaturesTable(data),
        ],
      },
    ],
  });

  // Desactiva la corrección ortográfica y gramatical automática por defecto (evita subrayados ondulados rojos en Word)
  if ((doc as any).Settings?.root) {
    (doc as any).Settings.root.push(new EmptyElement('w:hideSpellingErrors'));
    (doc as any).Settings.root.push(new EmptyElement('w:hideGrammaticalErrors'));
  }

  return await Packer.toBlob(doc);
}

/**
 * Helper: Cuadro Técnico de Identificación del Informe de Auditoría para la Portada
 */
function createAuditCoverMetadataTable(report: AuditReport): Table {
  const rows: [string, string][] = [
    ['ARCHIVO EVALUADO', `${report.nombreArchivo} (${report.totalPaginas} páginas, ${report.tamanoArchivoMB} MB)`],
    ['FECHA DE EVALUACIÓN', report.fechaEvaluacion || 'Octubre de 2026'],
    ['PUNTAJE TÉCNICO GLOBAL', `${report.puntajeGlobal}% de cumplimiento preliminar (${report.formulaPuntaje || ''})`],
    [
      'ESTADO GENERAL PRELIMINAR',
      report.puntajeGlobal >= 80
        ? 'CUMPLIMIENTO FAVORABLE (Observaciones menores subsanables)'
        : report.puntajeGlobal >= 60
        ? 'OBSERVADO (Requiere plan de adecuación y subsanación normativa)'
        : 'CRÍTICO (Incumplimientos normativos sustanciales detectados)',
    ],
    ['RESUMEN EJECUTIVO', report.resumenEjecutivo || 'Evaluación técnica documental contra los requisitos mínimos de la R.M. 089-2023-MINAM.'],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, val]) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [new TextRun({ font: FONT_FAMILY, text: label, bold: true, size: 18, color: COLOR_TITLE })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [new TextRun({ font: FONT_FAMILY, text: val, size: 18, color: COLOR_BODY })],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

/**
 * Generates an official Word (.docx) Audit Report for Módulo 2
 * with Section 1 (Professional Cover with centered logo)
 * and Section 2 (Interior pages with official EcoSerpentis Consulting letterhead header and footer).
 */
export async function generateAuditReportDocx(report: AuditReport): Promise<Blob> {
  const logoBytes = getLogoUint8Array();
  const doc = new Document({
    sections: [
      // =========================================================================
      // SECCIÓN 1: PÁGINA DE PORTADA PROFESIONAL CON LOGOTIPO CENTRADO
      // =========================================================================
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in twips
              height: 16838, // A4 height in twips
            },
            margin: {
              top: 1440, // 2.54 cm
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // 1. Logotipo oficial centrado en la parte superior
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 140 },
            children: [
              new ImageRun({
                data: logoBytes,
                type: 'png',
                transformation: { width: 110, height: 110 },
              }),
            ],
          }),

          // 2. Identidad corporativa y lema oficial institucional
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'ECOSERPENTIS CONSULTING PERÚ',
                bold: true,
                size: 26, // 13 pt
                color: LETTERHEAD_COLORS.titleGold,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 260 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: '“Año de la Esperanza y el Fortalecimiento de la Democracia”',
                italics: true,
                size: 19, // 9.5 pt
                color: LETTERHEAD_COLORS.lemaOlive,
              }),
            ],
          }),

          // 3. Título del Documento Centrado
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 120, line: 280 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'INFORME TÉCNICO DE EVALUACIÓN PRELIMINAR DE PMMRS',
                bold: true,
                size: 30, // 15 pt
                color: COLOR_TITLE,
              }),
            ],
          }),

          // 4. Subtítulo Contextual Normativo Centrado
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 320 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'AUDITORÍA DOCUMENTAL BAJO R.M. N.° 089-2023-MINAM, D.L. N.° 1278 Y NTP 900.058:2019',
                size: 21, // 10.5 pt
                color: COLOR_ACCENT,
                bold: true,
              }),
            ],
          }),

          // 5. Cuadro Técnico de Identificación del Informe
          createAuditCoverMetadataTable(report),

          // 6. Pie de portada: Lugar y Año centrado
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 380, after: 40 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'LIMA – PERÚ',
                bold: true,
                size: 20, // 10 pt
                color: COLOR_MUTED,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: '2026',
                size: 18, // 9 pt
                color: COLOR_MUTED,
              }),
            ],
          }),
        ],
      },

      // =========================================================================
      // SECCIÓN 2: PÁGINAS INTERIORES CON PLANTILLA MEMBRETADA ECOSERPENTIS
      // =========================================================================
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in twips
              height: 16838, // A4 height in twips
            },
            margin: {
              top: APA7_MARGINS_TWIPS.top, // 1928 twips = 3.4 cm (área segura debajo del membrete)
              bottom: APA7_MARGINS_TWIPS.bottom, // 1587 twips = 2.8 cm (área segura sobre la curva)
              left: APA7_MARGINS_TWIPS.left, // 1440 twips = 2.54 cm
              right: APA7_MARGINS_TWIPS.right, // 1440 twips = 2.54 cm
              header: APA7_MARGINS_TWIPS.header, // 360 twips
              footer: APA7_MARGINS_TWIPS.footer, // 420 twips
            },
          },
        },
        headers: {
          default: createOfficialDocxHeader(logoBytes),
        },
        footers: {
          default: createOfficialDocxFooter(),
        },
        children: [
          createSectionHeader('RESULTADOS DETALLADOS POR CRITERIO NORMATIVO'),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 60, after: 140 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: `El presente informe técnico expone los resultados de la evaluación documental efectuada al archivo «${report.nombreArchivo}», contrastando los requisitos técnicos establecidos en la Guía aprobada por la Resolución Ministerial N.° 089-2023-MINAM, el Decreto Legislativo N.° 1278 y la Norma Técnica Peruana NTP 900.058:2019.`,
                size: 20,
                color: COLOR_BODY,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  createHeaderCell('Req / Sección', 20),
                  createHeaderCell('Base Legal', 20),
                  createHeaderCell('Estado', 15),
                  createHeaderCell('Hallazgo / Evidencia Literal', 25),
                  createHeaderCell('Acción Correctiva', 20),
                ],
              }),
              ...report.criterios.map(
                (c) =>
                  new TableRow({
                    cantSplit: true,
                    children: [
                      createCell(`${c.id}\n${c.seccionTitulo}`, 20),
                      createCell(c.baseLegal, 20),
                      createCell(c.estado, 15, c.estado === 'Cumple' ? 'DCFCE7' : c.estado === 'Parcial' ? 'FEF9C3' : 'FEE2E2'),
                      createCell(`${c.hallazgoExplicacion}\n\n${c.evidenciaLiteral ? `Cita: "${c.evidenciaLiteral}" (${c.paginaOSeccion})` : ''}`, 25),
                      createCell(c.accionCorrectiva, 20),
                    ],
                  })
              ),
            ],
          }),

          ...(report.contradicciones && report.contradicciones.length > 0
            ? [
                new Paragraph({ text: '', spacing: { before: 200 } }),
                createSectionHeader('INCONSISTENCIAS Y CONTRADICCIONES INTERNAS DETECTADAS'),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      tableHeader: true,
                      children: [
                        createHeaderCell('Título de la Inconsistencia', 25),
                        createHeaderCell('Secciones Involucradas', 25),
                        createHeaderCell('Descripción y Citas', 30),
                        createHeaderCell('Recomendación Técnica', 20),
                      ],
                    }),
                    ...report.contradicciones.map((ct) =>
                      new TableRow({
                        cantSplit: true,
                        children: [
                          createCell(ct.titulo, 25),
                          createCell(ct.seccionesInvolucradas, 25),
                          createCell(`${ct.descripcion}\n\n${ct.citaLiteral1 || ''}\n${ct.citaLiteral2 || ''}`, 30),
                          createCell(ct.recomendacion, 20),
                        ],
                      })
                    ),
                  ],
                }),
              ]
            : []),

          new Paragraph({ text: '', spacing: { before: 240 } }),
          createSectionHeader('AVISO LEGAL Y ALCANCE DE LA AUDITORÍA PRELIMINAR'),
          new Paragraph({
            spacing: { before: 80, after: 120 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: `Aviso Legal: ${report.advertenciaLegal}`,
                italics: true,
                size: 18,
                color: COLOR_MUTED,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// =========================================================================
// HELPER FACTORIES: TEXT AND PARAGRAPH FORMATTERS
// =========================================================================

/**
 * Standard Body Paragraph: Arial 11 pt, justified, 1.5 line spacing, 6 pt space after.
 */
function createBodyParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 120, line: 360 }, // 120 twips = 6 pt; line 360 = 1.5
    children: [
      new TextRun({
        font: FONT_FAMILY,
        text,
        size: 22, // 11 pt
        color: COLOR_BODY,
      }),
    ],
  });
}

/**
 * Bulleted Paragraph: Arial 11 pt, justified, 1.5 line spacing, 4 pt space after.
 */
function createBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 80, line: 360 },
    children: [
      new TextRun({
        font: FONT_FAMILY,
        text,
        size: 22, // 11 pt
        color: COLOR_BODY,
      }),
    ],
  });
}

/**
 * Level 1 Section Header: Arial 12 pt bold, left-aligned, space before 12 pt, space after 6 pt, fine green underline.
 */
function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 }, // 240 twips = 12 pt; 120 twips = 6 pt
    keepNext: true,
    children: [
      new TextRun({
        font: FONT_FAMILY,
        text: title,
        bold: true,
        size: 24, // 12 pt
        color: COLOR_TITLE,
      }),
    ],
    border: {
      bottom: {
        color: COLOR_ACCENT,
        size: 6, // 0.75 pt fine line
        style: BorderStyle.SINGLE,
      },
    },
  });
}

/**
 * Level 2 Section Header: Arial 11 pt bold, left-aligned, space before 6 pt, space after 3 pt.
 */
function createSubsectionHeader(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 60 }, // 6 pt before, 3 pt after
    keepNext: true,
    children: [
      new TextRun({
        font: FONT_FAMILY,
        text: title,
        bold: true,
        size: 22, // 11 pt
        color: COLOR_TITLE,
      }),
    ],
  });
}

function createIndexParagraph(title: string, sec: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 40, after: 40, line: 280 },
    children: [
      new TextRun({ font: FONT_FAMILY, text: title, size: 20, color: COLOR_BODY }),
      new TextRun({ font: FONT_FAMILY, text: ` ............................................................................ Sección ${sec}`, color: COLOR_MUTED, size: 18 }),
    ],
  });
}

// =========================================================================
// HELPER FACTORIES: TECHNICAL TABLES
// =========================================================================

function createHeaderCell(text: string, widthPercent: number): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            font: FONT_FAMILY,
            text,
            bold: true,
            color: 'FFFFFF',
            size: 18, // 9 pt
          }),
        ],
      }),
    ],
  });
}

function createCell(text: string, widthPercent: number, bgHex?: string, isNumber: boolean = false): TableCell {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: bgHex ? { fill: bgHex, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: isNumber ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [
          new TextRun({
            font: FONT_FAMILY,
            text: text || '-',
            size: 18, // 9 pt
            color: COLOR_BODY,
          }),
        ],
      }),
    ],
  });
}

function createCoverMetadataTable(data: PmmrsData): Table {
  const ubicacion = [
    data.generalInfo.direccion,
    data.generalInfo.distrito,
    data.generalInfo.provincia,
    data.generalInfo.departamento,
  ]
    .filter(Boolean)
    .join(', ');

  const rows = [
    ['RAZÓN SOCIAL TITULAR', data.generalInfo.razonSocial || '[PENDIENTE DE COMPLETAR]'],
    ['NÚMERO DE R.U.C.', data.generalInfo.ruc || '[PENDIENTE DE COMPLETAR]'],
    ['ACTIVIDAD ECONÓMICA / CIIU', data.generalInfo.actividadEconomica ? `${data.generalInfo.actividadEconomica} (CIIU: ${data.generalInfo.ciiu || '[PENDIENTE DE COMPLETAR]'})` : '[PENDIENTE DE COMPLETAR]'],
    ['UBICACIÓN DE LA INSTALACIÓN', ubicacion || '[PENDIENTE DE COMPLETAR]'],
    ['COORDENADAS UTM (WGS84)', data.generalInfo.coordenadasUTM || '[PENDIENTE DE COMPLETAR]'],
    ['REPRESENTANTE LEGAL', data.generalInfo.representanteLegal ? `${data.generalInfo.representanteLegal} (DNI: ${data.generalInfo.dniRepresentante || '[PENDIENTE DE COMPLETAR]'})` : '[PENDIENTE DE COMPLETAR]'],
    ['RESPONSABLE TÉCNICO', data.generalInfo.responsableTecnico ? `${data.generalInfo.responsableTecnico} - ${data.generalInfo.profesionResponsable || 'Ingeniería'} (Reg. CIP: ${data.generalInfo.cipResponsable || '[PENDIENTE DE COMPLETAR]'})` : '[PENDIENTE DE COMPLETAR]'],
    ['FECHA DE FORMULACIÓN', new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()],
    ['AÑO DE EJECUCIÓN', '2026'],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, val]) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [new TextRun({ font: FONT_FAMILY, text: label, bold: true, size: 18, color: COLOR_TITLE })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [new TextRun({ font: FONT_FAMILY, text: val, size: 18, color: COLOR_BODY })],
                }),
              ],
            }),
          ],
        })
    ),
  });
}

function createWasteTable(wastes: PmmrsData['inventarioResiduos']): Table {
  let totalAnualTn = 0;
  wastes.forEach((w) => {
    const val = Number(w.cantidadAnual) || 0;
    if (w.unidad.includes('tn') || w.unidad.includes('t')) {
      totalAnualTn += val;
    } else {
      totalAnualTn += val / 1000;
    }
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('Residuo Sólido', 24),
          createHeaderCell('Etapa / Proceso', 20),
          createHeaderCell('Peligrosidad', 16),
          createHeaderCell('Cód. Basilea', 14),
          createHeaderCell('Masa Mensual', 13),
          createHeaderCell('Masa Anual', 13),
        ],
      }),
      ...wastes.map((w, idx) => {
        const bg = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
        return new TableRow({
          cantSplit: true,
          children: [
            createCell(w.nombre, 24, bg),
            createCell(`${w.etapa}\n(${w.procesoGenerador})`, 20, bg),
            createCell(`${w.clasificacionManejo}${w.caracteristicasPeligrosidad ? ` (${w.caracteristicasPeligrosidad})` : ''}`, 16, bg),
            createCell(w.codigoConvenioBasilea || 'N/A', 14, bg),
            createCell(`${w.cantidadMensual} ${w.unidad}`, 13, bg, true),
            createCell(`${w.cantidadAnual} ${w.unidad.includes('tn') ? 't/año' : 'kg/año'}`, 13, bg, true),
          ],
        });
      }),
      new TableRow({
        cantSplit: true,
        children: [
          createCell('TOTAL GENERACIÓN ESTIMADA (ANUAL)', 74, 'E2E8F0'),
          createCell('', 0, 'E2E8F0'),
          createCell('', 0, 'E2E8F0'),
          createCell('', 0, 'E2E8F0'),
          createCell('TOTAL:', 13, 'E2E8F0', true),
          createCell(`${totalAnualTn.toLocaleString('es-PE', { maximumFractionDigits: 3 })} t/año`, 13, 'E2E8F0', true),
        ],
      }),
    ],
  });
}

function createMinimizationTable(strats: PmmrsData['estrategiasMinimizacion']): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('Residuo / Proceso', 25),
          createHeaderCell('Estrategia', 20),
          createHeaderCell('Descripción de la Medida Operativa', 35),
          createHeaderCell('Meta de Reducción', 20),
        ],
      }),
      ...strats.map((s, idx) => {
        const bg = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
        return new TableRow({
          cantSplit: true,
          children: [
            createCell(`${s.residuoOProceso}\n(${s.etapa})`, 25, bg),
            createCell(s.tipoEstrategia, 20, bg),
            createCell(s.descripcionMedida, 35, bg),
            createCell(s.metaReduccion, 20, bg),
          ],
        });
      }),
    ],
  });
}

function createColorTable(colors: PmmrsData['gestionManejo']['segregacion']['colores']): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('Tipo de Residuo', 30),
          createHeaderCell('Color Oficial NTP 900.058:2019', 30),
          createHeaderCell('Ejemplos de Residuos Comprendidos', 40),
        ],
      }),
      ...colors.map((c, idx) => {
        const bg = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
        return new TableRow({
          cantSplit: true,
          children: [createCell(c.tipo, 30, bg), createCell(c.color, 30, bg), createCell(c.ejemplos, 40, bg)],
        });
      }),
    ],
  });
}

function createEnvironmentalTable(measures: PmmrsData['medidasAmbientales']): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('Etapa', 15),
          createHeaderCell('Componente', 20),
          createHeaderCell('Impacto / Riesgo', 25),
          createHeaderCell('Medida de Mitigación / Frecuencia', 40),
        ],
      }),
      ...measures.map((m, idx) => {
        const bg = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
        return new TableRow({
          cantSplit: true,
          children: [
            createCell(m.etapa, 15, bg),
            createCell(m.componenteAfectado, 20, bg),
            createCell(m.impactoRiesgo, 25, bg),
            createCell(`${m.medidaMitigacion}\n[Frecuencia: ${m.frecuenciaMonitoreo}]`, 40, bg),
          ],
        });
      }),
    ],
  });
}

function createIndicatorTable(indicators: PmmrsData['indicadores']): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('Nombre de Indicador', 25),
          createHeaderCell('Fórmula de Cálculo', 35),
          createHeaderCell('Meta', 20),
          createHeaderCell('Frecuencia / Verificación', 20),
        ],
      }),
      ...indicators.map((i, idx) => {
        const bg = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
        return new TableRow({
          cantSplit: true,
          children: [
            createCell(i.nombreIndicador, 25, bg),
            createCell(i.formulaCalculo, 35, bg),
            createCell(i.meta, 20, bg),
            createCell(`${i.frecuencia}\n(${i.medioVerificacion})`, 20, bg),
          ],
        });
      }),
    ],
  });
}

function createScheduleTable(schedule: PmmrsData['cronograma']): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('Actividad', 35),
          createHeaderCell('Etapa Operativa', 20),
          createHeaderCell('Plazo / Frecuencia', 25),
          createHeaderCell('Obligación Legal / Responsable', 20),
        ],
      }),
      ...schedule.map((sc, idx) => {
        const bg = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
        return new TableRow({
          cantSplit: true,
          children: [
            createCell(sc.actividad, 35, bg),
            createCell(sc.etapa, 20, bg),
            createCell(`${sc.plazo}\n(${sc.frecuencia})`, 25, bg),
            createCell(`${sc.obligacionLegalAsociada || '-'}\nResp: ${sc.responsable}`, 20, bg),
          ],
        });
      }),
    ],
  });
}

function createBudgetTable(budget: PmmrsData['presupuesto']): Table {
  let total = 0;
  budget.forEach((b) => (total += b.costoEstimadoPEN || 0));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createHeaderCell('Rubro Presupuestal', 25),
          createHeaderCell('Descripción de Recursos / Partida', 40),
          createHeaderCell('Fuente / Periodo', 20),
          createHeaderCell('Costo Estimado (S/)', 15),
        ],
      }),
      ...budget.map((b, idx) => {
        const bg = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
        return new TableRow({
          cantSplit: true,
          children: [
            createCell(b.rubro, 25, bg),
            createCell(b.descripcion, 40, bg),
            createCell(`${b.fuenteFinanciamiento} (${b.periodo})`, 20, bg),
            createCell(`S/ ${b.costoEstimadoPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 15, bg, true),
          ],
        });
      }),
      new TableRow({
        cantSplit: true,
        children: [
          createCell('TOTAL PRESUPUESTO ANUAL ASIGNADO', 65, 'E2E8F0'),
          createCell('', 0, 'E2E8F0'),
          createCell('RECURSOS PROPIOS', 20, 'E2E8F0'),
          createCell(`S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 15, 'E2E8F0', true),
        ],
      }),
    ],
  });
}

function createSignaturesTable(data: PmmrsData): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 200, bottom: 200, left: 140, right: 140 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ font: FONT_FAMILY, text: '______________________________________' })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [new TextRun({ font: FONT_FAMILY, text: data.generalInfo.representanteLegal || '[PENDIENTE DE COMPLETAR]', bold: true, size: 20 })],
              }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ font: FONT_FAMILY, text: `D.N.I. N° ${data.generalInfo.dniRepresentante || '[PENDIENTE DE COMPLETAR]'}`, size: 18 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ font: FONT_FAMILY, text: data.generalInfo.razonSocial || 'Empresa Titular', size: 18 })] }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 200, bottom: 200, left: 140, right: 140 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ font: FONT_FAMILY, text: '______________________________________' })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [new TextRun({ font: FONT_FAMILY, text: data.funcionesResponsable.nombres || '[PENDIENTE DE COMPLETAR]', bold: true, size: 20 })],
              }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ font: FONT_FAMILY, text: `Reg. CIP N° ${data.funcionesResponsable.cip || '[PENDIENTE DE COMPLETAR]'} (${data.funcionesResponsable.profesion || 'Ingeniería'})`, size: 18 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ font: FONT_FAMILY, text: data.funcionesResponsable.cargo || 'Responsable de Gestión Ambiental', size: 18 })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Generates an official, editable Word (.docx) document for the Commitments Matrix
 */
export async function generateCommitmentsDocx(report: CommitmentsMatrixReport): Promise<Blob> {
  const titularName = report.nombreTitular || 'TITULAR DE LA OPERACIÓN';
  const contradictions = report.compromisos.filter((c) => c.posibleContradiccion?.hayContradiccion);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 16838, // A4 Landscape width in twips
              height: 11906, // A4 Landscape height in twips
            },
            margin: {
              top: MARGIN_25MM,
              bottom: MARGIN_25MM,
              left: MARGIN_25MM,
              right: MARGIN_25MM,
              header: MARGIN_HEADER_FOOTER,
              footer: MARGIN_HEADER_FOOTER,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    font: FONT_FAMILY,
                    text: 'MATRIZ TÉCNICA DE COMPROMISOS DECLARADOS EN PMMRS · EcoSerpentis Consulting Perú',
                    size: 16,
                    color: COLOR_MUTED,
                    noProof: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    font: FONT_FAMILY,
                    text: 'Página ',
                    size: 16,
                    color: COLOR_MUTED,
                    noProof: true,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLOR_MUTED,
                    noProof: true,
                  }),
                  new TextRun({
                    font: FONT_FAMILY,
                    text: ' de ',
                    size: 16,
                    color: COLOR_MUTED,
                    noProof: true,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: COLOR_MUTED,
                    noProof: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 100, after: 120 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: 'MATRIZ DE COMPROMISOS DECLARADOS EN EL PMMRS',
                bold: true,
                size: 32,
                color: COLOR_TITLE,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 240 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: `Titular: ${titularName} · Proyecto/Archivo: ${report.nombreProyecto} (${report.archivoAnalizado}) · Fecha: ${report.fechaAnalisis}`,
                size: 20,
                color: COLOR_MUTED,
                bold: true,
              }),
            ],
          }),

          // Disclaimer note
          new Paragraph({
            spacing: { before: 60, after: 180 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: `Nota técnica de alcance: ${report.notaAlcance}`,
                italics: true,
                size: 17,
                color: COLOR_MUTED,
              }),
            ],
          }),

          // Summary box
          new Paragraph({
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({
                font: FONT_FAMILY,
                text: `Resumen de formulación: Total identificados: ${report.resumen.totalIdentificados} | Completos: ${report.resumen.completos} | Parciales: ${report.resumen.parciales} | Ambiguos: ${report.resumen.ambiguos} | Sin responsable: ${report.resumen.sinResponsable} | Sin plazo/frecuencia: ${report.resumen.sinPlazoFrecuencia} | Posibles contradicciones: ${report.resumen.conPosibleContradiccion}`,
                bold: true,
                size: 19,
                color: COLOR_BODY,
              }),
            ],
          }),

          // Commitments table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell('Cód.', 6),
                  createHeaderCell('Compromiso Declarado', 26),
                  createHeaderCell('Categoría / Etapa', 12),
                  createHeaderCell('Residuo / Proceso', 12),
                  createHeaderCell('Responsable', 10),
                  createHeaderCell('Plazo / Frecuencia', 10),
                  createHeaderCell('Indicador / Evidencia', 12),
                  createHeaderCell('Ubicación', 6),
                  createHeaderCell('Estado', 6),
                ],
              }),
              ...report.compromisos.map((c, idx) => {
                const bg = idx % 2 === 1 ? COLOR_ZEBRA_BG : undefined;
                return new TableRow({
                  children: [
                    createCell(c.id, 6, bg),
                    createCell(c.compromiso, 26, bg),
                    createCell(`${c.categoria}\n(${c.etapa})`, 12, bg),
                    createCell(`${c.residuoRelacionado}\n[${c.procesoActividad}]`, 12, bg),
                    createCell(c.responsable, 10, bg),
                    createCell(`${c.plazo}\n(${c.frecuencia})`, 10, bg),
                    createCell(`${c.indicador}\n${c.evidenciaCumplimiento}`, 12, bg),
                    createCell(c.pagina, 6, bg),
                    createCell(c.estadoFormulacion, 6, bg, true),
                  ],
                });
              }),
            ],
          }),

          // Contradictions section if any
          ...(contradictions.length > 0
            ? [
                new Paragraph({
                  spacing: { before: 300, after: 120 },
                  children: [
                    new TextRun({
                      font: FONT_FAMILY,
                      text: 'ALERTAS DE POSIBLES CONTRADICCIONES INTERNAS EN EL DOCUMENTO',
                      bold: true,
                      size: 24,
                      color: 'B91C1C',
                    }),
                  ],
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        createHeaderCell('Compromiso ID', 15),
                        createHeaderCell('Ubicación', 15),
                        createHeaderCell('Detalle de Inconsistencia Detectada', 45),
                        createHeaderCell('Compromiso Relacionado', 25),
                      ],
                    }),
                    ...contradictions.map((ct) =>
                      new TableRow({
                        children: [
                          createCell(ct.id, 15),
                          createCell(ct.pagina, 15),
                          createCell(ct.posibleContradiccion?.detalle || 'Posible discrepancia en redacción', 45),
                          createCell(
                            `${ct.posibleContradiccion?.compromisoRelacionadoId || '-'} (${ct.posibleContradiccion?.paginaRelacionada || ''})`,
                            25
                          ),
                        ],
                      })
                    ),
                  ],
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
