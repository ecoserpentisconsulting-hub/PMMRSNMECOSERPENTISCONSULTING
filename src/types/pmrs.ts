export type WasteHazardType = 'Peligroso' | 'No peligroso';
export type WasteScopeType = 'No municipal' | 'Similar a municipal';

export type EconomicSector =
  | 'Agroindustria'
  | 'Industria manufacturera'
  | 'Construcción'
  | 'Minería'
  | 'Energía'
  | 'Hidrocarburos'
  | 'Comercio y servicios'
  | 'Salud'
  | 'Transporte'
  | 'Pesca'
  | 'Otro';

export interface WasteItem {
  id: string;
  nombre: string;
  etapa: 'Planificación' | 'Construcción' | 'Operación' | 'Mantenimiento' | 'Cierre';
  procesoGenerador: string;
  clasificacionManejo: WasteHazardType;
  clasificacionGestion: WasteScopeType;
  codigoConvenioBasilea?: string; // e.g., A4130, B3010, B2040
  caracteristicasPeligrosidad?: string; // e.g., "Tóxico", "Inflamable", "Corrosivo"
  cantidadMensual: number;
  unidad: 'tn/mes' | 'kg/mes' | 'm3/mes' | 'unidades/mes';
  cantidadAnual: number;
  metodoEstimacion: string;
}

export interface MinimizationStrategy {
  id: string;
  residuoOProceso: string;
  etapa: string;
  tipoEstrategia: 'Prevención en origen' | 'Sustitución de insumos' | 'Ecodiseño' | 'Retornabilidad de envases' | 'Aprovechamiento material descarte' | 'Compostaje interno' | 'Logística inversa';
  descripcionMedida: string;
  metaReduccion: string;
  responsable: string;
}

export interface EnvironmentalMeasure {
  id: string;
  etapa: string;
  componenteAfectado: 'Suelo' | 'Agua superficial y subterránea' | 'Aire y emisiones' | 'Salud de trabajadores' | 'Flora y Fauna';
  impactoRiesgo: string;
  medidaMitigacion: string;
  frecuenciaMonitoreo: string;
  responsable: string;
}

export interface PmmrsIndicator {
  id: string;
  nombreIndicador: string;
  formulaCalculo: string;
  meta: string;
  frecuencia: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual';
  responsable: string;
  medioVerificacion: string;
}

export interface ScheduleItem {
  id: string;
  actividad: string;
  etapa: string;
  plazo: string;
  frecuencia: string;
  responsable: string;
  obligacionLegalAsociada?: string;
}

export interface BudgetItem {
  id: string;
  rubro: string;
  descripcion: string;
  costoEstimadoPEN: number;
  fuenteFinanciamiento: string;
  periodo: string;
}

export interface PmmrsData {
  generalInfo: {
    razonSocial: string;
    ruc: string;
    sector?: EconomicSector;
    sectorLibre?: string;
    departamento: string;
    provincia: string;
    distrito: string;
    direccion: string;
    coordenadasUTM: string;
    actividadEconomica: string;
    ciiu: string;
    representanteLegal: string;
    dniRepresentante: string;
    responsableTecnico: string;
    profesionResponsable: string;
    cipResponsable: string;
    emailResponsable: string;
    telefonoResponsable: string;
    descripcionOperacion: string;
    etapasOperativas: string[];
    vidaUtilAnios: number;
  };
  objetivos: {
    general: string;
    especificos: string[];
  };
  alcance: {
    descripcion: string;
    instalacionesComprendidas: string[];
    personalComprendido: string;
    contratistasComprendidos: string;
  };
  fuentesGeneracion: Array<{
    id: string;
    etapa: string;
    proceso: string;
    actividades: string;
    residuosGenerados: string;
  }>;
  inventarioResiduos: WasteItem[];
  estrategiasMinimizacion: MinimizationStrategy[];
  gestionManejo: {
    segregacion: {
      descripcion: string;
      cumpleNTP: boolean;
      colores: Array<{
        tipo: string;
        color: string;
        colorHex: string;
        ejemplos: string;
      }>;
    };
    recoleccionInterna: {
      frecuencia: string;
      horarios: string;
      equipamiento: string;
      epps: string[];
      rutasInternas: string;
    };
    almacenamiento: {
      primario: string;
      intermedio: string;
      centralNoPeligrosos: string;
      centralPeligrosos: {
        cumpleLosaImpermeable: boolean;
        cumpleSardinelContencion: boolean;
        cumpleTechoVentilacion: boolean;
        cumpleSenaleticaPeligro: boolean;
        cumpleKitAntiderrame: boolean;
        cumpleExtintorContraIncendio: boolean;
        tiempoMaximoMeses: number; // Máximo 12 meses según Art. 55 D.S. 014-2017
        descripcion: string;
      };
    };
    transporteExterno: {
      nombreEORS: string;
      registroMINAM: string;
      autorizacionMTC: string;
      frecuenciaRecojo: string;
    };
    valorizacion: {
      aplica: boolean;
      tipo: string;
      operadorOPlanta: string;
      descripcion: string;
    };
    disposicionFinal: {
      tipoInfraestructura: 'Relleno de Seguridad' | 'Relleno Sanitario' | 'Escombrera autorizada';
      nombrePlanta: string;
      resolucionAprobacionIGA: string;
      ubicacion: string;
      operadorResponsable: string;
    };
  };
  medidasAmbientales: EnvironmentalMeasure[];
  planEmergencias: {
    responsableEmergencia: string;
    telefonoEmergencia: string;
    procedimientoDerrame: string;
    procedimientoIncendio: string;
    procedimientoFuga: string;
    comunicacionAutoridadHoras: number; // 24 horas por ley
    equipamientoEmergencia: string[];
  };
  indicadores: PmmrsIndicator[];
  cronograma: ScheduleItem[];
  presupuesto: BudgetItem[];
  funcionesResponsable: {
    nombres: string;
    cargo: string;
    profesion: string;
    cip: string;
    funciones: string[];
  };
}

export type ReviewStatus = 'Cumple' | 'Parcial' | 'No identificado' | 'No evaluable';

export interface AuditCriterion {
  id: string;
  seccionNumero: number;
  seccionTitulo: string;
  requisito: string;
  baseLegal: string;
  resumenNormativo: string;
  criterioEvaluacion: string;
  estado: ReviewStatus;
  paginaOSeccion?: string;
  evidenciaLiteral?: string;
  hallazgoExplicacion: string;
  sustentoFaltante?: string;
  accionCorrectiva: string;
  esVerificadoManualmente?: boolean;
}

export interface AuditContradiction {
  id: string;
  titulo: string;
  descripcion: string;
  seccionesInvolucradas: string;
  gravedad: 'Alta' | 'Media' | 'Baja';
  criterioAfectadoId?: string;
  citaLiteral1?: string;
  citaLiteral2?: string;
  recomendacion: string;
}

export interface AuditReport {
  id: string;
  fechaEvaluacion: string;
  nombreArchivo: string;
  totalPaginas: number;
  tamanoArchivoMB: number;
  esTextoSeleccionable: boolean;
  empresaIdentificada?: string;
  rucIdentificado?: string;
  sector?: EconomicSector;
  sectorLibre?: string;
  sectorNormativaConfigurada: boolean;
  sectorMensajeNormativa?: string;
  modoAnalisis: 'IA + reglas' | 'Solo reglas locales' | 'OCR / Visión IA' | 'Motor normativo (Documento escaneado)' | string;
  mensajeModoAnalisis?: string;
  esDocumentoEscaneado?: boolean;
  paginasEscaneadas?: number;
  resumenEjecutivo: string;
  puntajeGlobal: number; // 0 - 100
  formulaPuntaje: string;
  conteoEstados: {
    cumple: number;
    parcial: number;
    noIdentificado: number;
    noEvaluable: number;
    totalEvaluables: number;
  };
  criterios: AuditCriterion[];
  contradicciones: AuditContradiction[];
  alertaPlaguicidas?: {
    detectada: boolean;
    detalle: string;
    accionRequerida: string;
  };
  limitacionesRevision: string[];
  advertenciaLegal: string;
}

// =========================================================================
// MATRIZ DE COMPROMISOS DEL PMMRS
// =========================================================================

export type CommitmentFormulationStatus = 'COMPLETO' | 'PARCIAL' | 'AMBIGUO' | 'NO EVALUABLE';
export type CommitmentValidationDecision = 'CONFIRMADO' | 'AMBIGUO' | 'RECHAZADO';
export type CommitmentConfidenceLevel = 'ALTO' | 'MEDIO' | 'BAJO';
export type CommitmentReviewStatus = 'Pendiente' | 'Validado' | 'Editado' | 'Descartado';
export type CommitmentRecordIntegrity = 'Completo' | 'Parcial' | 'Requiere revisión';

export type CommitmentAnalysisStatus =
  | 'EXITO_CON_COMPROMISOS'
  | 'EXITO_SIN_COMPROMISOS'
  | 'INCOMPLETO'
  | 'ERROR_LECTURA_PDF'
  | 'ERROR_CONEXION_GEMINI'
  | 'ERROR_ESTRUCTURA_JSON'
  | 'ERROR_VALIDACION'
  | 'ERROR_PAGINAS_NO_PROCESADAS';

export interface DiagnosticInfo {
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
  rutaSolicitada?: string;
  metodoHttp?: string;
  codigoRespuestaHttp?: number | string;
  contentTypeRecibido?: string;
  confirmacionServidor?: string;
  estadoGeminiApiKey?: 'configurada' | 'no configurada' | string;
  pdfEnviadoAlSdk?: string;
  estadoRespuestaGemini?: string;
  candidatosAntesValidacion?: number;
  fragmentoRespuestaNoJson?: string | null;
  entornoEjecucion?: string;
  timestampDiagnostico?: string;
  respuestaHttpRaw?: string;
  rutasActivasServidor?: string[];
  diagnosticoExtractor?: {
    tipoRecibido: string;
    longitud: number;
    primerasPorciones: string;
    estructuraRaizDetectada: string;
    candidatesExiste: boolean;
    candidatesEsArray: boolean;
    totalCandidatos?: number;
  };
  diagnosticoValidador?: {
    tipoRecibido: string;
    longitud: number;
    primerasPorciones: string;
    estructuraRaizDetectada: string;
    validacionesExiste: boolean;
    validacionesEsArray: boolean;
    totalValidaciones: number;
    totalCandidatosEntrada: number;
    idsSinCorrespondencia: string[];
    respuestaBruta?: string;
  };
}

export interface CandidateValidationContract {
  candidateId: string;
  estado: 'validado' | 'parcial' | 'rechazado' | 'ambiguo';
  integridad: 'completo' | 'parcial';
  observaciones: string;
  responsable: string | null;
  frecuencia: string | null;
  plazo: string | null;
  indicador: string | null;
  evidenciaSugerida: string | null;
  confidence: number;
}

export interface ExtractorCandidateContract {
  id: string;
  commitment: string;
  sourceText: string;
  page: number;
  section: string;
  topic: string;
  responsible: string | null;
  deadline: string | null;
  frequency: string | null;
  indicator: string | null;
  confidence: number;
}

// =========================================================================
// SCHEMA CANÓNICO DE EXTRACCIÓN DE COMPROMISOS (CommitmentExtractionResult)
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

export interface CanonicalCommitmentItem extends CanonicalCommitment {
  numero?: number;
  documento?: string;
  pagina_pdf?: number | string;
  pagina_impresa?: string;
  compromiso_normalizado?: string;
  residuo_proceso?: string;
  indicador_evidencia?: string;
  estado_cumplimiento?: CommitmentFormulationStatus;
  decision_validacion?: CommitmentValidationDecision;
  justificacion_validacion?: string;
  nivel_confianza?: CommitmentConfidenceLevel;
  posible_duplicado?: boolean;
  registros_relacionados?: string[] | string;
  alertas?: string[] | string;
  estado?: CommitmentFormulationStatus;
  observaciones?: string;
}

export interface CommitmentExtractionResult {
  compromisos: CanonicalCommitmentItem[];
  contradicciones: CanonicalContradiction[];
  metadata: CanonicalExtractionMetadata;
  candidatos?: any[];
  diagnostico?: DiagnosticInfo;
  modeloUtilizado?: string;
  tipoExtraccion?: 'texto' | 'OCR/multimodal' | 'PDF nativo/multimodal';
  alertaCalidadLectura?: string;
}

export type CommitmentCategory =
  | 'Prevención y minimización'
  | 'Segregación'
  | 'Almacenamiento'
  | 'Recolección'
  | 'Transporte'
  | 'Valorización'
  | 'Disposición final'
  | 'Residuos peligrosos'
  | 'Capacitación'
  | 'Registros'
  | 'Reportes'
  | 'Medidas ambientales'
  | 'Emergencias'
  | 'Seguimiento e indicadores'
  | 'Cronograma'
  | 'Responsabilidades'
  | 'Otros';

export interface PmmrsCommitment {
  // Los 22 campos exigidos de forma estricta + 13 columnas profesionales y auditoría:
  id: string;
  codigo?: string; // PMMRS-01, PMMRS-02...
  id_candidato?: string; // CAND-PMMRS-001 (solo en Auditoría)
  numero: number;
  documento: string;
  pagina_pdf: number | string;
  pagina_impresa: string;
  seccion: string;
  seccion_tabla?: string;
  texto_fuente: string;
  compromiso_normalizado: string;
  categoria: CommitmentCategory;
  tema?: string;
  tipo?: string;
  etapa: string;
  residuo_proceso: string;
  responsable: string;
  plazo: string;
  frecuencia: string;
  frecuencia_plazo?: string;
  indicador_evidencia: string;
  evidencia_sugerida?: string;
  estado_cumplimiento: CommitmentFormulationStatus;
  decision_extractor?: string;
  decision_validacion: CommitmentValidationDecision;
  justificacion_validacion: string;
  nivel_confianza: CommitmentConfidenceLevel;
  posible_duplicado: boolean;
  registros_relacionados: string[] | string;
  alertas: string[] | string;
  campos_no_identificados?: string[] | string;
  resultado_auditoria_omisiones?: string;
  estado_revision?: CommitmentReviewStatus;
  integridad_registro?: CommitmentRecordIntegrity;

  // Campos de retrocompatibilidad y visualización
  compromiso: string;
  procesoActividad: string;
  residuoRelacionado: string;
  indicador: string;
  evidenciaCumplimiento: string;
  pagina: string;
  textoFuente: string;
  estado: CommitmentFormulationStatus;
  estadoFormulacion: CommitmentFormulationStatus;
  observaciones: string;
  observacion: string;
  paginasRelacionadas: string[];
  posibleContradiccion?: {
    hayContradiccion: boolean;
    detalle?: string;
    compromisoRelacionadoId?: string;
    paginaRelacionada?: string;
    textoContradictorio?: string;
  };
  origen: 'PMMRS generado' | 'PDF analizado';
}

export interface CommitmentsMatrixReport {
  id: string;
  fechaAnalisis: string;
  nombreTitular: string;
  nombreProyecto: string;
  archivoAnalizado: string;
  origen: 'PMMRS generado' | 'PDF analizado';
  tipoExtraccion?: 'texto' | 'OCR/multimodal' | 'PDF nativo/multimodal';
  alertaCalidadLectura?: string;
  totalPaginas?: number;
  paginasNoEvaluables?: number;
  paginasConAdvertencia?: number[];
  paginasRequierenOcr?: number[];
  candidatosExtraidosTotal?: number;
  candidatosEvaluadosTotal?: number;
  incluidosEnMatrizTotal?: number;
  compromisosIncluidosTotal?: number;
  compromisosConfirmadosTotal?: number;
  compromisosAmbiguosTotal?: number;
  compromisosRechazadosTotal?: number;
  omisionesRecuperadasTotal?: number;
  resumenAuditoriaOmisiones?: string;
  resultadoAuditoriaOmisiones?: string;
  compromisos: PmmrsCommitment[];
  resumen: {
    totalIdentificados: number;
    completos: number;
    parciales: number;
    ambiguos: number;
    noEvaluables: number;
    confirmados: number;
    rechazados: number;
    sinResponsable: number;
    sinPlazoFrecuencia: number;
    sinIndicador: number;
    conPosibleContradiccion: number;
    validados?: number;
    pendientes?: number;
    editados?: number;
    descartados?: number;
    posiblesDuplicados?: number;
  };
  notaAlcance: string;
}

