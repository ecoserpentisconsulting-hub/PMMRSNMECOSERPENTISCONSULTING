import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PmmrsData, AuditReport, CommitmentsMatrixReport } from '../types/pmrs';
import {
  drawOfficialPdfLetterhead,
  APA7_MARGINS_MM,
  LETTERHEAD_RGB,
  LETTERHEAD_COLORS,
} from './letterheadConfig';
import { ECOSERPENTIS_LOGO_DATA_URI } from './letterheadAssets';

/**
 * Technical Styling Constants for Official Engineering Document
 * Standard: A4 (210 x 297 mm), APA 7th edition / EcoSerpentis institutional design.
 */
const COLOR_TITLE: [number, number, number] = [15, 23, 42]; // #0F172A
const COLOR_BODY: [number, number, number] = [31, 41, 55]; // #1F2937
const COLOR_ACCENT: [number, number, number] = [24, 88, 68]; // #185844 Deep Emerald Green
const COLOR_MUTED: [number, number, number] = [100, 116, 139]; // #64748B
const COLOR_BORDER: [number, number, number] = [203, 213, 225]; // #CBD5E1

const MARGIN_LEFT = APA7_MARGINS_MM.left; // 25.4 mm (1 pulgada APA 7)
const MARGIN_RIGHT = APA7_MARGINS_MM.right; // 25.4 mm (1 pulgada APA 7)
const MARGIN_TOP = APA7_MARGINS_MM.top; // 34 mm (área segura debajo de la franja superior de 26 mm)
const MARGIN_BOTTOM = APA7_MARGINS_MM.bottom; // 28 mm (área segura sobre la curva inferior de 278 mm)
const CONTENT_WIDTH = 210 - MARGIN_LEFT - MARGIN_RIGHT; // 159.2 mm

/**
 * Generate PDF for PMMRS Document using EcoSerpentis Consulting official letterhead
 */
export function generatePmmrsPdf(data: PmmrsData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const titularName = data.generalInfo.razonSocial || 'TITULAR DE LA OPERACIÓN';

  // ==========================================
  // PÁGINA 1: PORTADA TÉCNICA PROFESIONAL CON LOGOTIPO CENTRADO
  // ==========================================
  // 1. Logotipo oficial centrado en la parte superior
  try {
    doc.addImage(ECOSERPENTIS_LOGO_DATA_URI, 'PNG', 86, 20, 38, 38, 'ECOSERPENTIS_COVER_LOGO');
  } catch (err) {
    console.warn('Advertencia al renderizar logotipo en portada de PDF:', err);
  }

  // 2. Identidad corporativa institucional centrada
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(LETTERHEAD_RGB.titleGold[0], LETTERHEAD_RGB.titleGold[1], LETTERHEAD_RGB.titleGold[2]);
  doc.text('ECOSERPENTIS CONSULTING PERÚ', 105, 64, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(LETTERHEAD_RGB.lemaOlive[0], LETTERHEAD_RGB.lemaOlive[1], LETTERHEAD_RGB.lemaOlive[2]);
  doc.text('“Año de la Esperanza y el Fortalecimiento de la Democracia”', 105, 69.5, { align: 'center' });

  // 3. Título del Documento Centrado
  doc.setFont('times', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(COLOR_TITLE[0], COLOR_TITLE[1], COLOR_TITLE[2]);
  doc.text('PLAN DE MINIMIZACIÓN Y MANEJO', 105, 80, { align: 'center' });
  doc.text('DE RESIDUOS SÓLIDOS NO MUNICIPALES', 105, 87, { align: 'center' });

  // Línea decorativa verde esmeralda
  doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.setLineWidth(0.7);
  doc.line(60, 91.5, 150, 91.5);

  // 4. Subtítulo Contextual Normativo Centrado
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.text(
    'Formulado conforme a la R.M. N.° 089-2023-MINAM, el D.L. N.° 1278 y el D.S. N.° 014-2017-MINAM',
    105,
    97.5,
    { align: 'center' }
  );

  const ubicacion = [
    data.generalInfo.direccion,
    data.generalInfo.distrito,
    data.generalInfo.provincia,
    data.generalInfo.departamento,
  ]
    .filter(Boolean)
    .join(', ');

  // 5. Cuadro Técnico de Identificación del Titular y Proyecto
  autoTable(doc, {
    startY: 104,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 8.5,
      cellPadding: 3.2,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      textColor: COLOR_BODY,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: {
        cellWidth: 55,
        fillColor: [241, 245, 249],
        fontStyle: 'bold',
        textColor: COLOR_TITLE,
      },
      1: {
        cellWidth: 104.2,
        fillColor: [255, 255, 255],
      },
    },
    body: [
      ['RAZÓN SOCIAL TITULAR', data.generalInfo.razonSocial || '[PENDIENTE DE COMPLETAR]'],
      ['NÚMERO DE R.U.C.', data.generalInfo.ruc || '[PENDIENTE DE COMPLETAR]'],
      ['ACTIVIDAD ECONÓMICA / CIIU', data.generalInfo.actividadEconomica ? `${data.generalInfo.actividadEconomica} (CIIU: ${data.generalInfo.ciiu || '[PENDIENTE DE COMPLETAR]'})` : '[PENDIENTE DE COMPLETAR]'],
      ['UBICACIÓN DE LA INSTALACIÓN', ubicacion || '[PENDIENTE DE COMPLETAR]'],
      ['COORDENADAS UTM (WGS84)', data.generalInfo.coordenadasUTM || '[PENDIENTE DE COMPLETAR]'],
      ['REPRESENTANTE LEGAL', data.generalInfo.representanteLegal ? `${data.generalInfo.representanteLegal} (DNI: ${data.generalInfo.dniRepresentante || '[PENDIENTE DE COMPLETAR]'})` : '[PENDIENTE DE COMPLETAR]'],
      ['RESPONSABLE TÉCNICO', data.generalInfo.responsableTecnico ? `${data.generalInfo.responsableTecnico} - ${data.generalInfo.profesionResponsable || 'Ingeniería'} (Reg. CIP: ${data.generalInfo.cipResponsable || '[PENDIENTE DE COMPLETAR]'})` : '[PENDIENTE DE COMPLETAR]'],
      ['FECHA DE FORMULACIÓN', new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()],
      ['AÑO DE EJECUCIÓN', '2026'],
    ],
  });

  // 6. Pie de portada: Lugar y Año centrado
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('LIMA – PERÚ', 105, 276, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.text('2026', 105, 281, { align: 'center' });

  // ==========================================
  // SALTO DE PÁGINA (PAGE BREAK): PÁGINA 2 COMIENZA EL CONTENIDO PRINCIPAL
  // ==========================================
  doc.addPage();
  let currentY = MARGIN_TOP;

  const addSectionTitle = (title: string) => {
    if (currentY > 255) {
      doc.addPage();
      currentY = MARGIN_TOP;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLOR_TITLE[0], COLOR_TITLE[1], COLOR_TITLE[2]);
    doc.text(title, MARGIN_LEFT, currentY);

    // Fine green line underneath
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setLineWidth(0.4);
    doc.line(MARGIN_LEFT, currentY + 2, 210 - MARGIN_RIGHT, currentY + 2);

    currentY += 8;
  };

  const addSubsectionTitle = (title: string) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = MARGIN_TOP;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(COLOR_TITLE[0], COLOR_TITLE[1], COLOR_TITLE[2]);
    doc.text(title, MARGIN_LEFT, currentY);
    currentY += 6;
  };

  const addParagraph = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR_BODY[0], COLOR_BODY[1], COLOR_BODY[2]);
    const splitText = doc.splitTextToSize(text, CONTENT_WIDTH);
    if (currentY + splitText.length * 4.6 > 265) {
      doc.addPage();
      currentY = MARGIN_TOP;
    }
    doc.text(splitText, MARGIN_LEFT, currentY);
    currentY += splitText.length * 4.6 + 3.5;
  };

  const addBullet = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR_BODY[0], COLOR_BODY[1], COLOR_BODY[2]);
    const bulletText = `•   ${text}`;
    const splitText = doc.splitTextToSize(bulletText, CONTENT_WIDTH - 4);
    if (currentY + splitText.length * 4.6 > 265) {
      doc.addPage();
      currentY = MARGIN_TOP;
    }
    doc.text(splitText, MARGIN_LEFT + 2, currentY);
    currentY += splitText.length * 4.6 + 2.5;
  };

  // ÍNDICE
  addSectionTitle('ÍNDICE GENERAL DEL CONTENIDO MÍNIMO');
  const indexItems = [
    ['1. Presentación e Introducción', 'Sección 1'],
    ['2. Objetivos del Plan (General y Específicos)', 'Sección 2'],
    ['3. Alcance del Plan', 'Sección 3'],
    ['4. Identificación, Características y Estimación de Residuos Sólidos', 'Sección 4'],
    ['5. Estrategias para la Prevención y/o Minimización', 'Sección 5'],
    ['6. Gestión y Manejo Operativo de Residuos Sólidos', 'Sección 6'],
    ['7. Descripción de las Medidas Ambientales', 'Sección 7'],
    ['8. Medidas de Atención ante Emergencias (Plan de Contingencias)', 'Sección 8'],
    ['9. Indicadores de Seguimiento y Control', 'Sección 9'],
    ['10. Cronograma de Implementación', 'Sección 10'],
    ['11. Presupuesto y Recursos Necesarios', 'Sección 11'],
    ['12. Funciones del Responsable de la Gestión de Residuos', 'Sección 12'],
    ['Firmas de Responsabilidad Técnica y Declaración de Veracidad', 'Final'],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5, textColor: COLOR_BODY, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 129.2 },
      1: { cellWidth: 30, halign: 'right', textColor: COLOR_MUTED },
    },
    body: indexItems,
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // ==========================================
  // SECCIÓN 1: PRESENTACIÓN E INTRODUCCIÓN
  // ==========================================
  addSectionTitle('1. PRESENTACIÓN E INTRODUCCIÓN');
  addParagraph(
    `El presente documento constituye el Plan de Minimización y Manejo de Residuos Sólidos No Municipales (PMMRS) correspondiente a la empresa ${data.generalInfo.razonSocial || '[Razón Social]'}, con R.U.C. N° ${data.generalInfo.ruc || '[RUC]'}, formulado en estricto cumplimiento del Decreto Legislativo N° 1278 (Ley de Gestión Integral de Residuos Sólidos), su Reglamento aprobado por Decreto Supremo N° 014-2017-MINAM y la Resolución Ministerial N° 089-2023-MINAM.`
  );
  addParagraph(
    `Descripción General de la Operación: ${data.generalInfo.descripcionOperacion || '[Detalle operativo]'}. La vida útil proyectada de la operación corresponde a ${data.generalInfo.vidaUtilAnios || 20} años, abarcando las etapas operativas de: ${(data.generalInfo.etapasOperativas || []).join(', ')}.`
  );

  // ==========================================
  // SECCIÓN 2: OBJETIVOS
  // ==========================================
  addSectionTitle('2. OBJETIVOS DEL PLAN');
  addSubsectionTitle('2.1 Objetivo General');
  addParagraph(data.objetivos.general || '[Objetivo general]');
  addSubsectionTitle('2.2 Objetivos Específicos');
  (data.objetivos.especificos || []).forEach((obj) => addBullet(obj));

  // ==========================================
  // SECCIÓN 3: ALCANCE
  // ==========================================
  addSectionTitle('3. ALCANCE DEL PLAN');
  addParagraph(data.alcance.descripcion || '[Descripción del alcance]');
  addParagraph(`Instalaciones y Áreas Comprendidas: ${(data.alcance.instalacionesComprendidas || []).join('; ') || 'Totalidad de las áreas operativas'}.`);
  addParagraph(`Personal y Terceros: Comprende al personal directo (${data.alcance.personalComprendido || 'personal propio'}) y empresas contratistas (${data.alcance.contratistasComprendidos || 'contratistas'}).`);

  // ==========================================
  // SECCIÓN 4: ESTIMACIÓN Y CARACTERIZACIÓN
  // ==========================================
  addSectionTitle('4. IDENTIFICACIÓN, CARACTERÍSTICAS Y ESTIMACIÓN DE RESIDUOS SÓLIDOS');
  addParagraph(
    'A continuación se presenta el balance cuantitativo y cualitativo de residuos generados en las instalaciones, categorizados según peligrosidad (Art. 30 del D.L. N° 1278) y codificados conforme al Convenio de Basilea (Anexos III y V del D.S. N° 014-2017-MINAM):'
  );

  let totalAnualTn = 0;
  const wasteRows = data.inventarioResiduos.map((w) => {
    const val = Number(w.cantidadAnual) || 0;
    if (w.unidad.includes('tn') || w.unidad.includes('t')) {
      totalAnualTn += val;
    } else {
      totalAnualTn += val / 1000;
    }
    return [
      w.nombre,
      `${w.etapa}\n(${w.procesoGenerador})`,
      w.clasificacionManejo,
      w.codigoConvenioBasilea || 'N/A',
      `${w.cantidadMensual} ${w.unidad}`,
      `${w.cantidadAnual} ${w.unidad.includes('tn') ? 't/año' : 'kg/año'}`,
    ];
  });

  wasteRows.push([
    'TOTAL GENERACIÓN ANUAL',
    '-',
    '-',
    '-',
    'TOTAL:',
    `${totalAnualTn.toLocaleString('es-PE', { maximumFractionDigits: 3 })} t/año`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    head: [['Residuo Sólido', 'Etapa / Proceso', 'Peligrosidad', 'Basilea', 'Masa Mensual', 'Masa Anual']],
    body: wasteRows,
    theme: 'striped',
    headStyles: {
      fillColor: COLOR_TITLE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1, overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 35 },
      2: { cellWidth: 26 },
      3: { cellWidth: 20 },
      4: { cellWidth: 19, halign: 'right' },
      5: { cellWidth: 19.2, halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==========================================
  // SECCIÓN 5: ESTRATEGIAS DE MINIMIZACIÓN
  // ==========================================
  addSectionTitle('5. ESTRATEGIAS PARA LA PREVENCIÓN Y/O MINIMIZACIÓN');
  addParagraph('Medidas preventivas, de optimización y valorización en la fuente:');

  const minRows = data.estrategiasMinimizacion.map((m) => [
    `${m.residuoOProceso}\n(${m.etapa})`,
    m.tipoEstrategia,
    m.descripcionMedida,
    m.metaReduccion,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    head: [['Residuo / Proceso', 'Estrategia', 'Descripción de la Medida Operativa', 'Meta']],
    body: minRows,
    theme: 'striped',
    headStyles: { fillColor: COLOR_TITLE, textColor: [255, 255, 255], fontSize: 8 },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1, overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30 },
      2: { cellWidth: 64.2 },
      3: { cellWidth: 25 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==========================================
  // SECCIÓN 6: GESTIÓN Y MANEJO OPERATIVO
  // ==========================================
  addSectionTitle('6. GESTIÓN Y MANEJO OPERATIVO DE RESIDUOS SÓLIDOS');
  addSubsectionTitle('6.1 Segregación en la Fuente y Código de Colores (NTP 900.058:2019)');
  addParagraph(data.gestionManejo.segregacion.descripcion || 'Se aplica código de colores según NTP 900.058:2019.');

  const colorRows = data.gestionManejo.segregacion.colores.map((c) => [c.tipo, c.color, c.ejemplos]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    head: [['Tipo de Residuo', 'Color Oficial NTP 900.058:2019', 'Ejemplos de Residuos']],
    body: colorRows,
    theme: 'grid',
    headStyles: { fillColor: COLOR_TITLE, textColor: [255, 255, 255], fontSize: 8 },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { cellWidth: 69.2 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  addSubsectionTitle('6.2 Almacenamiento Central de Residuos Peligrosos (Art. 54 D.S. 014-2017-MINAM)');
  addParagraph(
    `${data.gestionManejo.almacenamiento.centralPeligrosos.descripcion}. Tiempo máximo de custodia interna: hasta ${data.gestionManejo.almacenamiento.centralPeligrosos.tiempoMaximoMeses} meses (límite legal Art. 55).`
  );

  addSubsectionTitle('6.3 Transporte Externo y Disposición Final');
  addParagraph(
    `Transporte ejecutado exclusivamente por EO-RS autorizada: "${data.gestionManejo.transporteExterno.nombreEORS}" (MINAM: ${data.gestionManejo.transporteExterno.registroMINAM}, MTC: ${data.gestionManejo.transporteExterno.autorizacionMTC}). Frecuencia: ${data.gestionManejo.transporteExterno.frecuenciaRecojo}. Disposición final efectuada en ${data.gestionManejo.disposicionFinal.tipoInfraestructura} "${data.gestionManejo.disposicionFinal.nombrePlanta}" (IGA: ${data.gestionManejo.disposicionFinal.resolucionAprobacionIGA}), operado por ${data.gestionManejo.disposicionFinal.operadorResponsable}.`
  );

  // ==========================================
  // SECCIÓN 7: MEDIDAS AMBIENTALES
  // ==========================================
  addSectionTitle('7. DESCRIPCIÓN DE LAS MEDIDAS AMBIENTALES');
  const medRows = data.medidasAmbientales.map((m) => [
    m.etapa,
    m.componenteAfectado,
    m.impactoRiesgo,
    `${m.medidaMitigacion} (Monitoreo: ${m.frecuenciaMonitoreo})`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    head: [['Etapa', 'Componente', 'Impacto / Riesgo', 'Medida de Mitigación / Frecuencia']],
    body: medRows,
    theme: 'striped',
    headStyles: { fillColor: COLOR_TITLE, textColor: [255, 255, 255], fontSize: 8 },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1, overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 64.2 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==========================================
  // SECCIÓN 8: CONTINGENCIAS Y EMERGENCIAS
  // ==========================================
  addSectionTitle('8. MEDIDAS DE ATENCIÓN ANTE EMERGENCIAS (PLAN DE CONTINGENCIAS)');
  addParagraph(
    `Reporte obligatorio a OEFA dentro de un plazo máximo improrrogable de ${data.planEmergencias.comunicacionAutoridadHoras} horas (Art. 50 D.S. N° 014-2017-MINAM). Contacto de emergencia: ${data.planEmergencias.responsableEmergencia} (${data.planEmergencias.telefonoEmergencia}).`
  );
  addParagraph(`Protocolo ante Derrames: ${data.planEmergencias.procedimientoDerrame}`);
  addParagraph(`Protocolo ante Incendios: ${data.planEmergencias.procedimientoIncendio}`);

  // ==========================================
  // SECCIÓN 9: INDICADORES DE SEGUIMIENTO
  // ==========================================
  addSectionTitle('9. INDICADORES DE SEGUIMIENTO Y CONTROL');
  const indRows = data.indicadores.map((i) => [
    i.nombreIndicador,
    i.formulaCalculo,
    i.meta,
    `${i.frecuencia}\n(${i.medioVerificacion})`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    head: [['Indicador', 'Fórmula de Cálculo', 'Meta', 'Frecuencia y Verificación']],
    body: indRows,
    theme: 'striped',
    headStyles: { fillColor: COLOR_TITLE, textColor: [255, 255, 255], fontSize: 8 },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1, overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 54.2 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==========================================
  // SECCIÓN 10: CRONOGRAMA DE IMPLEMENTACIÓN
  // ==========================================
  addSectionTitle('10. CRONOGRAMA DE IMPLEMENTACIÓN');
  const cronRows = data.cronograma.map((c) => [
    c.actividad,
    c.etapa,
    `${c.plazo}\n(${c.frecuencia})`,
    `${c.obligacionLegalAsociada || '-'}\nResp: ${c.responsable}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    head: [['Actividad Operativa', 'Etapa', 'Plazo / Frecuencia', 'Obligación / Responsable']],
    body: cronRows,
    theme: 'striped',
    headStyles: { fillColor: COLOR_TITLE, textColor: [255, 255, 255], fontSize: 8 },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1, overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 54.2 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { cellWidth: 40 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==========================================
  // SECCIÓN 11: PRESUPUESTO Y RECURSOS
  // ==========================================
  addSectionTitle('11. PRESUPUESTO Y RECURSOS NECESARIOS');
  addParagraph(
    'Estimación económica analítica desagregada por partida en cumplimiento de la R.M. N° 089-2023-MINAM:'
  );

  let totalPEN = 0;
  data.presupuesto.forEach((p) => (totalPEN += p.costoEstimadoPEN || 0));

  const preRows = data.presupuesto.map((p) => [
    p.rubro,
    p.descripcion,
    `${p.fuenteFinanciamiento} (${p.periodo})`,
    `S/ ${p.costoEstimadoPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
  ]);

  preRows.push([
    'TOTAL PRESUPUESTO ANUAL',
    'Total partidas operativas de manejo de residuos',
    'Recursos Propios',
    `S/ ${totalPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    head: [['Rubro Presupuestal', 'Descripción de Recursos / Partida', 'Fuente / Periodo', 'Costo Estimado']],
    body: preRows,
    theme: 'grid',
    headStyles: { fillColor: COLOR_TITLE, textColor: [255, 255, 255], fontSize: 8 },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 59.2 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25, halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==========================================
  // SECCIÓN 12: FUNCIONES DEL RESPONSABLE
  // ==========================================
  addSectionTitle('12. FUNCIONES DEL RESPONSABLE DE LA GESTIÓN DE RESIDUOS SÓLIDOS');
  addParagraph(
    `Profesional Designado: ${data.funcionesResponsable.nombres || '[PENDIENTE DE COMPLETAR]'} | Cargo: ${data.funcionesResponsable.cargo || 'Responsable de Gestión Ambiental'} | Colegiatura: ${data.funcionesResponsable.cip || '[PENDIENTE DE COMPLETAR]'} (${data.funcionesResponsable.profesion || 'Ingeniería'}).`
  );
  (data.funcionesResponsable.funciones || []).forEach((f) => addBullet(f));

  // ==========================================
  // FIRMAS DE RESPONSABILIDAD
  // ==========================================
  if (currentY > 210) {
    doc.addPage();
    currentY = MARGIN_TOP;
  } else {
    currentY += 10;
  }

  addSectionTitle('FIRMAS DE RESPONSABILIDAD TÉCNICA');
  addParagraph(
    'Los abajo firmantes declaran que la información técnica y los datos contenidos en el presente documento son verídicos, verificables y responden a las condiciones operativas de la instalación, asumiendo la responsabilidad conforme al marco normativo vigente.'
  );

  currentY += 15;
  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT, top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
    showHead: 'everyPage',
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8.5, halign: 'center', cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 79.6 },
      1: { cellWidth: 79.6 },
    },
    body: [
      ['______________________________________', '______________________________________'],
      [data.generalInfo.representanteLegal || '[PENDIENTE DE COMPLETAR]', data.funcionesResponsable.nombres || '[PENDIENTE DE COMPLETAR]'],
      [`D.N.I. N° ${data.generalInfo.dniRepresentante || '[PENDIENTE DE COMPLETAR]'}`, `Reg. CIP N° ${data.funcionesResponsable.cip || '[PENDIENTE DE COMPLETAR]'} (${data.funcionesResponsable.profesion || 'Ingeniería'})`],
      [data.generalInfo.razonSocial || 'Empresa Titular', data.funcionesResponsable.cargo || 'Responsable de Gestión Ambiental'],
    ],
  });

  // ==========================================
  // ENCABEZADOS Y PIES DE PÁGINA (PÁGINA 2 A N)
  // Plantilla Membretada Oficial EcoSerpentis Consulting
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let page = 2; page <= totalPages; page++) {
    doc.setPage(page);
    drawOfficialPdfLetterhead(doc, page, totalPages);
  }

  return doc;
}

/**
 * Generate PDF for Audit Report
 */
export function generateAuditPdf(report: AuditReport): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Logo oficial centrado en la parte superior
  try {
    doc.addImage(ECOSERPENTIS_LOGO_DATA_URI, 'PNG', 92, 12, 26, 26, 'ECOSERPENTIS_AUDIT_LOGO');
  } catch (err) {}

  // Cover / Header Banner
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TITLE[0], COLOR_TITLE[1], COLOR_TITLE[2]);
  doc.text('INFORME TÉCNICO DE EVALUACIÓN PRELIMINAR DE PMMRS', 105, 43, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.text(
    'AUDITORÍA DOCUMENTAL BAJO R.M. N.° 089-2023-MINAM, D.L. N.° 1278 Y NTP 900.058:2019',
    105,
    49,
    { align: 'center' }
  );

  doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, 53, 210 - MARGIN_RIGHT, 53);

  autoTable(doc, {
    startY: 57,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5, lineColor: COLOR_BORDER, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: [241, 245, 249] },
      1: { cellWidth: 110 },
    },
    body: [
      ['Archivo Evaluado', `${report.nombreArchivo} (${report.totalPaginas} páginas, ${report.tamanoArchivoMB} MB)`],
      ['Fecha de Evaluación', report.fechaEvaluacion],
      ['Puntaje Global Obtenido', `${report.puntajeGlobal}% de cumplimiento preliminar (${report.formulaPuntaje})`],
      ['Resumen Ejecutivo', report.resumenEjecutivo],
    ],
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // Criteria Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLOR_TITLE[0], COLOR_TITLE[1], COLOR_TITLE[2]);
  doc.text('RESULTADOS DETALLADOS POR CRITERIO NORMATIVO', MARGIN_LEFT, currentY);
  currentY += 4;

  const critRows = report.criterios.map((c) => [
    `${c.id}\n${c.seccionTitulo}`,
    c.baseLegal,
    c.estado,
    `${c.hallazgoExplicacion}\n\n${c.evidenciaLiteral ? `Cita: "${c.evidenciaLiteral}" (${c.paginaOSeccion})` : ''}`,
    c.accionCorrectiva,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
    head: [['Req / Sección', 'Base Legal', 'Estado', 'Hallazgo / Evidencia Literal', 'Acción Correctiva']],
    body: critRows,
    theme: 'striped',
    headStyles: { fillColor: COLOR_TITLE, textColor: [255, 255, 255], fontSize: 8 },
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 28 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 50 },
      4: { cellWidth: 38 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Contradicciones si existen
  if (report.contradicciones.length > 0) {
    if (currentY > 240) {
      doc.addPage();
      currentY = MARGIN_TOP;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text('INCONSISTENCIAS Y CONTRADICCIONES INTERNAS DETECTADAS', MARGIN_LEFT, currentY);
    currentY += 4;

    const contraRows = report.contradicciones.map((ct) => [
      ct.titulo,
      ct.seccionesInvolucradas,
      `${ct.descripcion}\n\n${ct.citaLiteral1 || ''}\n${ct.citaLiteral2 || ''}`,
      ct.recomendacion,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      head: [['Título de la Inconsistencia', 'Secciones Involucradas', 'Descripción y Citas', 'Recomendación Técnica']],
      body: contraRows,
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 8 },
      styles: { font: 'helvetica', fontSize: 7, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 55 },
        3: { cellWidth: 35 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Legal disclaimer
  if (currentY > 260) {
    doc.addPage();
    currentY = MARGIN_TOP;
  }
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const splitDisclaimer = doc.splitTextToSize(`Aviso Legal: ${report.advertenciaLegal}`, CONTENT_WIDTH);
  doc.text(splitDisclaimer, MARGIN_LEFT, currentY);

  // Headers and Footers for Audit Report
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_LEFT, 282, 210 - MARGIN_RIGHT, 282);
    doc.text('Informe Preliminar de Revisión Técnica · PMMRS EcoSerpentis Consulting Perú', MARGIN_LEFT, 286);
    doc.text(`Página ${page} de ${totalPages}`, 210 - MARGIN_RIGHT, 286, { align: 'right' });
  }

  return doc;
}

/**
 * Generate official PDF for Commitments Matrix (Landscape format)
 */
export function generateCommitmentsPdf(report: CommitmentsMatrixReport): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const titularName = report.nombreTitular || 'TITULAR DE LA OPERACIÓN';
  const contradictions = report.compromisos.filter((c) => c.posibleContradiccion?.hayContradiccion);

  // Margins in landscape (Width: 297mm, Height: 210mm)
  const marginL = 15;
  const marginR = 15;
  const pageW = 297;
  const contentW = pageW - marginL - marginR; // 267 mm

  let currentY = 16;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TITLE[0], COLOR_TITLE[1], COLOR_TITLE[2]);
  doc.text('MATRIZ DE COMPROMISOS DECLARADOS EN EL PMMRS', marginL, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
  doc.text(
    `Titular: ${titularName} · Proyecto/Archivo: ${report.nombreProyecto} (${report.archivoAnalizado}) · Fecha: ${report.fechaAnalisis}`,
    marginL,
    currentY
  );

  currentY += 5;
  // Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const splitDisc = doc.splitTextToSize(`Nota técnica de alcance: ${report.notaAlcance}`, contentW);
  doc.text(splitDisc, marginL, currentY);
  currentY += splitDisc.length * 3.5 + 2;

  // Executive Summary text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_BODY[0], COLOR_BODY[1], COLOR_BODY[2]);
  doc.text(
    `Resumen: Total identificados: ${report.resumen.totalIdentificados} | Completos: ${report.resumen.completos} | Parciales: ${report.resumen.parciales} | Ambiguos: ${report.resumen.ambiguos} | Sin responsable: ${report.resumen.sinResponsable} | Sin plazo/frecuencia: ${report.resumen.sinPlazoFrecuencia} | Posibles contradicciones: ${report.resumen.conPosibleContradiccion}`,
    marginL,
    currentY
  );
  currentY += 4;

  // Table rows
  const tableRows = report.compromisos.map((c) => [
    c.id,
    c.compromiso,
    `${c.categoria}\n(${c.etapa})`,
    `${c.residuoRelacionado}\n[${c.procesoActividad}]`,
    c.responsable,
    `${c.plazo}\n(${c.frecuencia})`,
    `${c.indicador}\n${c.evidenciaCumplimiento}`,
    c.pagina,
    c.estadoFormulacion,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginL, right: marginR },
    head: [[
      'Cód.',
      'Compromiso Declarado',
      'Categoría / Etapa',
      'Residuo / Proceso',
      'Responsable',
      'Plazo / Frecuencia',
      'Indicador / Evidencia',
      'Ubicación',
      'Estado',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      cellPadding: 2,
      lineColor: COLOR_BORDER,
      lineWidth: 0.1,
      textColor: COLOR_BODY,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 64 },
      2: { cellWidth: 28 },
      3: { cellWidth: 32 },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
      6: { cellWidth: 35 },
      7: { cellWidth: 20 },
      8: { cellWidth: 20, fontStyle: 'bold' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Contradictions section if any
  if (contradictions.length > 0) {
    if (currentY > 175) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(185, 28, 28);
    doc.text('ALERTAS DE POSIBLES CONTRADICCIONES INTERNAS EN EL DOCUMENTO', marginL, currentY);
    currentY += 4;

    const contraRows = contradictions.map((ct) => [
      ct.id,
      ct.pagina,
      ct.posibleContradiccion?.detalle || 'Posible discrepancia en redacción',
      `${ct.posibleContradiccion?.compromisoRelacionadoId || '-'} (${ct.posibleContradiccion?.paginaRelacionada || ''})`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginL, right: marginR },
      head: [['Compromiso ID', 'Ubicación', 'Detalle de Inconsistencia Detectada', 'Compromiso Relacionado']],
      body: contraRows,
      theme: 'striped',
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontSize: 7.5 },
      styles: { font: 'helvetica', fontSize: 6.8, cellPadding: 2, lineColor: COLOR_BORDER, lineWidth: 0.1 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 120 },
        3: { cellWidth: 82 },
      },
    });
  }

  // Header and footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(marginL, 202, pageW - marginR, 202);
    doc.text('Matriz Técnica de Compromisos Declarados · PMMRS EcoSerpentis Consulting Perú', marginL, 206);
    doc.text(`Página ${page} de ${totalPages}`, pageW - marginR, 206, { align: 'right' });
  }

  return doc;
}
