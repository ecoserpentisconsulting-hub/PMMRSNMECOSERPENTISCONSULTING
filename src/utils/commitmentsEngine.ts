import {
  PmmrsData,
  PmmrsCommitment,
  CommitmentsMatrixReport,
  CommitmentCategory,
  CommitmentFormulationStatus,
  CommitmentValidationDecision,
  CommitmentConfidenceLevel,
} from '../types/pmrs';
import { PdfExtractionResult } from './pdfExtractor';

export const COMMITMENT_DISCLAIMER_NOTE =
  'La presente matriz estructura compromisos identificados en el documento analizado o en la información registrada por el usuario. No constituye una determinación oficial de obligaciones ambientales, una certificación de cumplimiento ni sustituye la evaluación de la autoridad competente.';

/**
 * Calculates executive summary statistics for a list of commitments.
 * NOTE: These are descriptive document statistics, NOT legal compliance percentages.
 */
export function calculateCommitmentsSummary(compromisos: PmmrsCommitment[]): CommitmentsMatrixReport['resumen'] {
  let completos = 0;
  let parciales = 0;
  let ambiguos = 0;
  let noEvaluables = 0;
  let confirmados = 0;
  let rechazados = 0;
  let sinResponsable = 0;
  let sinPlazoFrecuencia = 0;
  let sinIndicador = 0;
  let conPosibleContradiccion = 0;
  let validados = 0;
  let pendientes = 0;
  let editados = 0;
  let descartados = 0;
  let posiblesDuplicados = 0;

  for (const c of compromisos) {
    if (c.decision_validacion === 'CONFIRMADO') confirmados++;
    else if (c.decision_validacion === 'RECHAZADO') rechazados++;

    const rev =
      c.estado_revision ||
      (c.decision_validacion === 'RECHAZADO'
        ? 'Descartado'
        : c.decision_validacion === 'AMBIGUO'
          ? 'Pendiente'
          : 'Validado');

    if (rev === 'Validado') validados++;
    else if (rev === 'Pendiente') pendientes++;
    else if (rev === 'Editado') editados++;
    else if (rev === 'Descartado') descartados++;

    if (c.posible_duplicado && rev !== 'Descartado') {
      posiblesDuplicados++;
    }

    const estado = c.estado || c.estadoFormulacion;
    if (estado === 'COMPLETO') completos++;
    else if (estado === 'PARCIAL') parciales++;
    else if (estado === 'AMBIGUO') ambiguos++;
    else if (estado === 'NO EVALUABLE') noEvaluables++;

    if (!c.responsable || c.responsable.toLowerCase().includes('no identificado')) {
      sinResponsable++;
    }
    const lacksPlazo = !c.plazo || c.plazo.toLowerCase().includes('no identificado') || c.plazo.toLowerCase().includes('no precisad');
    const lacksFrecuencia = !c.frecuencia || c.frecuencia.toLowerCase().includes('no identificad') || c.frecuencia.toLowerCase().includes('no precisad');
    if (lacksPlazo && lacksFrecuencia) {
      sinPlazoFrecuencia++;
    }
    const ind = c.evidencia_sugerida || c.indicador_evidencia || c.indicador;
    if (!ind || ind.toLowerCase().includes('no identificado')) {
      sinIndicador++;
    }
    if (c.posibleContradiccion?.hayContradiccion) {
      conPosibleContradiccion++;
    }
  }

  return {
    totalIdentificados: compromisos.length,
    completos,
    parciales,
    ambiguos,
    noEvaluables,
    confirmados,
    rechazados,
    sinResponsable,
    sinPlazoFrecuencia,
    sinIndicador,
    conPosibleContradiccion,
    validados,
    pendientes,
    editados,
    descartados,
    posiblesDuplicados,
  };
}

/**
 * Evaluates the formulation status of a commitment without inventing data.
 */
function evaluateFormulationStatus(
  compromiso: string,
  responsable: string,
  plazo: string,
  frecuencia: string,
  indicador: string
): CommitmentFormulationStatus {
  if (!compromiso || compromiso.trim().length < 15) {
    return 'NO EVALUABLE';
  }

  const isVague =
    compromiso.toLowerCase().includes('en la medida de lo posible') ||
    compromiso.toLowerCase().includes('se procurará') ||
    compromiso.toLowerCase().includes('se intentará') ||
    compromiso.toLowerCase().includes('de ser factible') ||
    compromiso.toLowerCase().includes('fomentar buenas prácticas');

  if (isVague) {
    return 'AMBIGUO';
  }

  const hasResponsable = Boolean(responsable && !responsable.toLowerCase().includes('no identificado'));
  const hasTiming = Boolean(
    (plazo && !plazo.toLowerCase().includes('no identificado')) ||
      (frecuencia && !frecuencia.toLowerCase().includes('no identificad'))
  );
  const hasIndicador = Boolean(indicador && !indicador.toLowerCase().includes('no identificado'));

  // Complete requires concrete action + responsible + timing (deadline or frequency) + indicator/evidence
  if (hasResponsable && hasTiming && hasIndicador) {
    return 'COMPLETO';
  }

  // Partial: concrete commitment is there, but lacks one or more critical follow-up elements
  return 'PARCIAL';
}

/**
 * Helper tipado para instanciar PmmrsCommitment con todos los campos obligatorios
 */
function createCommitmentItem(params: {
  id: string;
  numero: number;
  compromiso: string;
  categoria: CommitmentCategory;
  etapa?: string;
  procesoActividad?: string;
  residuoRelacionado?: string;
  residuo_proceso?: string;
  responsable?: string;
  plazo?: string;
  frecuencia?: string;
  indicador?: string;
  evidenciaCumplimiento?: string;
  pagina?: string;
  pagina_pdf?: number | string;
  pagina_impresa?: string;
  seccion?: string;
  textoFuente?: string;
  estadoFormulacion?: CommitmentFormulationStatus;
  decision_validacion?: CommitmentValidationDecision;
  justificacion_validacion?: string;
  nivel_confianza?: CommitmentConfidenceLevel;
  posible_duplicado?: boolean;
  registros_relacionados?: string[] | string;
  alertas?: string[] | string;
  observacion?: string;
  paginasRelacionadas?: string[];
  origen: 'PMMRS generado' | 'PDF analizado';
  documento?: string;
}): PmmrsCommitment {
  const normCommitment = params.compromiso.trim();
  const resp = params.responsable?.trim() || 'No identificado';
  const plz = params.plazo?.trim() || 'No identificado';
  const frq = params.frecuencia?.trim() || 'No identificada';
  const ind = params.indicador?.trim() || 'No identificado';
  const status =
    params.estadoFormulacion || evaluateFormulationStatus(normCommitment, resp, plz, frq, ind);

  const residuoProcesoFinal =
    params.residuo_proceso ||
    (params.residuoRelacionado && params.procesoActividad
      ? `${params.residuoRelacionado} / ${params.procesoActividad}`
      : params.residuoRelacionado || params.procesoActividad || 'Residuos sólidos generales / Proceso operativo');

  const alertasFinal =
    params.alertas || (params.posible_duplicado ? 'Posible compromiso duplicado' : 'Sin alertas identificadas');

  return {
    id: params.id,
    numero: params.numero,
    documento:
      params.documento ||
      (params.origen === 'PMMRS generado' ? 'PMMRS elaborado en la aplicación' : 'PMMRS.pdf'),
    pagina_pdf: params.pagina_pdf ?? params.pagina ?? '1',
    pagina_impresa: params.pagina_impresa || 'No identificada',
    seccion: params.seccion || 'Cuerpo del PMMRS',
    texto_fuente: params.textoFuente || normCommitment,
    compromiso_normalizado: normCommitment,
    categoria: params.categoria,
    etapa: params.etapa || 'Operación',
    residuo_proceso: residuoProcesoFinal,
    responsable: resp,
    plazo: plz,
    frecuencia: frq,
    indicador_evidencia: ind,
    estado_cumplimiento: status,
    decision_validacion: params.decision_validacion || 'CONFIRMADO',
    justificacion_validacion:
      params.justificacion_validacion ||
      (params.origen === 'PMMRS generado'
        ? 'Obligación técnica estructurada registrada directamente por el titular en la aplicación.'
        : 'Obligación ambiental identificada con acción verificable.'),
    nivel_confianza: params.nivel_confianza || 'ALTO',
    posible_duplicado: Boolean(params.posible_duplicado),
    registros_relacionados: params.registros_relacionados || 'Ninguno',
    alertas: alertasFinal,
    observaciones: params.observacion || 'Compromiso incorporado a la matriz.',
    estado: status,

    // Retrocompatibilidad
    compromiso: normCommitment,
    procesoActividad: params.procesoActividad || 'Gestión y manejo de residuos sólidos',
    residuoRelacionado: params.residuoRelacionado || 'Todos los residuos',
    indicador: ind,
    evidenciaCumplimiento:
      params.evidenciaCumplimiento || 'Documentación técnica o registro verificable',
    pagina: params.pagina || `Pág. ${params.pagina_pdf || 1}`,
    textoFuente: params.textoFuente || normCommitment,
    estadoFormulacion: status,
    observacion: params.observacion || 'Compromiso incorporado a la matriz.',
    paginasRelacionadas: params.paginasRelacionadas || [params.pagina || 'Pág. 1'],
    origen: params.origen,
  };
}

/**
 * FLUJO A: Builds the commitments matrix directly from structured data of a PMMRS
 * without re-interpreting via AI.
 */
export function buildCommitmentsFromStructuredPlan(data: PmmrsData): CommitmentsMatrixReport {
  const rawCommitments: PmmrsCommitment[] = [];
  const safeData = data || ({} as PmmrsData);
  const titular = safeData.generalInfo?.razonSocial || 'No identificado';
  const proyecto = safeData.generalInfo?.descripcionOperacion || 'Operación No Municipal';

  let counter = 1;

  // 1. Specific Objectives
  const especificos = Array.isArray(safeData.objetivos?.especificos) ? safeData.objetivos.especificos : [];
  especificos.forEach((obj) => {
    if (obj && typeof obj === 'string' && obj.trim().length > 10) {
      const resp = safeData.funcionesResponsable?.nombres || safeData.generalInfo?.responsableTecnico || 'No identificado';
      rawCommitments.push(
        createCommitmentItem({
          id: `COM-${String(counter++).padStart(3, '0')}`,
          numero: counter - 1,
          compromiso: obj.trim(),
          categoria: 'Prevención y minimización',
          etapa: 'Planificación / Operación',
          procesoActividad: 'Gestión Integral de Residuos',
          residuoRelacionado: 'Todos los residuos generados',
          responsable: resp,
          plazo: 'Durante la vigencia del PMMRS',
          frecuencia: 'Anual',
          indicador: 'Porcentaje de cumplimiento de objetivos anuales',
          evidenciaCumplimiento: 'Reporte técnico anual e informe de desempeño',
          pagina: 'Sección 2: Objetivos',
          pagina_pdf: 'Sección 2',
          seccion: '2. Objetivos del PMMRS',
          textoFuente: obj,
          observacion: 'Objetivo específico declarado por el titular en el PMMRS.',
          origen: 'PMMRS generado',
        })
      );
    }
  });

  // 2. Minimization Strategies
  const estrategias = Array.isArray(safeData.estrategiasMinimizacion) ? safeData.estrategiasMinimizacion : [];
  estrategias.forEach((strat) => {
    if (!strat) return;
    const action = `${strat.tipoEstrategia || 'Estrategia'}: ${strat.descripcionMedida || 'Medida de minimización'}`;
    const resp = strat.responsable || 'No identificado';
    const ind = strat.metaReduccion || 'No identificado';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: action,
        categoria: 'Prevención y minimización',
        etapa: strat.etapa || 'Operación',
        procesoActividad: strat.residuoOProceso || 'No identificado',
        residuoRelacionado: strat.residuoOProceso || 'No identificado',
        responsable: resp,
        plazo: 'Durante la etapa operativa',
        frecuencia: 'Mensual / Continua',
        indicador: ind,
        evidenciaCumplimiento: `Registro de pesaje y balance de minimización (Meta: ${strat.metaReduccion || 'No precisada'})`,
        pagina: 'Sección 5: Estrategias de Minimización',
        pagina_pdf: 'Sección 5',
        seccion: '5. Estrategias para la prevención y/o minimización',
        textoFuente: strat.descripcionMedida || action,
        observacion: `Estrategia de tipo ${strat.tipoEstrategia || 'técnica'}.`,
        origen: 'PMMRS generado',
      })
    );
  });

  // 3. Segregation
  if (safeData.gestionManejo?.segregacion?.descripcion) {
    const segText = safeData.gestionManejo.segregacion.descripcion;
    const resp = safeData.funcionesResponsable?.nombres || 'No identificado';
    const colores = Array.isArray(safeData.gestionManejo.segregacion.colores) ? safeData.gestionManejo.segregacion.colores : [];
    const residuosList = colores.map((c) => c?.tipo).filter(Boolean).join(', ') || 'Residuos sólidos no municipales';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Segregación de residuos en la fuente mediante código de colores según NTP 900.058:2019 (${colores.length} tipos de recipientes).`,
        categoria: 'Segregación',
        etapa: 'Operación',
        procesoActividad: 'Áreas operativas y puntos de generación',
        residuoRelacionado: residuosList,
        responsable: resp,
        plazo: 'Permanente',
        frecuencia: 'Diaria / Continua',
        indicador: 'Índice de segregación correcta en estaciones de acopio',
        evidenciaCumplimiento: 'Listas de chequeo e inspecciones visuales en puntos ecológicos',
        pagina: 'Sección 6.1: Segregación',
        pagina_pdf: 'Sección 6.1',
        seccion: '6. Gestión y Manejo: Segregación',
        textoFuente: segText,
        observacion: 'Cumplimiento de la Tabla 2 de la NTP 900.058:2019 (Ámbito No Municipal).',
        origen: 'PMMRS generado',
      })
    );
  }

  // 4. Internal Collection
  if (safeData.gestionManejo?.recoleccionInterna?.frecuencia) {
    const col = safeData.gestionManejo.recoleccionInterna;
    const resp = safeData.funcionesResponsable?.nombres || 'No identificado';
    const epps = Array.isArray(col.epps) && col.epps.length > 0 ? col.epps.join(', ') : 'EPP normativo completo';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Recolección interna de residuos en rutas establecidas (${col.rutasInternas || 'rutas de planta'}) con uso obligatorio de EPP (${epps}).`,
        categoria: 'Recolección',
        etapa: 'Operación',
        procesoActividad: 'Acarreo interno de residuos hacia acopio central',
        residuoRelacionado: 'Todos los residuos generados',
        responsable: resp,
        plazo: 'Operación diaria',
        frecuencia: col.frecuencia || 'Diaria',
        indicador: 'Planilla de turnos de recolección y verificación de uso de EPP',
        evidenciaCumplimiento: 'Registro de ruta de recolección e inspección de seguridad',
        pagina: 'Sección 6.2: Recolección Interna',
        pagina_pdf: 'Sección 6.2',
        seccion: '6. Gestión y Manejo: Recolección',
        textoFuente: `Frecuencia: ${col.frecuencia}. Rutas: ${col.rutasInternas || 'No precisadas'}. Horarios: ${col.horarios || 'No precisados'}`,
        observacion: 'Medidas operativas de protección de los trabajadores.',
        origen: 'PMMRS generado',
      })
    );
  }

  // 5. Central Storage
  if (safeData.gestionManejo?.almacenamiento?.centralPeligrosos || safeData.gestionManejo?.almacenamiento?.centralNoPeligrosos) {
    const alm = safeData.gestionManejo.almacenamiento;
    const desc = alm.centralPeligrosos?.descripcion || alm.centralNoPeligrosos || 'Almacén central acondicionado';
    const resp = safeData.funcionesResponsable?.nombres || 'No identificado';
    const tiempoMax = alm.centralPeligrosos?.tiempoMaximoMeses ? `${alm.centralPeligrosos.tiempoMaximoMeses} meses` : '12 meses';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Acondicionamiento y operación del almacenamiento central de residuos con tiempo máximo de permanencia de ${tiempoMax}: ${desc}.`,
        categoria: 'Almacenamiento',
        etapa: 'Operación',
        procesoActividad: 'Custodia temporal de residuos',
        residuoRelacionado: 'Residuos sólidos no municipales peligrosos y no peligrosos',
        responsable: resp,
        plazo: 'Permanente',
        frecuencia: 'Continua',
        indicador: 'Registro de ingreso y salida del almacén central (Kardex)',
        evidenciaCumplimiento: 'Kardex de almacenamiento e informe de capacidad utilizada',
        pagina: 'Sección 6.3: Almacenamiento',
        pagina_pdf: 'Sección 6.3',
        seccion: '6. Gestión y Manejo: Almacenamiento',
        textoFuente: `Almacén peligrosos: ${desc}. Tiempo máx: ${tiempoMax}`,
        observacion: 'Cumplimiento del Art. 36 del Reglamento del D.L. 1278 (D.S. 014-2017-MINAM).',
        origen: 'PMMRS generado',
      })
    );
  }

  // 6. External Transport (EO-RS)
  if (safeData.gestionManejo?.transporteExterno?.nombreEORS) {
    const tr = safeData.gestionManejo.transporteExterno;
    const resp = safeData.funcionesResponsable?.nombres || 'No identificado';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Entrega y transporte externo de residuos sólidos a través de la Empresa Operadora de Residuos Sólidos (EO-RS) ${tr.nombreEORS} (Registro MINAM: ${tr.registroMINAM || 'No identificado'}).`,
        categoria: 'Transporte',
        etapa: 'Operación',
        procesoActividad: 'Despacho externo de residuos',
        residuoRelacionado: 'Residuos sólidos recolectados para valorización o disposición',
        responsable: resp,
        plazo: 'Según programación de retiro',
        frecuencia: tr.frecuenciaRecojo || 'No identificada',
        indicador: 'Manifiestos de Residuos Sólidos Peligrosos y Guías de Transporte firmadas',
        evidenciaCumplimiento: 'Manifiestos firmados por EO-RS y reporte trimestral en SIGERSOL',
        pagina: 'Sección 6.4: Transporte Externo',
        pagina_pdf: 'Sección 6.4',
        seccion: '6. Gestión y Manejo: Transporte',
        textoFuente: `EO-RS: ${tr.nombreEORS}. Registro MINAM: ${tr.registroMINAM || 'No identificado'}. Frecuencia: ${tr.frecuenciaRecojo || 'No identificada'}`,
        observacion: 'Obligación del titular de contratar exclusivamente EO-RS registrada en el MINAM.',
        origen: 'PMMRS generado',
      })
    );
  }

  // 7. Valorization
  if (safeData.gestionManejo?.valorizacion?.aplica) {
    const val = safeData.gestionManejo.valorizacion;
    const resp = safeData.funcionesResponsable?.nombres || 'No identificado';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Valorización de residuos mediante ${val.tipo || 'tratamiento'} a través de ${val.operadorOPlanta || 'operador autorizado'}.`,
        categoria: 'Valorización',
        etapa: 'Operación',
        procesoActividad: 'Aprovechamiento y economía circular',
        residuoRelacionado: 'Residuos reaprovechables (metálicos, plásticos, cartón u orgánicos)',
        responsable: resp,
        plazo: 'Durante la etapa operativa',
        frecuencia: 'Mensual',
        indicador: 'Toneladas de residuos valorizados al mes',
        evidenciaCumplimiento: 'Certificados de valorización emitidos por la planta u operador receptor',
        pagina: 'Sección 6.5: Valorización',
        pagina_pdf: 'Sección 6.5',
        seccion: '6. Gestión y Manejo: Valorización',
        textoFuente: val.descripcion || 'Valorización de residuos según D.L. 1278',
        observacion: 'Acción alineada a los principios de economía circular y valorización.',
        origen: 'PMMRS generado',
      })
    );
  }

  // 8. Final Disposal
  if (safeData.gestionManejo?.disposicionFinal?.nombrePlanta) {
    const disp = safeData.gestionManejo.disposicionFinal;
    const resp = safeData.funcionesResponsable?.nombres || 'No identificado';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Disposición final de los residuos no aprovechables en la infraestructura autorizada: ${disp.nombrePlanta} (${disp.tipoInfraestructura || 'Relleno'}), ubicada en ${disp.ubicacion || 'No identificada'}.`,
        categoria: 'Disposición final',
        etapa: 'Operación',
        procesoActividad: 'Confinamiento definitivo de descartes',
        residuoRelacionado: 'Residuos no aprovechables / descartes peligrosos',
        responsable: resp,
        plazo: 'Según ciclo de retiro',
        frecuencia: 'Mensual',
        indicador: 'Certificados de disposición final emitidos por el operador del relleno',
        evidenciaCumplimiento: 'Constancias y boletas de pesaje del relleno autorizado',
        pagina: 'Sección 6.6: Disposición Final',
        pagina_pdf: 'Sección 6.6',
        seccion: '6. Gestión y Manejo: Disposición Final',
        textoFuente: `Infraestructura: ${disp.nombrePlanta}. Tipo: ${disp.tipoInfraestructura || 'Relleno'}. Operador: ${disp.operadorResponsable || 'No identificado'}`,
        observacion: 'Cumplimiento del Art. 65 del D.S. 014-2017-MINAM.',
        origen: 'PMMRS generado',
      })
    );
  }

  // 9. Environmental Measures
  const medidas = Array.isArray(safeData.medidasAmbientales) ? safeData.medidasAmbientales : [];
  medidas.forEach((med) => {
    if (!med) return;
    const resp = med.responsable || 'No identificado';
    const frec = med.frecuenciaMonitoreo || 'No identificada';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Implementación de medida ambiental sobre ${med.componenteAfectado || 'medio ambiente'}: ${med.medidaMitigacion || 'Mitigación ambiental'}`,
        categoria: 'Medidas ambientales',
        etapa: med.etapa || 'Operación',
        procesoActividad: `Control de impacto: ${med.impactoRiesgo || 'Gestión ambiental'}`,
        residuoRelacionado: 'Residuos que impactan el componente ' + (med.componenteAfectado || 'ambiental'),
        responsable: resp,
        plazo: 'Permanente durante la operación',
        frecuencia: frec,
        indicador: `Monitoreo ambiental sobre ${med.componenteAfectado || 'componentes receptores'}`,
        evidenciaCumplimiento: 'Informes de monitoreo ambiental y fichas de verificación de campo',
        pagina: 'Sección 7: Medidas Ambientales',
        pagina_pdf: 'Sección 7',
        seccion: '7. Descripción de las medidas ambientales',
        textoFuente: med.medidaMitigacion || 'Medida de mitigación',
        observacion: `Control del componente ambiental ${med.componenteAfectado || 'general'}.`,
        origen: 'PMMRS generado',
      })
    );
  });

  // 10. Emergency Plan Commitments
  if (safeData.planEmergencias?.procedimientoDerrame || safeData.planEmergencias?.procedimientoIncendio) {
    const cont = safeData.planEmergencias;
    const resp = cont.responsableEmergencia || safeData.funcionesResponsable?.nombres || 'No identificado';
    const equip = Array.isArray(cont.equipamientoEmergencia)
      ? cont.equipamientoEmergencia.join(', ')
      : 'Kit antiderrame y extintores';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Activación del Plan de Emergencias ante derrames o contingencias con residuos peligrosos: ${cont.procedimientoDerrame || cont.procedimientoIncendio || 'Procedimiento de control'}.`,
        categoria: 'Emergencias',
        etapa: 'Emergencias',
        procesoActividad: 'Respuesta ante emergencias con residuos peligrosos',
        residuoRelacionado: 'Residuos peligrosos inflamables, reactivos o tóxicos',
        responsable: resp,
        plazo: 'Inmediato ante incidente',
        frecuencia: 'Ante evento crítico',
        indicador: `Reporte de emergencia ambiental y comunicación a la autoridad en ${cont.comunicacionAutoridadHoras || 24} horas`,
        evidenciaCumplimiento: 'Informe preliminar de emergencia y registro de reposición de insumos de contingencia',
        pagina: 'Sección 8: Emergencias',
        pagina_pdf: 'Sección 8',
        seccion: '8. Plan de contingencias',
        textoFuente: `Equipamiento: ${equip}. Resp: ${resp}. Tel: ${cont.telefonoEmergencia || 'No identificado'}`,
        observacion: 'Protocolo de notificación obligatoria a la autoridad ambiental dentro de las 24 horas.',
        origen: 'PMMRS generado',
      })
    );
  }

  // 11. Monitoring and Indicators
  const indicadores = Array.isArray(safeData.indicadores) ? safeData.indicadores : [];
  indicadores.forEach((ind) => {
    if (!ind) return;
    const resp = ind.responsable || safeData.funcionesResponsable?.nombres || 'No identificado';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Monitoreo del indicador "${ind.nombreIndicador || 'Indicador'}": fórmula ${ind.formulaCalculo || 'No definida'}, meta establecida en ${ind.meta || 'No definida'}.`,
        categoria: 'Seguimiento e indicadores',
        etapa: 'Operación',
        procesoActividad: 'Seguimiento del desempeño ambiental del PMMRS',
        residuoRelacionado: 'Flujo general de residuos',
        responsable: resp,
        plazo: 'Evaluación periódica',
        frecuencia: ind.frecuencia || 'Anual',
        indicador: ind.nombreIndicador || 'Indicador PMMRS',
        evidenciaCumplimiento: ind.medioVerificacion || `Ficha técnica del indicador con valor vs meta (${ind.meta || 'meta'})`,
        pagina: 'Sección 9: Indicadores',
        pagina_pdf: 'Sección 9',
        seccion: '9. Indicadores de gestión y seguimiento',
        textoFuente: `Indicador: ${ind.nombreIndicador}. Fórmula: ${ind.formulaCalculo}. Meta: ${ind.meta}`,
        observacion: `Frecuencia de medición: ${ind.frecuencia || 'Anual'}.`,
        origen: 'PMMRS generado',
      })
    );
  });

  // 12. Implementation Schedule
  const cronograma = Array.isArray(safeData.cronograma) ? safeData.cronograma : [];
  cronograma.forEach((item) => {
    if (!item) return;
    const resp = item.responsable || 'No identificado';
    const plazo = item.plazo || 'Según cronograma';
    const frec = item.frecuencia || 'Según cronograma';
    rawCommitments.push(
      createCommitmentItem({
        id: `COM-${String(counter++).padStart(3, '0')}`,
        numero: counter - 1,
        compromiso: `Ejecución de actividad programada: ${item.actividad || 'Actividad PMMRS'} (Plazo: ${plazo}).`,
        categoria: 'Cronograma',
        etapa: item.etapa || 'Operación',
        procesoActividad: 'Cumplimiento del cronograma de actividades del PMMRS',
        residuoRelacionado: 'Gestión general de residuos',
        responsable: resp,
        plazo,
        frecuencia: frec,
        indicador: `Ejecución de la actividad: ${item.actividad || 'Actividad PMMRS'}`,
        evidenciaCumplimiento: 'Acta de ejecución de actividad o informe de avance trimestral',
        pagina: 'Sección 10: Cronograma',
        pagina_pdf: 'Sección 10',
        seccion: '10. Cronograma de implementación',
        textoFuente: `Actividad: ${item.actividad}. Plazo: ${item.plazo}. Responsable: ${item.responsable}`,
        observacion: item.obligacionLegalAsociada
          ? `Obligación asociada: ${item.obligacionLegalAsociada}`
          : 'Actividad programada del plan.',
        origen: 'PMMRS generado',
      })
    );
  });

  // 13. Technical Responsible Functions
  const funciones = Array.isArray(safeData.funcionesResponsable?.funciones) ? safeData.funcionesResponsable.funciones : [];
  if (funciones.length > 0) {
    const respName = safeData.funcionesResponsable?.nombres || safeData.generalInfo?.responsableTecnico || 'No identificado';
    funciones.forEach((func) => {
      if (!func || typeof func !== 'string') return;
      rawCommitments.push(
        createCommitmentItem({
          id: `COM-${String(counter++).padStart(3, '0')}`,
          numero: counter - 1,
          compromiso: func,
          categoria: 'Responsabilidades',
          etapa: 'Operación',
          procesoActividad: 'Supervisión técnica de la gestión de residuos',
          residuoRelacionado: 'Todos los residuos del ámbito no municipal',
          responsable: respName,
          plazo: 'Durante el ejercicio de funciones',
          frecuencia: 'Continua',
          indicador: 'Firma de manifiestos y libro de actas de supervisión',
          evidenciaCumplimiento: 'Libro de registro de residuos y reportes con colegiatura CIP habilitada',
          pagina: 'Sección 12: Responsable Técnico',
          pagina_pdf: 'Sección 12',
          seccion: '12. Funciones del responsable técnico',
          textoFuente: func,
          observacion: `Responsabilidad a cargo de ${respName} (${safeData.funcionesResponsable?.cargo || 'Responsable Técnico'}).`,
          origen: 'PMMRS generado',
        })
      );
    });
  }

  // Deduplication and Contradiction detection
  const consolidated = deduplicateAndAnalyzeCommitments(rawCommitments);

  const resumen = calculateCommitmentsSummary(consolidated);

  return {
    id: `MATRIZ-${Date.now()}`,
    fechaAnalisis: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    nombreTitular: titular,
    nombreProyecto: proyecto,
    archivoAnalizado: 'PMMRS estructurado en la aplicación',
    origen: 'PMMRS generado',
    totalPaginas: 13,
    compromisos: consolidated,
    resumen,
    notaAlcance: COMMITMENT_DISCLAIMER_NOTE,
  };
}

/**
 * Deduplicates commitments representing the same action across sections,
 * recording related pages/sections and checking for internal contradictions.
 */
function deduplicateAndAnalyzeCommitments(items: PmmrsCommitment[]): PmmrsCommitment[] {
  const result: PmmrsCommitment[] = [];

  for (const item of items) {
    // Look for existing similar commitment
    const existingIndex = result.findIndex((r) => isSimilarAction(r.compromiso, item.compromiso));

    if (existingIndex >= 0) {
      // Consolidate into existing
      const existing = result[existingIndex];
      if (!existing.paginasRelacionadas.includes(item.pagina)) {
        existing.paginasRelacionadas.push(item.pagina);
      }
      // If the other had better info, complete the missing fields
      if (existing.responsable.includes('No identificado') && !item.responsable.includes('No identificado')) {
        existing.responsable = item.responsable;
      }
      if (existing.plazo.includes('No identificado') && !item.plazo.includes('No identificado')) {
        existing.plazo = item.plazo;
      }
      if (existing.indicador.includes('No identificado') && !item.indicador.includes('No identificado')) {
        existing.indicador = item.indicador;
      }
      // Re-evaluate formulation status
      existing.estadoFormulacion = evaluateFormulationStatus(
        existing.compromiso,
        existing.responsable,
        existing.plazo,
        existing.frecuencia,
        existing.indicador
      );
    } else {
      result.push({ ...item });
    }
  }

  // Detect internal contradictions among consolidated commitments
  checkContradictions(result);

  return result.map((item, idx) => ({
    ...item,
    numero: idx + 1,
    documento: item.documento || 'PMMRS analizado',
    pagina_pdf: item.pagina_pdf || item.pagina || '1',
    pagina_impresa: item.pagina_impresa || item.pagina || 'No identificada',
    seccion: item.seccion || 'Cuerpo del PMMRS',
    texto_fuente: item.texto_fuente || item.textoFuente || item.compromiso,
    compromiso_normalizado: item.compromiso_normalizado || item.compromiso,
    indicador_evidencia: item.indicador_evidencia || item.indicador || 'No identificado',
    decision_validacion: item.decision_validacion || 'CONFIRMADO',
    justificacion_validacion:
      item.justificacion_validacion || 'Obligación técnica verificable conforme al documento.',
    nivel_confianza: item.nivel_confianza || 'ALTO',
    posible_duplicado: Boolean(item.posible_duplicado),
    registros_relacionados: item.registros_relacionados || 'Ninguno',
    observaciones: item.observaciones || item.observacion || 'Sin observaciones adicionales.',
    estado: item.estado || item.estadoFormulacion || 'PARCIAL',
  }));
}

/**
 * Compares two commitment statements to decide if they represent the same concrete action.
 */
function isSimilarAction(a: string, b: string): boolean {
  const normA = a.toLowerCase().replace(/[^a-záéíóú0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const normB = b.toLowerCase().replace(/[^a-záéíóú0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  if (normA === normB) return true;

  const wordsA = new Set(normA.split(' ').filter((w) => w.length > 3));
  const wordsB = new Set(normB.split(' ').filter((w) => w.length > 3));

  if (wordsA.size === 0 || wordsB.size === 0) return false;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const similarity = (2 * intersection) / (wordsA.size + wordsB.size);
  return similarity > 0.65;
}

/**
 * Checks for contradictions among commitments (e.g. conflicting destinations, contradictory responsibilities).
 */
function checkContradictions(items: PmmrsCommitment[]): void {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      // Example 1: Contradictory destinations for same waste (e.g. valorization vs disposal without segregation distinction)
      if (
        a.residuoRelacionado &&
        b.residuoRelacionado &&
        a.residuoRelacionado.toLowerCase() === b.residuoRelacionado.toLowerCase() &&
        !a.residuoRelacionado.includes('Todos') &&
        !a.residuoRelacionado.includes('General')
      ) {
        if (
          (a.categoria === 'Valorización' && b.categoria === 'Disposición final') ||
          (a.categoria === 'Disposición final' && b.categoria === 'Valorización')
        ) {
          const detail = `Diferencia de destino para el residuo "${a.residuoRelacionado}": se indica valorización en ${a.pagina} y disposición final en ${b.pagina} sin delimitar subfracciones.`;
          a.posibleContradiccion = {
            hayContradiccion: true,
            detalle: detail,
            compromisoRelacionadoId: b.id,
            paginaRelacionada: b.pagina,
            textoContradictorio: b.compromiso,
          };
          b.posibleContradiccion = {
            hayContradiccion: true,
            detalle: detail,
            compromisoRelacionadoId: a.id,
            paginaRelacionada: a.pagina,
            textoContradictorio: a.compromiso,
          };
        }
      }

      // Example 2: Contradictory responsible persons for identical activity
      if (
        isSimilarAction(a.compromiso, b.compromiso) &&
        a.responsable &&
        b.responsable &&
        !a.responsable.includes('No identificado') &&
        !b.responsable.includes('No identificado') &&
        a.responsable.toLowerCase() !== b.responsable.toLowerCase()
      ) {
        const detail = `Responsable divergente para acción similar: asignado a "${a.responsable}" en ${a.pagina} y a "${b.responsable}" en ${b.pagina}.`;
        a.posibleContradiccion = {
          hayContradiccion: true,
          detalle: detail,
          compromisoRelacionadoId: b.id,
          paginaRelacionada: b.pagina,
        };
        b.posibleContradiccion = {
          hayContradiccion: true,
          detalle: detail,
          compromisoRelacionadoId: a.id,
          paginaRelacionada: a.pagina,
        };
      }
    }
  }
}

/**
 * FLUJO B (Fallback determinístico): Extrae compromisos directamente analizando el texto del PDF
 */
export function extractCommitmentsDeterministic(extraction: PdfExtractionResult): CommitmentsMatrixReport {
  const extractedCommitments: PmmrsCommitment[] = [];
  const fileName = extraction.fileName;

  // Attempt to extract titular from first 2 pages
  let titularName = '';
  const firstPagesText = extraction.pages
    .slice(0, 2)
    .map((p) => p.text)
    .join(' ');
  const titularMatch = firstPagesText.match(/(?:empresa|titular|razón social|propietario)[:\s]+([A-ZÁÉÍÓÚ\s]{4,60})/i);
  if (titularMatch) {
    titularName = titularMatch[1].trim();
  }

  let counter = 1;

  // Patterns strictly linked to PMMRS obligations
  const commitmentPatterns: Array<{ regex: RegExp; category: CommitmentCategory; defaultEtapa: string }> = [
    {
      regex: /(?:se implementará|implementar el código de colores|recipientes para segregación|segregará en)\s+([^.;\n]{25,200})/gi,
      category: 'Segregación',
      defaultEtapa: 'Operación',
    },
    {
      regex: /(?:se almacenará|almacenará los residuos peligrosos|almacén temporal)\s+([^.;\n]{25,200})/gi,
      category: 'Almacenamiento',
      defaultEtapa: 'Operación',
    },
    {
      regex: /(?:se entregará a una eo-rs|contratará una eo-rs|transporte externo|recolectará mediante)\s+([^.;\n]{25,200})/gi,
      category: 'Transporte',
      defaultEtapa: 'Operación',
    },
    {
      regex: /(?:se valorizará|valorización de residuos|reciclaje de|compostaje de)\s+([^.;\n]{25,200})/gi,
      category: 'Valorización',
      defaultEtapa: 'Operación',
    },
    {
      regex: /(?:disposición final en relleno|se dispondrá en relleno|confinamiento en)\s+([^.;\n]{25,200})/gi,
      category: 'Disposición final',
      defaultEtapa: 'Operación',
    },
    {
      regex: /(?:se reportará|reportará en sigersol|declaración anual de manejo|manifiestos de)\s+([^.;\n]{25,200})/gi,
      category: 'Reportes',
      defaultEtapa: 'Operación',
    },
    {
      regex: /(?:se llevará un registro|registro de generación|kardex de almacén|bitácora de)\s+([^.;\n]{25,200})/gi,
      category: 'Registros',
      defaultEtapa: 'Operación',
    },
    {
      regex: /(?:en caso de emergencia|plan de contingencia|ante derrame|ante incendio|comunicará a oefa)\s+([^.;\n]{25,200})/gi,
      category: 'Emergencias',
      defaultEtapa: 'Emergencias',
    },
    {
      regex: /(?:minimizará|reducción en la fuente|buenas prácticas para reducir)\s+([^.;\n]{25,200})/gi,
      category: 'Prevención y minimización',
      defaultEtapa: 'Operación',
    },
  ];

  // Scan each page
  for (const page of extraction.pages) {
    const pageText = page.text;
    const pageNumStr = `Página ${page.pageNumber}`;

    // Skip table of contents
    const isIndice =
      pageText.toLowerCase().includes('tabla de contenido') || pageText.toLowerCase().includes('índice general');
    if (isIndice) continue;

    for (const pattern of commitmentPatterns) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(pageText)) !== null) {
        const actionSnippet = match[1]?.trim() || '';
        if (actionSnippet.length < 20) continue;

        const fullStatement = (match[0].slice(0, 1).toUpperCase() + match[0].slice(1)).trim();

        // Extract responsible if mentioned
        let responsible = 'No identificado';
        const respMatch = pageText.match(/(?:responsable|a cargo de|ejecutado por)[:\s]+([A-ZÁÉÍÓÚa-z\s]{5,40})/i);
        if (respMatch) {
          responsible = respMatch[1].trim();
        }

        // Extract timing
        let timing = 'No identificado';
        let frecuencia = 'No identificada';
        const freqMatch = actionSnippet.match(
          /(diaria|semanal|quincenal|mensual|trimestral|semestral|anual)mente?/i
        );
        if (freqMatch) {
          frecuencia = freqMatch[0].toLowerCase();
        }

        const deadlineMatch = actionSnippet.match(
          /(?:plazo de|dentro de los|máximo|en el mes de)\s+([^,\n.]{3,30})/i
        );
        if (deadlineMatch) {
          timing = deadlineMatch[0].trim();
        }

        // Extract indicator
        let indicator = 'No identificado';
        const indMatch = pageText.match(/(?:indicador|medio de verificación|evidencia)[:\s]+([^.,\n]{5,50})/i);
        if (indMatch) {
          indicator = indMatch[1].trim();
        }

        // Check if statement is a legal citation
        const isNormCitation =
          fullStatement.toLowerCase().includes('conforme a la ley') ||
          fullStatement.toLowerCase().includes('según el artículo') ||
          fullStatement.toLowerCase().includes('en cumplimiento del d.l.');

        if (!isNormCitation && fullStatement.length > 25) {
          extractedCommitments.push(
            createCommitmentItem({
              id: `COM-${String(counter++).padStart(3, '0')}`,
              numero: counter - 1,
              compromiso: fullStatement,
              categoria: pattern.category,
              etapa: pattern.defaultEtapa,
              procesoActividad: 'Gestión y manejo de residuos sólidos',
              residuoRelacionado: 'No especificado en el fragmento',
              responsable: responsible,
              plazo: timing,
              frecuencia,
              indicador: indicator,
              evidenciaCumplimiento:
                indicator !== 'No identificado'
                  ? indicator
                  : 'Documentación o registro fotográfico de ejecución',
              pagina: pageNumStr,
              pagina_pdf: page.pageNumber,
              pagina_impresa: pageNumStr,
              seccion: detectSectionFromPage(pageText),
              textoFuente: match[0],
              observacion: 'Compromiso detectado textualmente en el documento.',
              origen: 'PDF analizado',
              documento: fileName,
            })
          );
        }
      }
    }
  }

  // Deduplicate and detect contradictions
  const consolidated = deduplicateAndAnalyzeCommitments(extractedCommitments);

  const resumen = calculateCommitmentsSummary(consolidated);

  return {
    id: `MATRIZ-PDF-${Date.now()}`,
    fechaAnalisis: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    nombreTitular: titularName || 'Titular identificado en PDF',
    nombreProyecto: fileName.replace(/\.pdf$/i, ''),
    archivoAnalizado: fileName,
    origen: 'PDF analizado',
    totalPaginas: extraction.totalPages,
    compromisos: consolidated,
    resumen,
    notaAlcance: COMMITMENT_DISCLAIMER_NOTE,
  };
}

function detectSectionFromPage(text: string): string {
  if (text.match(/objetivo/i)) return 'Objetivos del PMMRS';
  if (text.match(/minimiza|prevenci/i)) return 'Estrategias de Minimización';
  if (text.match(/segrega|código de color/i)) return 'Segregación y Almacenamiento';
  if (text.match(/almacén|almacenamiento/i)) return 'Almacenamiento Central';
  if (text.match(/recolec|transporte|eo-rs/i)) return 'Recolección y Transporte';
  if (text.match(/valoriza|recicla/i)) return 'Valorización de Residuos';
  if (text.match(/disposici|relleno/i)) return 'Disposición Final';
  if (text.match(/contingencia|emergencia|derrame/i)) return 'Plan de Emergencias';
  if (text.match(/indicador|seguimiento/i)) return 'Indicadores y Control';
  if (text.match(/cronograma/i)) return 'Cronograma de Implementación';
  if (text.match(/responsable|cip/i)) return 'Funciones y Responsabilidades';
  return 'Cuerpo General del Documento';
}
