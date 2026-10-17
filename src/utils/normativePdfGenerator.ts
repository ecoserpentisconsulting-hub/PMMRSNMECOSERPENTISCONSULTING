import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface NormativeDocumentMeta {
  id: string;
  codigo: string;
  titulo: string;
  entidad: string;
  anio: string;
  fechaPublicacion: string;
  fuenteOficial: string;
  fuenteUrl: string;
  versionConsultada: string;
  descripcion: string;
  estadoAplicativo: string;
  nombreArchivo: string;
  esDescargable: boolean;
  esNTP?: boolean;
  resumenArticulos: {
    seccion: string;
    articulos: string;
    contenido: string;
  }[];
}

export function generateNormativePdf(docMeta: NormativeDocumentMeta): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Header banner
  doc.setFillColor(16, 47, 39); // Forest deep #102F27
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DOCUMENTO NORMATIVO DE REFERENCIA', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(182, 138, 79); // Gold #B68A4F
  doc.text('EcoSerpentisConsulting • Plataforma de Gestión y Auditoría del PMMRS', margin, 18);
  doc.setTextColor(242, 235, 221);
  doc.text(`Fuente Oficial: ${docMeta.fuenteOficial} • ${docMeta.fechaPublicacion}`, margin, 23);

  // Title block
  let y = 38;
  doc.setTextColor(16, 47, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(docMeta.codigo, margin, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  const splitTitle = doc.splitTextToSize(docMeta.titulo, contentWidth);
  doc.text(splitTitle, margin, y);
  y += splitTitle.length * 5.5 + 4;

  // Metadata Table
  const metaRows = [
    ['Entidad Emisora', docMeta.entidad],
    ['Año de Aprobación', docMeta.anio],
    ['Publicación Oficial', docMeta.fechaPublicacion],
    ['Fuente Oficial', docMeta.fuenteOficial],
    ['Enlace Oficial', docMeta.fuenteUrl],
    ['Versión Consultada', docMeta.versionConsultada],
    ['Alcance en la Plataforma', docMeta.estadoAplicativo],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Parámetro Normativo', 'Detalle de Referencia Técnica']],
    body: metaRows,
    theme: 'grid',
    headStyles: {
      fillColor: [24, 88, 68], // Emerald #185844
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: contentWidth - 50 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 8;

  // Description box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Descripción del Instrumento:', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(docMeta.descripcion, contentWidth - 6);
  doc.text(descLines, margin + 3, y + 10);

  y += 24;

  // Articles & Provisions Table
  doc.setTextColor(16, 47, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Estructura y Disposiciones Clave en la Gestión de Residuos Sólidos', margin, y);
  y += 5;

  const articleRows = docMeta.resumenArticulos.map((art) => [
    art.seccion,
    art.articulos,
    art.contenido,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Sección / Contenido', 'Artículos Clave', 'Obligaciones y Criterios Técnicos Exigibles']],
    body: articleRows,
    theme: 'striped',
    headStyles: {
      fillColor: [16, 47, 39],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2.8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 32, fontStyle: 'bold', textColor: [4, 120, 87] },
      2: { cellWidth: contentWidth - 70 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > pageHeight - 30) {
    doc.addPage();
    y = 20;
  }

  // Legal disclaimer notice
  doc.setFillColor(254, 252, 232); // amber-50
  doc.setDrawColor(251, 191, 36); // amber-400
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setTextColor(120, 53, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('AVISO LEGAL Y DE TRAZABILIDAD NORMATIVA:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  const notice =
    'El presente documento compila la versión técnica de referencia consultada por la plataforma. Consulte siempre el diario oficial El Peruano o el compendio oficial del MINAM / SPIJ para verificar modificaciones, textos únicos ordenados o normas complementarias vigentes.';
  doc.text(doc.splitTextToSize(notice, contentWidth - 6), margin + 3, y + 8.5);

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `PMMRS Perú • ${docMeta.codigo} • Página ${i} de ${totalPages}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Consulta oficial: ${docMeta.fuenteUrl}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  return doc.output('blob');
}
