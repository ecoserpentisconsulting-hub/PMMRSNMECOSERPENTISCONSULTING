import { PmmrsData } from '../types/pmrs';

export const FICTITIOUS_DEMO_PMMRS: PmmrsData = {
  generalInfo: {
    razonSocial: 'AGROINDUSTRIAS EL VALLE VERDE S.A.C. [DATOS FICTICIOS DE DEMOSTRACIÓN]',
    ruc: '20608899123',
    departamento: 'La Libertad',
    provincia: 'Virú',
    distrito: 'Chao',
    direccion: 'Carretera Panamericana Norte Km 498, Sector Huancaquito Alto',
    coordenadasUTM: 'Zona 17S, Este: 724150 m E, Norte: 9062300 m N',
    actividadEconomica: 'Procesamiento, empaque y conservación de frutas y hortalizas (Arándano y Palto)',
    ciiu: '1030 - Elaboración y conservación de frutas, legumbres y hortalizas',
    representanteLegal: 'Ing. Carlos Mendoza Alarcón',
    dniRepresentante: '41829304',
    responsableTecnico: 'Ing. Ambiental Lucía Paredes Saldaña',
    profesionResponsable: 'Ingeniera Ambiental y de Recursos Naturales',
    cipResponsable: 'CIP N° 189422 (Habilitada)',
    emailResponsable: 'gestion.ambiental@valleverde-ficticio.pe',
    telefonoResponsable: '+51 944 123 456',
    descripcionOperacion: 'La planta agroindustrial procesa frutos frescos para exportación mediante recepción, lavado, selección, desinfección, empaque en frío, almacenamiento a temperatura controlada y despacho. En operaciones agrícolas asociadas se realiza poda, fertilización por fertirriego y control fitosanitario.',
    etapasOperativas: ['Construcción de ampliaciones', 'Operación de planta de empaque', 'Mantenimiento preventivo', 'Cierre progresivo'],
    vidaUtilAnios: 25,
  },
  objetivos: {
    general: 'Implementar una gestión integral, sanitaria y ambientalmente adecuada de los residuos sólidos no municipales generados en la planta agroindustrial El Valle Verde S.A.C., priorizando la minimización en la fuente, la valorización de subproductos orgánicos e inorgánicos, y la disposición final segura conforme al D.L. N° 1278 y la R.M. N° 089-2023-MINAM.',
    especificos: [
      'Reducir en un 15% la generación de residuos no aprovechables mediante sustitución progresiva de insumos de empaque de un solo uso.',
      'Segregar el 100% de los residuos sólidos generados en la fuente de origen según el código de colores de la Norma Técnica Peruana NTP 900.058:2019 (ámbito no municipal).',
      'Valorizar el 85% de la biomasa vegetal y descarte orgánico mediante compostaje controlado para su reincorporación en suelos agrícolas.',
      'Asegurar la trazabilidad del 100% de los residuos peligrosos mediante entrega exclusiva a Empresas Operadoras de Residuos Sólidos (EO-RS) registradas ante el MINAM.',
      'Cumplir estrictamente con el registro y reporte oportuno ante el sistema SIGERSOL del MINAM dentro de los plazos normativos vigentes.',
    ],
  },
  alcance: {
    descripcion: 'El presente PMMRS es de aplicación obligatoria en todas las instalaciones del Centro Operativo Chao: Nave de Procesamiento y Empaque, Cámaras de Refrigeración, Talleres de Mantenimiento Mecánico, Almacenes de Insumos y Almacenes Centrales de Residuos, Oficinas Administrativas y Áreas Auxiliares.',
    instalacionesComprendidas: [
      'Planta de Empaque y Clasificación (Área: 4,500 m²)',
      'Taller de Mantenimiento y Maestranza (Área: 650 m²)',
      'Almacén Central de Residuos Peligrosos y No Peligrosos (Área: 220 m²)',
      'Plataforma de Compostaje de Biomasa (Área: 1,200 m²)',
      'Edificio Administrativo y Comedor (Área: 480 m²)',
    ],
    personalComprendido: 'Aplica a los 180 colaboradores permanentes y 350 operarios de temporada.',
    contratistasComprendidos: 'Comprende obligatoriamente a empresas transportistas, servicios de mantenimiento electromecánico y contratistas civiles.',
  },
  fuentesGeneracion: [
    {
      id: 'FG-01',
      etapa: 'Operación',
      proceso: 'Selección y empaque de arándano y palto',
      actividades: 'Descarte de fruto no conforme, recorte de racimos, embalaje en cajas de cartón y clamshells plásticos.',
      residuosGenerados: 'Frutos de descarte, restos vegetales, cajas de cartón corrugado, zunchos y plástico film.',
    },
    {
      id: 'FG-02',
      etapa: 'Operación',
      proceso: 'Fertirriego y sanidad vegetal en campos anexos',
      actividades: 'Dosificación de fertilizantes foliares, aplicación fitosanitaria con atomizadores.',
      residuosGenerados: 'Envases vacíos de agroquímicos con triple lavado perforados, sacos de polietileno de fertilizantes.',
    },
    {
      id: 'FG-03',
      etapa: 'Mantenimiento',
      proceso: 'Mantenimiento de maquinaria y montacargas',
      actividades: 'Cambio de lubricantes hidraúlicos, sustitución de filtros, reparación y limpieza de motores.',
      residuosGenerados: 'Aceite lubricante usado, waypes y trapos contaminados con hidrocarburos, filtros de aceite usados, baterías de plomo ácido.',
    },
    {
      id: 'FG-04',
      etapa: 'Construcción',
      proceso: 'Mantenimiento y ampliación de losa de maniobras',
      actividades: 'Demolición menor de piso de concreto y desbroce perimetral.',
      residuosGenerados: 'Restos de concreto y agregados (desmonte limpio), restos de vegetación arbustiva.',
    },
  ],
  inventarioResiduos: [
    {
      id: 'RES-01',
      nombre: 'Restos vegetales y fruto descartado de proceso',
      etapa: 'Operación',
      procesoGenerador: 'Selección y empaque',
      clasificacionManejo: 'No peligroso',
      clasificacionGestion: 'No municipal',
      codigoConvenioBasilea: 'B3060',
      cantidadMensual: 14.5,
      unidad: 'tn/mes',
      cantidadAnual: 174.0,
      metodoEstimacion: 'Pesaje directo en balanza de plataforma de recepción',
    },
    {
      id: 'RES-02',
      nombre: 'Cajas de cartón corrugado no contaminadas',
      etapa: 'Operación',
      procesoGenerador: 'Desembalaje de materiales de empaque',
      clasificacionManejo: 'No peligroso',
      clasificacionGestion: 'No municipal',
      codigoConvenioBasilea: 'B3020',
      cantidadMensual: 1.2,
      unidad: 'tn/mes',
      cantidadAnual: 14.4,
      metodoEstimacion: 'Control de inventario de almacén y pesaje de fardos',
    },
    {
      id: 'RES-03',
      nombre: 'Plásticos de embalaje (film stretch y zunchos PET/PP)',
      etapa: 'Operación',
      procesoGenerador: 'Desembalaje y paletizado',
      clasificacionManejo: 'No peligroso',
      clasificacionGestion: 'No municipal',
      codigoConvenioBasilea: 'B3011',
      cantidadMensual: 0.85,
      unidad: 'tn/mes',
      cantidadAnual: 10.2,
      metodoEstimacion: 'Pesaje directo de fardos compactados',
    },
    {
      id: 'RES-04',
      nombre: 'Envases vacíos de productos fitosanitarios (con triple lavado y perforados)',
      etapa: 'Operación',
      procesoGenerador: 'Sanidad vegetal y fumigación',
      clasificacionManejo: 'Peligroso',
      clasificacionGestion: 'No municipal',
      codigoConvenioBasilea: 'A4130',
      caracteristicasPeligrosidad: 'Tóxico, Peligro ecotóxico',
      cantidadMensual: 0.18,
      unidad: 'tn/mes',
      cantidadAnual: 2.16,
      metodoEstimacion: 'Registro de dosificación en campo y conteo de envases',
    },
    {
      id: 'RES-05',
      nombre: 'Aceite mineral dieléctrico y lubricante usado',
      etapa: 'Mantenimiento',
      procesoGenerador: 'Cambio de aceite de tractores y grupos electrógenos',
      clasificacionManejo: 'Peligroso',
      clasificacionGestion: 'No municipal',
      codigoConvenioBasilea: 'A3020',
      caracteristicasPeligrosidad: 'Inflamable, Tóxico',
      cantidadMensual: 0.35,
      unidad: 'tn/mes',
      cantidadAnual: 4.2,
      metodoEstimacion: 'Medición de volumen en cilindros de 55 galones',
    },
    {
      id: 'RES-06',
      nombre: 'Trapos, waypes y EPPs contaminados con hidrocarburos y grasa',
      etapa: 'Mantenimiento',
      procesoGenerador: 'Mantenimiento mecánico y limpieza de piezas',
      clasificacionManejo: 'Peligroso',
      clasificacionGestion: 'No municipal',
      codigoConvenioBasilea: 'A4130',
      caracteristicasPeligrosidad: 'Inflamable, Tóxico',
      cantidadMensual: 0.12,
      unidad: 'tn/mes',
      cantidadAnual: 1.44,
      metodoEstimacion: 'Pesaje directo al internamiento en almacén central',
    },
    {
      id: 'RES-07',
      nombre: 'Residuos no aprovechables de servicios higiénicos y limpieza general',
      etapa: 'Operación',
      procesoGenerador: 'Servicios sanitarios y limpieza de comedores',
      clasificacionManejo: 'No peligroso',
      clasificacionGestion: 'Similar a municipal',
      codigoConvenioBasilea: 'Sin código de peligrosidad',
      cantidadMensual: 0.45,
      unidad: 'tn/mes',
      cantidadAnual: 5.4,
      metodoEstimacion: 'Pesaje diario de bolsas negras antes de evacuación',
    },
    {
      id: 'RES-08',
      nombre: 'Neumáticos fuera de uso (NFU) de maquinaria pesada y furgones',
      etapa: 'Mantenimiento',
      procesoGenerador: 'Recambio de llantas de transporte interno',
      clasificacionManejo: 'No peligroso',
      clasificacionGestion: 'No municipal',
      codigoConvenioBasilea: 'B3140',
      cantidadMensual: 0.15,
      unidad: 'tn/mes',
      cantidadAnual: 1.8,
      metodoEstimacion: 'Conteo y pesaje por unidad (promedio 35 kg/llanta)',
    },
  ],
  estrategiasMinimizacion: [
    {
      id: 'MIN-01',
      residuoOProceso: 'Envases plásticos de fertilizantes y agroquímicos',
      etapa: 'Operación',
      tipoEstrategia: 'Retornabilidad de envases',
      descripcionMedida: 'Acuerdo comercial con proveedores autorizados de insumos para entrega en contenedores retornables IBC de 1,000 L, reduciendo la compra en bidones individuales de 20 L.',
      metaReduccion: 'Reducción del 40% en unidades de envases generados al año.',
      responsable: 'Jefatura de Logística y Adquisiciones',
    },
    {
      id: 'MIN-02',
      residuoOProceso: 'Biomasa vegetal y descarte orgánico',
      etapa: 'Operación',
      tipoEstrategia: 'Compostaje interno',
      descripcionMedida: 'Instalación de área tecnificada de compostaje con aireación forzada para transformar pulpa y ramas en mejorador orgánico de suelos para el fundo.',
      metaReduccion: 'Revalorización in situ del 90% de restos orgánicos vegetales (cero envío a relleno sanitario).',
      responsable: 'Supervisor de Sostenibilidad y Sanidad',
    },
    {
      id: 'MIN-03',
      residuoOProceso: 'Neumáticos fuera de uso (NFU)',
      etapa: 'Mantenimiento',
      tipoEstrategia: 'Logística inversa',
      descripcionMedida: 'Adhesión al Sistema Colectivo de Manejo de NFU aprobado por PRODUCE/MINAM conforme al D.S. N° 024-2021-MINAM para valorización material (caucho granulado).',
      metaReduccion: '100% de NFU entregados al sistema colectivo con certificado.',
      responsable: 'Jefatura de Taller de Mantenimiento',
    },
    {
      id: 'MIN-04',
      residuoOProceso: 'Excedentes de demolición y tierras limpias',
      etapa: 'Construcción',
      tipoEstrategia: 'Aprovechamiento material descarte',
      descripcionMedida: 'Uso de desmonte limpio como material de nivelación y afirmado de caminos internos previa comunicación a la autoridad conforme al Art. 5 del D.S. N° 014-2017-MINAM.',
      metaReduccion: 'Aprovechamiento del 100% del desmonte limpio sin considerarlo residuo.',
      responsable: 'Residente de Obras Civiles',
    },
  ],
  gestionManejo: {
    segregacion: {
      descripcion: 'La segregación se realiza estrictamente en la fuente generadora en todas las áreas de la planta y campo, empleando baterías de recipientes codificados y rotulados conforme a la Norma Técnica Peruana NTP 900.058:2019 (Tabla 2: Ámbito No Municipal). Queda terminantemente prohibida la mezcla de residuos peligrosos con no peligrosos.',
      cumpleNTP: true,
      colores: [
        { tipo: 'Papel y Cartón', color: 'Azul', colorHex: '#1d4ed8', ejemplos: 'Cajas de cartón limpias, papel bond, conos de embalaje' },
        { tipo: 'Plásticos', color: 'Blanco', colorHex: '#f8fafc', ejemplos: 'Film stretch, botellas PET, zunchos plásticos, bolsas de insumos no peligrosos' },
        { tipo: 'Metales', color: 'Amarillo', colorHex: '#eab308', ejemplos: 'Chatarra metálica, retazos de fierro, latas y flejes' },
        { tipo: 'Orgánicos', color: 'Marrón', colorHex: '#854d0e', ejemplos: 'Restos de frutos, hojas, podas, restos de alimentos de comedor' },
        { tipo: 'Vidrio', color: 'Plomo', colorHex: '#94a3b8', ejemplos: 'Botellas de vidrio no contaminadas, frascos' },
        { tipo: 'Peligrosos', color: 'Rojo', colorHex: '#dc2626', ejemplos: 'Envases de agroquímicos perforados, waypes con hidrocarburos, filtros de aceite, baterías' },
        { tipo: 'No aprovechables', color: 'Negro', colorHex: '#1e293b', ejemplos: 'Papel higiénico, toallas sanitarias, polvo de barrido, envolturas sucias' },
      ],
    },
    recoleccionInterna: {
      frecuencia: 'Diaria en dos turnos (06:00 - 08:00 y 16:00 - 18:00)',
      horarios: 'Turno Mañana y Tarde, evitando coincidencia con el transporte de producto terminado',
      equipamiento: '2 carritos de transporte manual cerrados de polietileno de alta densidad (300 L) para no peligrosos y 1 plataforma móvil con bandeja antiderrame para tambores de residuos peligrosos.',
      epps: [
        'Guantes de nitrilo y cuero reforzado según tipo de residuo',
        'Zapatos de seguridad dieléctricos con puntera de acero',
        'Lentes de seguridad con protección lateral',
        'Respirador de media cara con filtros para vapores orgánicos y partículas (para área de peligrosos)',
        'Chaleco reflectivo de alta visibilidad',
      ],
      rutasInternas: 'Ruta perimetral señalizada que no interfiere con zonas de procesamiento higiénico de alimentos.',
    },
    almacenamiento: {
      primario: 'Puntos ecológicos ubicados en cada estación de trabajo y oficinas, provistos con cilindros rotulados con bolsa interior del color correspondiente.',
      intermedio: 'Áreas de acopio temporal en cada nave de producción con capacidad para 48 horas de acumulación máxima.',
      centralNoPeligrosos: 'Área techada de 140 m² con piso de concreto pulido, sectorizada por tipo de residuo valorizable (cartón compactado, fardos plásticos, chatarra, compostaje).',
      centralPeligrosos: {
        cumpleLosaImpermeable: true,
        cumpleSardinelContencion: true,
        cumpleTechoVentilacion: true,
        cumpleSenaleticaPeligro: true,
        cumpleKitAntiderrame: true,
        cumpleExtintorContraIncendio: true,
        tiempoMaximoMeses: 12,
        descripcion: 'Almacén cerrado de 80 m² con losa de concreto e impermeabilización superficial con resina epóxica, sardinel perimetral de 25 cm de altura con capacidad para retener el 110% del contenedor mayor, techo a dos aguas con ventilación cruzada natural, puertas metálicas con cerradura, señalización según NTP 399.010-1, ducha de emergencia con lavaojos, extintores de PQS y CO2 de 10 kg, y kit antiderrames con material absorbente hidrofóbico. Tiempo máximo de almacenamiento garantizado no superior a 12 meses (Art. 55 D.S. 014-2017-MINAM).',
      },
    },
    transporteExterno: {
      nombreEORS: 'ECO-OPERACIONES AMBIENTALES DEL NORTE S.A.C. [EO-RS DEMO]',
      registroMINAM: 'Registro Autoritativo MINAM N° EO-RS-00421-2022',
      autorizacionMTC: 'Habilitación Vehicular Especial MTC N° 15892-2022-MTC/15',
      frecuenciaRecojo: 'Quincenal para residuos aprovechables; mensual para residuos peligrosos',
    },
    valorizacion: {
      aplica: true,
      tipo: 'Valorización Material (Compostaje in situ de orgánicos y comercialización de reciclables a EO-RS autorizada)',
      operadorOPlanta: 'Planta de Compostaje El Valle Verde (para orgánicos) y RECICLA NORTE S.A.C. (para cartón y film plástico)',
      descripcion: 'Los residuos orgánicos vegetales se procesan en la planta interna de compostaje. El papel, cartón y film plástico se entregan compactados a la EO-RS de comercialización para su reinserción en la industria de empaques.',
    },
    disposicionFinal: {
      tipoInfraestructura: 'Relleno de Seguridad',
      nombrePlanta: 'Relleno de Seguridad y Sanitario Industrial Bélico del Norte',
      resolucionAprobacionIGA: 'R.D. N° 342-2020-MINAM/VMGA/DGRS',
      ubicacion: 'Distrito de Paiján, Provincia de Ascope, La Libertad',
      operadorResponsable: 'OPERACIONES AMBIENTALES DEL PERÚ S.A.',
    },
  },
  medidasAmbientales: [
    {
      id: 'MED-01',
      etapa: 'Operación y Mantenimiento',
      componenteAfectado: 'Suelo',
      impactoRiesgo: 'Contaminación por derrame accidental de aceites usados o químicos peligrosos',
      medidaMitigacion: 'Manipulación sobre bandejas de contención secundaria en talleres; almacenamiento exclusivo sobre losa impermeabilizada con sardineles estancos.',
      frecuenciaMonitoreo: 'Inspección visual diaria y verificación de estanqueidad mensual',
      responsable: 'Supervisor de Medio Ambiente',
    },
    {
      id: 'MED-02',
      etapa: 'Operación',
      componenteAfectado: 'Agua superficial y subterránea',
      impactoRiesgo: 'Generación y arrastre de lixiviados durante acopio de biomasa vegetal',
      medidaMitigacion: 'Canales perimétricos impermeabilizados para captación de escorrentía hacia poza de lixiviados con recirculación a pilas de compost.',
      frecuenciaMonitoreo: 'Semanal y posterior a precipitaciones pluviales',
      responsable: 'Jefatura de Sanidad y Riego',
    },
    {
      id: 'MED-03',
      etapa: 'Construcción',
      componenteAfectado: 'Aire y emisiones',
      impactoRiesgo: 'Generación de material particulado por transporte y movimiento de desmontes',
      medidaMitigacion: 'Humedecimiento de vías y cobertura con toldo de tolvas de volquetes durante el traslado.',
      frecuenciaMonitoreo: 'Diario durante jornada de obras',
      responsable: 'Residente de Obras',
    },
    {
      id: 'MED-04',
      etapa: 'Operación',
      componenteAfectado: 'Salud de trabajadores',
      impactoRiesgo: 'Exposición dérmica e inhalatoria a residuos fitosanitarios y polvos',
      medidaMitigacion: 'Dotación obligatoria de EPP específico, exámenes médicos ocupacionales anuales y capacitaciones trimestrales en manejo seguro.',
      frecuenciaMonitoreo: 'Mensual mediante auditoría de seguridad y salud en el trabajo',
      responsable: 'Médico Ocupacional y Especialista SST',
    },
  ],
  planEmergencias: {
    responsableEmergencia: 'Ing. Carlos Mendoza Alarcón (Comité de Crisis)',
    telefonoEmergencia: '+51 944 123 456 / Central Emergencias: 044-554433',
    procedimientoDerrame: '1. Acordonar el área en un radio de 10 metros. 2. Identificar el residuo con la hoja FDS. 3. Aplicar material absorbente del kit antiderrame desde la periferia hacia el centro. 4. Recoger con pala antichispa y confinar en tambor rojo rotulado como residuo peligroso. 5. Si hubo contacto con suelo natural, excavar los primeros 10 cm o hasta suelo limpio y colocar en tambor de seguridad. 6. Notificar a OEFA en un plazo máximo de 24 horas conforme al Art. 50 del D.S. N° 014-2017-MINAM.',
    procedimientoIncendio: '1. Activar pulsador de alarma general. 2. Evacuar al personal hacia la zona de seguridad N° 3. 3. La brigada combate el amago con extintores PQS/CO2 sin exponerse a vapores tóxicos. 4. Contactar a Compañía de Bomberos de Virú (B-144). 5. Aislar residuos calcinados para manejo peligroso.',
    procedimientoFuga: '1. Cortar suministro de energía y aislar fuentes de ignición. 2. Colocarse equipo de respiración autónoma o respirador con filtro correspondiente. 3. Cerrar válvula o reubicar contenedor en sobreempaque de salvamento (salvage drum). 4. Ventilar el área.',
    comunicacionAutoridadHoras: 24,
    equipamientoEmergencia: [
      '3 kits completos antiderrames de 55 galones con cordones y almohadillas absorbentes',
      'Pala de bronce antichispa y escobillas plásticas',
      '2 tambores de sobreempaque (salvage drum) de polietileno de 85 galones',
      'Extintores de PQS de 10 kg y CO2 de 5 kg certificados',
      'Ducha lavaojos de emergencia de acero inoxidable en almacén central',
      'Botiquín de primeros auxilios para atención toxicológica básica',
    ],
  },
  indicadores: [
    {
      id: 'IND-01',
      nombreIndicador: 'Tasa de Valorización de Residuos Sólidos (TVR)',
      formulaCalculo: '(Total residuos sólidos valorizados en el mes [t] / Total residuos sólidos generados en el mes [t]) * 100',
      meta: '≥ 85% mensual',
      frecuencia: 'Mensual',
      responsable: 'Supervisor de Medio Ambiente',
      medioVerificacion: 'Guías de remisión, reportes de pesaje de compost y constancias de entrega a EO-RS.',
    },
    {
      id: 'IND-02',
      nombreIndicador: 'Índice de Generación Específica por Unidad de Producción (IGE)',
      formulaCalculo: 'Total residuos generados [kg] / Total toneladas de fruta procesada [t]',
      meta: '≤ 12.0 kg residuo / t fruta procesada',
      frecuencia: 'Mensual',
      responsable: 'Jefatura de Planta y Control de Calidad',
      medioVerificacion: 'Reporte del sistema ERP de producción y balance de masa.',
    },
    {
      id: 'IND-03',
      nombreIndicador: 'Eficacia de Segregación en Fuente (ESF)',
      formulaCalculo: '(N° de puntos limpios auditados conformes sin mezclas / Total puntos limpios auditados) * 100',
      meta: '100% de cumplimiento semanal',
      frecuencia: 'Mensual',
      responsable: 'Comité de Gestión Ambiental',
      medioVerificacion: 'Listas de chequeo de inspecciones semanales de segregación.',
    },
    {
      id: 'IND-04',
      nombreIndicador: 'Cumplimiento Legal y Reportes SIGERSOL (CLS)',
      formulaCalculo: '(Obligaciones normativas y manifiestos remitidos a tiempo / Obligaciones totales exigibles) * 100',
      meta: '100% dentro de plazos legales',
      frecuencia: 'Trimestral',
      responsable: 'Responsable Técnico del PMMRS',
      medioVerificacion: 'Constancias de presentación virtual emitida por plataforma SIGERSOL MINAM.',
    },
  ],
  cronograma: [
    {
      id: 'CRON-01',
      actividad: 'Actualización y difusión del PMMRS a todo el personal y contratistas',
      etapa: 'Planificación / Operación',
      plazo: 'Enero de cada año',
      frecuencia: 'Anual',
      responsable: 'Responsable Técnico',
      obligacionLegalAsociada: 'R.M. N° 089-2023-MINAM / D.L. 1278',
    },
    {
      id: 'CRON-02',
      actividad: 'Reporte de la Declaración Anual sobre Minimización y Gestión de Residuos No Municipales en SIGERSOL',
      etapa: 'Operación',
      plazo: 'Primeros 15 días hábiles de abril',
      frecuencia: 'Anual (Perentorio)',
      responsable: 'Responsable Técnico PMMRS',
      obligacionLegalAsociada: 'D.S. N° 014-2017-MINAM Art. 13.4 literal c y Art. 48.2',
    },
    {
      id: 'CRON-03',
      actividad: 'Reporte de Manifiestos de Manejo de Residuos Peligrosos (MRSP) acumulados en SIGERSOL',
      etapa: 'Operación y Mantenimiento',
      plazo: 'Primeros 15 días hábiles de cada trimestre (Enero, Abril, Julio, Octubre)',
      frecuencia: 'Trimestral (Perentorio)',
      responsable: 'Responsable Técnico PMMRS',
      obligacionLegalAsociada: 'D.S. N° 014-2017-MINAM Art. 13.4 literal c y Art. 56',
    },
    {
      id: 'CRON-04',
      actividad: 'Programa de capacitación en segregación en la fuente (NTP 900.058:2019) y manejo seguro',
      etapa: 'Operación',
      plazo: 'Marzo, Junio, Septiembre, Diciembre',
      frecuencia: 'Trimestral',
      responsable: 'Área de Seguridad y Medio Ambiente',
      obligacionLegalAsociada: 'D.L. 1278 Art. 57 y Ley 29783',
    },
    {
      id: 'CRON-05',
      actividad: 'Inspección de condiciones de almacén central de residuos peligrosos (estanqueidad, kit, extintores)',
      etapa: 'Operación',
      plazo: 'Último viernes de cada mes',
      frecuencia: 'Mensual',
      responsable: 'Supervisor de Medio Ambiente',
      obligacionLegalAsociada: 'D.S. N° 014-2017-MINAM Art. 54 y 55',
    },
    {
      id: 'CRON-06',
      actividad: 'Simulacro de atención de emergencias por derrame de residuos peligrosos',
      etapa: 'Operación',
      plazo: 'Mayo y Noviembre',
      frecuencia: 'Semestral',
      responsable: 'Brigada de Emergencias y SST',
      obligacionLegalAsociada: 'D.S. N° 014-2017-MINAM Art. 50',
    },
  ],
  presupuesto: [
    {
      id: 'PRE-01',
      rubro: 'Equipamiento de Segregación y Almacenamiento',
      descripcion: 'Adquisición y reposición de contenedores de 55 galones según NTP 900.058:2019, bolsas biodegradables y señalética',
      costoEstimadoPEN: 14500,
      fuenteFinanciamiento: 'Recursos propios OPEX Planta',
      periodo: 'Anual 2026',
    },
    {
      id: 'PRE-02',
      rubro: 'Servicios de Transporte y Disposición Final (EO-RS)',
      descripcion: 'Contratación de EO-RS registrada en MINAM para recojo, transporte y confinamiento en Relleno de Seguridad',
      costoEstimadoPEN: 38400,
      fuenteFinanciamiento: 'Presupuesto Operativo Anual',
      periodo: 'Anual 2026',
    },
    {
      id: 'PRE-03',
      rubro: 'Equipos de Protección Personal (EPP Especializado)',
      descripcion: 'Dotación de respiradores con cartuchos, guantes de nitrilo reforzados, trajes Tyvek y botas de seguridad',
      costoEstimadoPEN: 8200,
      fuenteFinanciamiento: 'Presupuesto SST',
      periodo: 'Anual 2026',
    },
    {
      id: 'PRE-04',
      rubro: 'Operación de Planta de Compostaje Interna',
      descripcion: 'Mantenimiento de volteadora, adición de estructurante y análisis de laboratorio de calidad de compost agronómico',
      costoEstimadoPEN: 12000,
      fuenteFinanciamiento: 'Presupuesto Agrícola',
      periodo: 'Anual 2026',
    },
    {
      id: 'PRE-05',
      rubro: 'Atención de Emergencias y Contingencias',
      descripcion: 'Reposición de material absorbente para kits antiderrames, mantenimiento de extintores y pruebas de ducha lavaojos',
      costoEstimadoPEN: 6500,
      fuenteFinanciamiento: 'Fondo de Contingencias Ambientales',
      periodo: 'Anual 2026',
    },
    {
      id: 'PRE-06',
      rubro: 'Capacitación y Monitoreo Ambiental',
      descripcion: 'Talleres prácticos para personal operativo y auditorías internas de cumplimiento legal de residuos',
      costoEstimadoPEN: 7800,
      fuenteFinanciamiento: 'Capacitación Ambiental',
      periodo: 'Anual 2026',
    },
  ],
  funcionesResponsable: {
    nombres: 'Ing. Lucía Paredes Saldaña',
    cargo: 'Jefe del Departamento de Gestión Ambiental y Sostenibilidad',
    profesion: 'Ingeniera Ambiental y de Recursos Naturales',
    cip: 'CIP N° 189422',
    funciones: [
      'Conducir y mantener actualizado el Registro Interno de Generación y Manejo de Residuos Sólidos conforme al Art. 48.1 literal b del D.S. N° 014-2017-MINAM.',
      'Elaborar, suscribir y presentar a través de la plataforma SIGERSOL No Municipal la Declaración Anual de Manejo dentro de los primeros 15 días hábiles de abril de cada año.',
      'Suscribir e ingresar trimestralmente al SIGERSOL los Manifiestos de Manejo de Residuos Peligrosos (MRSP) y custodiar físicamente y digitalmente las copias originales durante cinco (5) años para fiscalizaciones de OEFA (Art. 56 literal b).',
      'Verificar de manera permanente que las Empresas Operadoras de Residuos Sólidos (EO-RS) contratadas cuenten con Registro Autoritativo vigente en el MINAM y habilitación del MTC.',
      'Supervisar la correcta segregación en origen según la Norma Técnica Peruana NTP 900.058:2019 y auditar semanalmente las condiciones del Almacén Central de Peligrosos.',
      'Activar el Plan de Contingencias ante cualquier incidente o derrame que involucre residuos y reportarlo a la autoridad competente y a OEFA dentro de las 24 horas siguientes (Art. 50).',
    ],
  },
};

/**
 * Text extract from the benchmark test case "Fundo Camones" (EVAP - Fundo Camones Cultivos y Exportación de Palta).
 * This contains:
 * 1) Indication to reuse pesticide containers after triple wash ("Los envases de plásticos de los fertilizantes o plaguicidas pueden ser triple lavados y reutilizadas" - Cuadro 216 / Secc. 5.1 / Cuadro 218).
 * 2) Discrepancies between tables (e.g. dangerous waste quantities: Cuadro 213 dice 5.58 tn/mes en construcción y 0.05 tn/mes en mantenimiento, pero Cuadro 214 dice 0.27 tn/mes en construcción/cierre; Cuadro 218 dice 0.02 tn/mes y 0.2 tn/mes).
 * 3) Typo / repeat in Item 11 referencing Cuadro 219 instead of dedicated budget structure.
 */
export const FUNDO_CAMONES_TEST_CASE = {
  title: 'PMRS Fundo Camones (Caso de Prueba Oficial - Cultivo y Exportación de Palta)',
  description: 'Documento modelo extraído de la EVAP Fundo Camones. Diseñado para verificar que el sistema audite con rigor técnico, detecte la recomendación indebida de reutilizar envases de plaguicidas, identifique discrepancias cuantitativas entre cuadros y reconozca citas normativas exactas.',
  pageCount: 26,
  extractedText: `EVALUACIÓN AMBIENTAL PRELIMINAR (EVAP) FUNDO CAMONES CULTIVOS Y EXPORTACION DE PALTA
9.5. Programa de Minimización y Manejo de Residuos Sólidos.

1. Presentación/Introducción
En el presente Programa de Minimización y Manejo de Residuos Sólidos es elaborado conforme a lo establecido en el Decreto Legislativo N° 1278 que aprobó la Ley de Gestión Integral de Residuos Sólidos y la R.M. 089-2023 MINAM que aprueba el "Contenido Minimo del Plan de Minimización y Manejo de Residuos Solidos No Municipales", en donde el generador de los residuos sólidos es responsable de manejo seguro, sanitario y ambientalmente adecuado, orientado no solo a controlar los riesgos sino también a lograr la minimización de estos desde el punto de origen.
El programa, establece pautas para la óptima gestión, desde la generación de los residuos sólidos hasta su disposición final, teniendo en cuenta la etapa de almacenamiento, transporte y tratamiento de los residuos sólidos.
Todas las áreas y contratistas del Proyecto que generen residuos deberán tener conocimiento y adecuarse al presente Plan de Manejo de Residuos Sólidos.

2. Objetivos:
Objetivo general:
El objetivo principal del presente Programa es establecer pautas para la gestión integral de los residuos sólidos, evitando potenciales impactos al ambiente, y riesgos a la salud y seguridad de los trabajadores y las poblaciones del entorno.
Objetivos específicos:
- Minimizar la cantidad de residuos sólidos a manejar, a través de la adopción de prácticas de reducción, reúso y reciclaje.
- Promover la segregación de los residuos según las características físicas de acuerdo a la codificación de los colores (papel, cartón, plásticos, metales, vidrios, peligrosos, generales y orgánicos) para facilitar su gestión y aprovechamiento.
- Almacenar temporalmente los residuos generados de acuerdo a los procedimientos, para su posterior transporte y disposición final a través de una empresa autorizada (Empresa Operadora de Residuos Sólidos, EO-RS).
- Elaborar registros diarios, mensuales y anuales de residuos generados en las diferentes etapas del fundo.
- Sensibilizar a los generadores de residuos, sobre los riesgos que presentan a la salud de los trabajadores y el medio ambiente.

3. Alcance
El presente Plan de Minimización y Manejo de Residuos Sólidos alcanza a todo el personal administrativo, operativo y usuarios terceros y será de uso obligado para todas las actividades o servicios que se realizarán en el proyecto Fundo Camones.

4. Identificación de las fuentes de generación de residuos sólidos
4.1 Identificación de las fuentes de generación de residuos sólidos
Los tipos de residuos que se generarán en el proyecto Fundo Camones en las distintas actividades o procesos de construcción, operación, mantenimiento y cierre son los siguientes:
- Etapa de planificación: Desbroce de cobertura vegetal -> Restos de cobertura vegetal.
- Etapa de construcción: Movimiento de tierras, instalación de cultivo de palto, acopio y transporte de materiales, montaje e instalación de maquinarias y equipos, construcción e instalación de infraestructuras -> Residuos de bolsas de cultivo, restos de materiales de construcción, envolturas plásticas, cajas de cartón, trapos y waypes contaminados con aceites y grasas.
- Etapa de operación: Riego, fertilización, poda, control de malezas y enfermedades, control de plagas, cosecha -> Envases vacíos de fertilizantes, restos de ramas y hojas, envases vacíos de agroquímicos, frutos descartados.
- Etapa de mantenimiento: Mantenimiento de suelos y cultivos, mantenimiento de sistemas y maquinaria -> Residuos de poda, trapos y waypes contaminados con aceites y grasas.
- Etapa de cierre: Desmontaje y retiro de equipos, limpieza general de áreas intervenidas, revegetación -> Restos de demolición, trapos y waypes contaminados.

Cuadro N° 211: Características de Residuos sólidos
- Planificación: Desbroce de cobertura vegetal -> Restos de cobertura vegetal (No peligroso, similar al municipal)
- Construcción: Restos de materiales de construcción (No peligroso, no municipal); Trapos y waypes contaminados con aceites y grasas (Inflamable, Peligroso, no municipal).
- Operación: Envases vacíos de agroquímicos (Tóxico, Peligroso, no municipal).
- Cierre: Restos de demolición (No peligroso, no municipal); Trapos y waypes con aceites (Inflamable, Peligroso, no municipal).

Cuadro N° 212: Clasificación de los residuos sólidos por sus características para su almacenamiento
- Papel y cartón: Papeles de oficina, cajas de cartón -> Azul
- Plástico: Envases de plásticos, empaques -> Blanco
- Metales: Envases de metal, latas -> Amarillo
- Orgánicos: Restos de alimentos, ramas -> Marrón
- Vidrio: Botellas de vidrio -> Plomo
- Peligrosos: Envases de agroquímicos -> Rojo
- No aprovechables: Papeles de servicios higiénicos -> Negro

4.3 Estimación de la masa, volumen o unidades
Cuadro N° 213: Cuadro estimado del volumen y cantidad de residuos a generarse
- Planificación: No peligroso: 0.05 tn/mes
- Construcción: No peligroso: 0.05 tn/mes; Peligroso: 5.58 tn/mes
- Operación: No peligroso: 0.02 tn/mes; Peligroso: 0.02 tn/mes
- Mantenimiento: No peligroso: 0.9 tn/mes; Peligroso: 0.05 tn/mes
- Cierre: Peligroso: 8.7 tn/mes

Cuadro N° 214: Cuadro estimado del volumen y cantidad de residuos a generarse por actividad generadora
- Residuos de bolsa de cultivo: B3010, 0.02 Tn/mes
- Envolturas plásticas: B3010, 0.01 Tn/mes
- Cajas de cartón: B3020, 0.02 Tn/mes
- Residuos de poda: B3050, 0.09 Tn/mes
- Restos de ramas y hojas: B3050, 0.01 Tn/mes
- Restos de demolición: B2040, 8.5 Tn/mes
- Restos de material de construcción: B2040, 5.56 Tn/mes
- Trapos de waypes con aceites y grasas: A4130, 0.27 tn/mes
- Envases vacíos de agroquímicos: A4130, 0.02 tn/mes

5. Estrategias para la prevención y/o minimización
5.1. Minimización de los residuos sólidos
Cuadro N° 216: Alternativas de minimización de RRSS en la etapa de operación
Item 4: "Los envases de plásticos de los fertilizantes o plaguicidas pueden ser triple lavados y reutilizadas."
Item 5: "Los residuos orgánicos generados pueden utilizarse para compostaje."
Item 6: "Los restos de cosecha podas, ramas brotes, malezas, fruta malograda y de descarte pueden ser llevados a la zona de compostaje para la obtención de abono."

5.2 Material de descarte: Durante la etapa de construcción se generará material de descarte (excedente de remoción o desmonte limpio) el cual será usado como material de relleno.
5.3 Régimen especial de bienes priorizados: Llantas de camión (NFU Categoría B, 8 unidades, 180 kg anual). Se tendrá en cuenta el D.S. N° 024-2021-MINAM entregándose directamente a sistemas de manejo de NFU.

6. Gestión y Manejo de Residuos Sólidos
A) Segregación en la fuente: recipientes cilíndricos de 55 galones según NTP 900.058:2019.
B) Recolección y transporte interno diario con personal con EPP.
C) Almacenamiento temporal:
- Almacén temporal de no peligrosos: cilindros por código de colores.
- Almacén temporal de peligrosos: losa de concreto (4 x 3 x 1.10 m a profundidad de 20 cm) impermeabilizada con sardinel perimetral, cercada, techada y con aviso: "Almacén temporal de residuos peligrosos. Solamente se permite ingreso de personal autorizado".
D) Valorización: Reciclaje a través de EO-RS de plásticos y cartones.
E) Transporte externo: Por Empresa Operadora de Residuos Sólidos (EO-RS) registrada ante la autoridad competente y habilitada por MTC.
G) Disposición Final: Cuadro N° 218:
- Desbroce (0.05 tn/mes): Se dispone por el camión recolector de la Municipalidad.
- Bolsas de cultivo (0.02 tn/mes): Se reutilizan o se dispone con una EO-RS.
- Materiales de construcción (5.56 tn/mes): Se disponen con una EO-RS.
- Envolturas plásticas (0.01 tn/mes) y Cajas (0.02 tn/mes): Se dispone por el camión recolector de la Municipalidad.
- Trapos contaminados (0.02 tn/mes en construcción, 0.05 tn/mes en mantenimiento, 0.2 tn/mes en cierre): Se disponen con una EO-RS.
- Envases vacíos de agroquímicos (0.02 tn/mes): "Se reutilizan o se dispone con una EO-RS".
- Restos de demolición (8.5 tn/mes): Se disponen con una EO-RS.

H) Registro Documentarios: Internamiento de residuos, Declaración Anual de Manejo y Manifiestos de Residuos Peligrosos a través de SIGERSOL.

7. Descripción de las medidas ambientales
Cuadro N° 219: Medidas ambientales para el manejo de residuos sólidos:
- Planificación (Presupuesto 6000 Soles): Registro interno, contenedores, Programa de minimización.
- Construcción (Presupuesto 12000 Soles): Registro interno formato Anexo II D.S. 002-2022-VIVIENDA, capacitación, reporte SIGERSOL primeros 15 días hábiles de abril.
- Operación y mantenimiento (Presupuesto 12000 Soles): Registro interno, manifiestos trimestrales en SIGERSOL, declaración anual.
- Cierre (Presupuesto 18000 Soles): Disponer excedentes de construcción (4,000 m3) y peligrosos (4 Ton) a través de EO-RS autorizada por MINAM.

8. Medidas de atención ante emergencias
Acciones ante derrame o afectación de suelo/agua:
- Antes: Programa de minimización, orden y limpieza.
- Durante: Contención y retiro del suelo contaminado hasta 10 cm para ser retirado por EO-RS.
- Después: Supervisión y refuerzo.

9. Indicadores de seguimiento y control
Cuadro N° 220: Tasa de residuos sólidos dispuestos correctamente, Plan aprobado, volumen de residuos peligrosos dispuestos correctamente, presentación de manifiestos y declaración anual.

10. Cronograma de implementación
"El presente Plan de Manejo de Residuos Sólidos es aplicable todo el año. Adicionalmente a esto, las actividades a realizar comprendidas dentro del presente plan deben ser ejecutadas de acuerdo al cuadro N° 219."

11. Presupuesto y recursos necesarios
"Revisar cuadro N° 219."

12. Funciones del responsable de la gestión y manejo de residuos sólidos
El responsable directo es el Proyecto Camones:
- Manejar los residuos de acuerdo a su naturaleza física y peligrosidad.
- Conducir registro interno sobre generación y manejo.
- Contratar EO-RS para disposición final.
- Brindar facilidades a las autoridades.
- Presentar Declaración Anual y Manifiestos a través de SIGERSOL.
- Asegurar el seguimiento de compromisos asumidos en el Plan.`,
};
