import { NormativeDocumentMeta } from '../utils/normativePdfGenerator';

export interface SectorialNormativeDocument {
  id: string;
  sector: string;
  codigo: string;
  titulo: string;
  entidad: string;
  anio: string;
  descripcion: string;
  fuenteOficial: string;
  fuenteUrl: string;
  estado: string;
}

export const MAIN_NORMATIVE_DOCUMENTS: NormativeDocumentMeta[] = [
  {
    id: 'rm-089-2023-minam',
    codigo: 'R.M. N.º 089-2023-MINAM',
    titulo: 'Contenido Mínimo del Plan de Minimización y Manejo de Residuos Sólidos No Municipales',
    entidad: 'Ministerio del Ambiente (MINAM)',
    anio: '2023',
    fechaPublicacion: '22 de marzo de 2023 (Diario Oficial El Peruano)',
    fuenteOficial: 'MINAM / Diario Oficial El Peruano',
    fuenteUrl: 'https://www.gob.pe/institucion/minam/normas-legales/4134989-089-2023-minam',
    versionConsultada: 'Texto original oficial publicado en el diario oficial El Peruano (22/03/2023).',
    descripcion:
      'Establece la estructura estandarizada y los 12 contenidos mínimos obligatorios que debe incluir el Plan de Minimización y Manejo de Residuos Sólidos No Municipales para titulares de actividades bajo fiscalización ambiental.',
    estadoAplicativo: 'Estructura directriz de los 13 pasos del módulo de elaboración y revisión técnica del PMMRS.',
    nombreArchivo: 'RM_089-2023-MINAM.pdf',
    esDescargable: true,
    esNTP: false,
    resumenArticulos: [
      {
        seccion: '1. Datos Generales',
        articulos: 'Num. 1 Anexo R.M. 089-2023',
        contenido:
          'Razón social, RUC, actividad económica CIIU, representante legal, coordenadas UTM (WGS84), vida útil y datos del responsable técnico colegiado.',
      },
      {
        seccion: '2. Objetivos y Alcance',
        articulos: 'Num. 2 Anexo R.M. 089-2023',
        contenido:
          'Objetivos cuantitativos de minimización y valorización; delimitación de frentes de obra, campamentos, talleres y empresas contratistas.',
      },
      {
        seccion: '3. Fuentes de Generación',
        articulos: 'Num. 3 Anexo R.M. 089-2023',
        contenido:
          'Identificación de los procesos productivos, auxiliares, mantenimiento y servicios de donde provienen los residuos.',
      },
      {
        seccion: '4. Inventario de Residuos',
        articulos: 'Num. 4 Anexo R.M. 089-2023',
        contenido:
          'Estimación mensual (tn/mes) y anual de residuos no peligrosos y peligrosos, codificación del Convenio de Basilea y características de peligrosidad.',
      },
      {
        seccion: '5. Minimización y Descarte',
        articulos: 'Num. 5 Anexo R.M. 089-2023 / Art. 4-5 D.L. 1278',
        contenido:
          'Estrategias de prevención en origen, ecodiseño, retorno de envases y aprovechamiento como material de descarte.',
      },
      {
        seccion: '6. Gestión y Manejo',
        articulos: 'Num. 6 Anexo R.M. 089-2023 / Art. 54-55 D.S. 014',
        contenido:
          'Segregación en código de colores NTP 900.058:2019, almacén de peligrosos estanco (losa, sardinel ≥110%, kit antiderrame), EO-RS autorizada y destino final.',
      },
      {
        seccion: '7. Medidas Ambientales',
        articulos: 'Num. 7 Anexo R.M. 089-2023',
        contenido:
          'Acciones de prevención y mitigación de impactos negativos sobre suelo, agua subterránea, calidad de aire y salud ocupacional.',
      },
      {
        seccion: '8. Plan de Emergencias',
        articulos: 'Num. 8 Anexo R.M. 089-2023 / Art. 50 D.S. 014',
        contenido:
          'Protocolos de actuación ante derrames de sustancias o residuos peligrosos, incendios, explosiones y reporte obligatorio a OEFA dentro de 24 horas.',
      },
      {
        seccion: '9. Indicadores',
        articulos: 'Num. 9 Anexo R.M. 089-2023',
        contenido:
          'Métricas de seguimiento con fórmula analítica, meta porcentual o cuantitativa, frecuencia y medio de verificación auditable.',
      },
      {
        seccion: '10. Cronograma',
        articulos: 'Num. 10 Anexo R.M. 089-2023',
        contenido:
          'Calendarización de inspecciones, mantenimiento de almacén, capacitaciones y reporte anual en SIGERSOL No Municipal.',
      },
      {
        seccion: '11. Presupuesto',
        articulos: 'Num. 11 Anexo R.M. 089-2023',
        contenido:
          'Partidas financieras en Soles (PEN) asignadas para compra de contenedores, EPPs especializados, servicio de EO-RS y monitoreo.',
      },
      {
        seccion: '12. Responsable Técnico',
        articulos: 'Num. 12 Anexo R.M. 089-2023',
        contenido:
          'Designación de ingeniero colegiado y habilitado (CIP), funciones asignadas y obligación de custodiar manifiestos por 5 años.',
      },
    ],
  },
  {
    id: 'dl-1278',
    codigo: 'Decreto Legislativo N.º 1278',
    titulo: 'Ley de Gestión Integral de Residuos Sólidos',
    entidad: 'Congreso de la República / Presidencia de la República',
    anio: '2016',
    fechaPublicacion: '23 de diciembre de 2016 (Diario Oficial El Peruano)',
    fuenteOficial: 'SPIJ (Minjus) / MINAM / El Peruano',
    fuenteUrl: 'https://www.gob.pe/institucion/minam/normas-legales/196614-1278',
    versionConsultada:
      'Texto con modificaciones incorporadas por el Decreto Legislativo N.º 1501 publicado en El Peruano (11/05/2020).',
    descripcion:
      'Marco legal general de la gestión integral de residuos sólidos en el territorio peruano, promoviendo la transición a la economía circular, la minimización en la fuente y la responsabilidad compartida.',
    estadoAplicativo:
      'Base normativa principal del sistema para la clasificación de residuos, delimitación de responsabilidades y obligaciones del generador no municipal.',
    nombreArchivo: 'DL_1278.pdf',
    esDescargable: true,
    esNTP: false,
    resumenArticulos: [
      {
        seccion: 'Principios y Economía Circular',
        articulos: 'Art. 4, 5 y 9',
        contenido:
          'Prioridad en la reducción y valorización material y energética frente a la disposición final. Reconocimiento del material de descarte no sujeto a la regulación de residuo.',
      },
      {
        seccion: 'Competencias de Autoridades Sectoriales',
        articulos: 'Art. 15 y 24',
        contenido:
          'Las autoridades sectoriales (PRODUCE, MIDAGRI, MINEM, VIVIENDA, etc.) norman, evalúan, supervisan y fiscalizan la gestión de los residuos no municipales en sus actividades.',
      },
      {
        seccion: 'Obligaciones del Generador No Municipal',
        articulos: 'Art. 34',
        contenido:
          'Segregar en la fuente, acondicionar y entregar residuos a EO-RS registradas en el MINAM; elaborar y reportar el PMMRS en el IGA correspondiente.',
      },
      {
        seccion: 'Residuos Similares a Municipales',
        articulos: 'Art. 47',
        contenido:
          'Manejo de residuos del ámbito no municipal similares a los del ámbito municipal mediante convenios o servicios formales con municipalidades distritales o provinciales.',
      },
      {
        seccion: 'Empresas Operadoras (EO-RS)',
        articulos: 'Art. 55 al 60',
        contenido:
          'Registro autoritativo expedido por el MINAM obligatorio para personas jurídicas que realizan servicios de recojo, transporte, valorización o disposición final.',
      },
      {
        seccion: 'Manifiestos de Residuos Peligrosos',
        articulos: 'Art. 57 y 78',
        contenido:
          'Suscripción del Manifiesto de Manejo de Residuos Sólidos Peligrosos entre generador, transportista y operador de disposición final, con archivo por 5 años.',
      },
    ],
  },
  {
    id: 'ds-014-2017-minam',
    codigo: 'D.S. N.º 014-2017-MINAM',
    titulo: 'Reglamento del Decreto Legislativo N.º 1278, Ley de Gestión Integral de Residuos Sólidos',
    entidad: 'Ministerio del Ambiente (MINAM)',
    anio: '2017',
    fechaPublicacion: '21 de diciembre de 2017 (Diario Oficial El Peruano)',
    fuenteOficial: 'MINAM / SPIJ / El Peruano',
    fuenteUrl: 'https://www.gob.pe/institucion/minam/normas-legales/196621-014-2017-minam',
    versionConsultada:
      'Texto reglamentario oficial con modificaciones del D.S. N.º 001-2022-MINAM y D.S. N.º 008-2024-MINAM.',
    descripcion:
      'Desarrolla los procedimientos técnicos y plazos específicos para el almacenamiento, transporte, valorización, reporte y contingencias de residuos sólidos en el Perú.',
    estadoAplicativo:
      'Referencia técnica directa para las condiciones del almacén central, reporte de emergencias ante OEFA y presentación ante SIGERSOL.',
    nombreArchivo: 'DS_014-2017-MINAM.pdf',
    esDescargable: true,
    esNTP: false,
    resumenArticulos: [
      {
        seccion: 'Instrumentos de Gestión Ambiental',
        articulos: 'Art. 48',
        contenido:
          'El PMMRS forma parte del instrumento de gestión ambiental (IGA). Si no cuenta con IGA, se presenta a la autoridad sectorial conforme a las normas que esta emita.',
      },
      {
        seccion: 'Reporte de Emergencias a OEFA',
        articulos: 'Art. 50',
        contenido:
          'Todo evento de derrame, incendio, explosión o contingencia con residuos peligrosos debe comunicarse al OEFA o entidad fiscalizadora dentro de las 24 horas de ocurrido.',
      },
      {
        seccion: 'Almacén Central de Residuos Peligrosos',
        articulos: 'Art. 54 y 55',
        contenido:
          'Debe contar con piso de concreto impermeable, sardinel perimetral de contención con capacidad para retener al menos 110% del contenedor mayor, techo, ventilación cruzada, extintores y kit antiderrame.',
      },
      {
        seccion: 'Tiempo Máximo de Almacenamiento',
        articulos: 'Art. 55 Num. 5',
        contenido:
          'El tiempo máximo de almacenamiento de residuos sólidos peligrosos no puede superar los doce (12) meses contados a partir de su generación.',
      },
      {
        seccion: 'Declaración Anual SIGERSOL',
        articulos: 'Art. 112',
        contenido:
          'Los generadores no municipales deben declarar anualmente las cantidades y el destino de sus residuos a través del SIGERSOL durante los primeros 15 días hábiles de abril.',
      },
    ],
  },
  {
    id: 'ntp-900-058-2019',
    codigo: 'NTP 900.058:2019',
    titulo: 'Gestión de Residuos. Código de Colores para el Almacenamiento de Residuos Sólidos (2.ª Edición)',
    entidad: 'Instituto Nacional de Calidad (INACAL)',
    anio: '2019',
    fechaPublicacion: '29 de marzo de 2019 (R.D. N.º 003-2019-INACAL/DN)',
    fuenteOficial: 'INACAL (Catálogo y Sala de Lectura Virtual)',
    fuenteUrl: 'https://www.inacal.gob.pe/normalizacion/categoria/sala-lectura-virtual',
    versionConsultada:
      'NTP 900.058:2019 GESTIÓN DE RESIDUOS. Código de colores para el almacenamiento de residuos sólidos. 2ª Edición.',
    descripcion:
      'Establece los colores a ser empleados para el almacenamiento seguro y segregación de residuos sólidos en recipientes, contenedores y bolsas plásticas a nivel nacional.',
    estadoAplicativo:
      'Alineamiento directo de la Tabla 2 (Ámbito No Municipal) con 7 colores obligatorios en el Paso 6 del asistente.',
    nombreArchivo: '',
    esDescargable: false,
    esNTP: true,
    resumenArticulos: [
      {
        seccion: 'Código de Colores - Ámbito No Municipal',
        articulos: 'Tabla 2 - NTP 900.058:2019',
        contenido:
          'Azul: Papel y Cartón • Blanco: Plásticos • Amarillo: Metales • Marrón: Orgánicos • Plomo: Vidrio • Rojo: Peligrosos • Negro: No aprovechables.',
      },
      {
        seccion: 'Rotulado y Simbología',
        articulos: 'Capítulo 6',
        contenido:
          'Los recipientes deben llevar rotulado visible en el frontis con el nombre del residuo y pictogramas de seguridad conforme a su naturaleza.',
      },
      {
        seccion: 'Protección de Propiedad Intelectual',
        articulos: 'Directiva INACAL / Ley 30224',
        contenido:
          'Las Normas Técnicas Peruanas son de carácter voluntario u obligatorio por remisión expresa de ley, y se encuentran bajo custodia institucional del INACAL.',
      },
    ],
  },
];

export const SECTORIAL_NORMATIVE_DOCUMENTS: SectorialNormativeDocument[] = [
  {
    id: 'midagri-agrario',
    sector: 'Agrario y Riego',
    codigo: 'D.S. N.º 005-2020-MINAGRI y R.M. D000164-2026-MIDAGRI',
    titulo: 'Reglamento de Gestión Ambiental del Sector Agrario y de Riego',
    entidad: 'Ministerio de Desarrollo Agrario y Riego (MIDAGRI)',
    anio: '2020 / 2026',
    descripcion:
      'Disposiciones sectoriales para el manejo de restos de poda, biomasa agroindustrial, envases vacíos de plaguicidas de uso agrícola con triple lavado y residuos peligrosos de sanidad vegetal.',
    fuenteOficial: 'MIDAGRI / El Peruano',
    fuenteUrl: 'https://www.gob.pe/institucion/midagri/normas-legales',
    estado: 'Verificado oficialmente por la administración',
  },
  {
    id: 'produce-manufactura',
    sector: 'Industria Manufacturera y Comercio',
    codigo: 'D.S. N.º 017-2015-PRODUCE',
    titulo: 'Reglamento de Gestión Ambiental para la Industria Manufacturera y Comercio Interno',
    entidad: 'Ministerio de la Producción (PRODUCE)',
    anio: '2015',
    descripcion:
      'Norma los compromisos de minimización, segregación, transporte y descarte de residuos industriales para plantas procesadoras, empaques, textiles, químicos y metalmecánica.',
    fuenteOficial: 'PRODUCE / SPIJ',
    fuenteUrl: 'https://www.gob.pe/institucion/produce/normas-legales',
    estado: 'Verificado oficialmente por la administración',
  },
  {
    id: 'vivienda-construccion',
    sector: 'Construcción y Saneamiento',
    codigo: 'D.S. N.º 002-2022-VIVIENDA',
    titulo: 'Reglamento de Gestión y Manejo de Residuos Sólidos de la Construcción y Demolición',
    entidad: 'Ministerio de Vivienda, Construcción y Saneamiento (VIVIENDA)',
    anio: '2022',
    descripcion:
      'Regula el manejo ambiental de desmontes limpios, escombros, material de excavación excedente, escorias y residuos peligrosos generados en obras de edificación e infraestructura.',
    fuenteOficial: 'VIVIENDA / El Peruano',
    fuenteUrl: 'https://www.gob.pe/institucion/vivienda/normas-legales',
    estado: 'Verificado oficialmente por la administración',
  },
  {
    id: 'minem-mineria-energia',
    sector: 'Minería y Energía',
    codigo: 'D.S. N.º 040-2014-EM',
    titulo: 'Reglamento de Protección y Gestión Ambiental para Actividades de Explotación, Beneficio y Transporte Minero',
    entidad: 'Ministerio de Energía y Minas (MINEM)',
    anio: '2014',
    descripcion:
      'Establece las directrices para la clasificación, almacenamiento en canchas y depósitos, tratamiento y transporte de residuos minero-metalúrgicos e hidrocarburos.',
    fuenteOficial: 'MINEM / El Peruano',
    fuenteUrl: 'https://www.gob.pe/institucion/minem/normas-legales',
    estado: 'Verificado oficialmente por la administración',
  },
];
