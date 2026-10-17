import { PmmrsData } from '../types/pmrs';

export interface ValidationIssue {
  seccion: string;
  pasoIndice: number;
  campo: string;
  mensaje: string;
  gravedad: 'Critico' | 'Advertencia' | 'Recomendacion';
}

export interface ConsistencySummary {
  esValidoParaExportar: boolean;
  totalResiduosMensualTn: number;
  totalResiduosAnualTn: number;
  totalPeligrososTn: number;
  totalNoPeligrososTn: number;
  porcentajePeligrosos: number;
  presupuestoTotalPEN: number;
  tieneAlertaPlaguicidas: boolean;
  tieneAlertaColoresNTP: boolean;
  tieneAlmacenPeligrososConforme: boolean;
  pendientes: ValidationIssue[];
}

export function validatePmmrsData(data: PmmrsData): ConsistencySummary {
  const pendientes: ValidationIssue[] = [];

  // 1. Datos Generales
  if (!data.generalInfo.razonSocial || data.generalInfo.razonSocial.trim().length < 3) {
    pendientes.push({
      seccion: '1. Datos Generales',
      pasoIndice: 0,
      campo: 'Razón Social',
      mensaje: 'Debe ingresar la Razón Social del titular o empresa generadora.',
      gravedad: 'Critico',
    });
  }

  const rucClean = (data.generalInfo.ruc || '').replace(/\D/g, '');
  if (!rucClean || rucClean.length !== 11 || (!rucClean.startsWith('10') && !rucClean.startsWith('20'))) {
    pendientes.push({
      seccion: '1. Datos Generales',
      pasoIndice: 0,
      campo: 'RUC',
      mensaje: 'El RUC debe tener 11 dígitos y comenzar con 10 o 20 (RUC tributario válido en Perú).',
      gravedad: 'Critico',
    });
  }

  if (!data.generalInfo.departamento || !data.generalInfo.provincia || !data.generalInfo.distrito) {
    pendientes.push({
      seccion: '1. Datos Generales',
      pasoIndice: 0,
      campo: 'Ubicación Geográfica',
      mensaje: 'Debe especificar Departamento, Provincia y Distrito de la operación.',
      gravedad: 'Critico',
    });
  }

  if (!data.generalInfo.coordenadasUTM || data.generalInfo.coordenadasUTM.trim().length < 5) {
    pendientes.push({
      seccion: '1. Datos Generales',
      pasoIndice: 0,
      campo: 'Coordenadas UTM',
      mensaje: 'Debe consignar las coordenadas UTM (WGS84) del polígono de la operación.',
      gravedad: 'Advertencia',
    });
  }

  if (!data.generalInfo.responsableTecnico || !data.generalInfo.cipResponsable) {
    pendientes.push({
      seccion: '1. Datos Generales',
      pasoIndice: 0,
      campo: 'Responsable Técnico',
      mensaje: 'Debe indicar el nombre y registro CIP/colegiatura del ingeniero responsable.',
      gravedad: 'Advertencia',
    });
  }

  // 2. Objetivos y Alcance
  if (!data.objetivos.general || data.objetivos.general.trim().length < 20) {
    pendientes.push({
      seccion: '2. Objetivos y Alcance',
      pasoIndice: 1,
      campo: 'Objetivo General',
      mensaje: 'El objetivo general debe describir la finalidad del PMMRS (mínimo 20 caracteres).',
      gravedad: 'Critico',
    });
  }

  if (!data.objetivos.especificos || data.objetivos.especificos.length < 2) {
    pendientes.push({
      seccion: '2. Objetivos y Alcance',
      pasoIndice: 1,
      campo: 'Objetivos Específicos',
      mensaje: 'Se recomienda formular al menos 2 objetivos específicos cuantificables.',
      gravedad: 'Advertencia',
    });
  }

  if (!data.alcance.descripcion || data.alcance.descripcion.trim().length < 15) {
    pendientes.push({
      seccion: '2. Objetivos y Alcance',
      pasoIndice: 1,
      campo: 'Alcance',
      mensaje: 'Debe delimitar las áreas operativas, etapas y personal que abarca el plan.',
      gravedad: 'Critico',
    });
  }

  // 3. Fuentes de Generación
  if (!data.fuentesGeneracion || data.fuentesGeneracion.length === 0) {
    pendientes.push({
      seccion: '3. Fuentes de Generación',
      pasoIndice: 2,
      campo: 'Fuentes por Etapa',
      mensaje: 'Debe registrar al menos un proceso o etapa como fuente generadora de residuos.',
      gravedad: 'Critico',
    });
  }

  // 4. Inventario de Residuos
  if (!data.inventarioResiduos || data.inventarioResiduos.length === 0) {
    pendientes.push({
      seccion: '4. Inventario de Residuos',
      pasoIndice: 3,
      campo: 'Inventario de Residuos',
      mensaje: 'Debe registrar los residuos sólidos generados en la operación.',
      gravedad: 'Critico',
    });
  }

  let totalResiduosMensualTn = 0;
  let totalPeligrososTn = 0;
  let totalNoPeligrososTn = 0;

  data.inventarioResiduos.forEach((res, idx) => {
    // Convert to tn/mes for calculation
    let qtyTn = res.cantidadMensual;
    if (res.unidad === 'kg/mes') qtyTn = res.cantidadMensual / 1000;
    else if (res.unidad === 'unidades/mes') qtyTn = (res.cantidadMensual * 25) / 1000; // estimated 25kg average if units

    totalResiduosMensualTn += qtyTn;
    if (res.clasificacionManejo === 'Peligroso') {
      totalPeligrososTn += qtyTn;
      if (!res.codigoConvenioBasilea || !res.codigoConvenioBasilea.startsWith('A')) {
        pendientes.push({
          seccion: '4. Inventario de Residuos',
          pasoIndice: 3,
          campo: `Residuo #${idx + 1}: ${res.nombre}`,
          mensaje: 'Los residuos clasificados como Peligrosos deben tener asignado un código Basilea de la Lista A (ej. A4130, A3020) conforme al Anexo III del D.S. 014-2017-MINAM.',
          gravedad: 'Advertencia',
        });
      }
    } else {
      totalNoPeligrososTn += qtyTn;
    }
  });

  const totalResiduosAnualTn = +(totalResiduosMensualTn * 12).toFixed(2);
  totalResiduosMensualTn = +totalResiduosMensualTn.toFixed(2);
  totalPeligrososTn = +totalPeligrososTn.toFixed(2);
  totalNoPeligrososTn = +totalNoPeligrososTn.toFixed(2);
  const porcentajePeligrosos = totalResiduosMensualTn > 0 ? +((totalPeligrososTn / totalResiduosMensualTn) * 100).toFixed(1) : 0;

  // 5. Estrategias de Prevención y Minimización
  let tieneAlertaPlaguicidas = false;
  if (!data.estrategiasMinimizacion || data.estrategiasMinimizacion.length === 0) {
    pendientes.push({
      seccion: '5. Estrategias de Minimización',
      pasoIndice: 4,
      campo: 'Medidas de Minimización',
      mensaje: 'Debe incluir al menos una estrategia preventiva o de minimización en la fuente (Art. 7 D.S. 014-2017-MINAM).',
      gravedad: 'Critico',
    });
  } else {
    // Check for pesticide container reuse mistake
    const textAllStrats = JSON.stringify(data.estrategiasMinimizacion).toLowerCase();
    if (textAllStrats.includes('plaguicida') && (textAllStrats.includes('reutiliz') || textAllStrats.includes('reuso'))) {
      tieneAlertaPlaguicidas = true;
      pendientes.push({
        seccion: '5. Estrategias de Minimización',
        pasoIndice: 4,
        campo: 'Alerta Normativa de Plaguicidas',
        mensaje: 'PROHIBICIÓN LEGAL: Los envases de plaguicidas o productos agroquímicos son residuos peligrosos (Art. 72 D.S. 014-2017-MINAM) y NO deben reutilizarse tras triple lavado para fines generales. Deben entregarse a Campo Limpio o EO-RS.',
        gravedad: 'Critico',
      });
    }
  }

  // 6. Gestión y Manejo
  let tieneAlertaColoresNTP = false;
  const colPlastico = data.gestionManejo.segregacion.colores.find((c) => c.tipo.toLowerCase().includes('plástic'));
  if (colPlastico && colPlastico.color.toLowerCase() === 'verde') {
    tieneAlertaColoresNTP = true;
    pendientes.push({
      seccion: '6. Gestión y Manejo',
      pasoIndice: 5,
      campo: 'Código de Colores NTP 900.058:2019',
      mensaje: 'ADVERTENCIA DE CÓDIGO DE COLORES: Para el ámbito NO MUNICIPAL (Tabla 2 NTP 900.058:2019), el plástico se almacena en contenedor BLANCO, no verde (el verde solo aplica para ámbito municipal).',
      gravedad: 'Advertencia',
    });
  }

  // Almacén central de peligrosos
  const centralPeligrosos = data.gestionManejo.almacenamiento.centralPeligrosos;
  const tieneAlmacenPeligrososConforme = Boolean(
    centralPeligrosos.cumpleLosaImpermeable &&
    centralPeligrosos.cumpleSardinelContencion &&
    centralPeligrosos.cumpleTechoVentilacion &&
    centralPeligrosos.tiempoMaximoMeses <= 12
  );

  if (totalPeligrososTn > 0 && !tieneAlmacenPeligrososConforme) {
    pendientes.push({
      seccion: '6. Gestión y Manejo: Almacén de Peligrosos',
      pasoIndice: 5,
      campo: 'Almacén Central de Residuos Peligrosos',
      mensaje: 'Al generar residuos peligrosos, el almacén central debe contar obligatoriamente con losa impermeable, sardinel de contención (110% volumen mayor), techo y un plazo de custodia no mayor a 12 meses (Art. 54 y 55 D.S. 014-2017-MINAM).',
      gravedad: 'Critico',
    });
  }

  if (totalPeligrososTn > 0 && (!data.gestionManejo.transporteExterno.nombreEORS || data.gestionManejo.transporteExterno.nombreEORS.trim().length < 3)) {
    pendientes.push({
      seccion: '6. Gestión y Manejo: Transporte',
      pasoIndice: 5,
      campo: 'Empresa Operadora (EO-RS)',
      mensaje: 'El transporte de residuos peligrosos debe realizarse exclusivamente a través de una EO-RS registrada en MINAM (Art. 59 D.S. 014-2017-MINAM).',
      gravedad: 'Critico',
    });
  }

  // 7. Medidas Ambientales
  if (!data.medidasAmbientales || data.medidasAmbientales.length === 0) {
    pendientes.push({
      seccion: '7. Medidas Ambientales',
      pasoIndice: 6,
      campo: 'Matriz Ambiental',
      mensaje: 'Debe consignar al menos una medida ambiental para mitigar impactos al suelo o agua.',
      gravedad: 'Advertencia',
    });
  }

  // 8. Plan de Emergencias
  if (!data.planEmergencias.procedimientoDerrame || data.planEmergencias.procedimientoDerrame.trim().length < 20) {
    pendientes.push({
      seccion: '8. Atención ante Emergencias',
      pasoIndice: 7,
      campo: 'Procedimiento de Derrame',
      mensaje: 'Debe detallar el procedimiento técnico ante derrames de residuos peligrosos.',
      gravedad: 'Critico',
    });
  }

  if (data.planEmergencias.comunicacionAutoridadHoras > 24) {
    pendientes.push({
      seccion: '8. Atención ante Emergencias',
      pasoIndice: 7,
      campo: 'Plazo de Notificación a OEFA',
      mensaje: 'El plazo legal improrrogable para reportar emergencias con residuos peligrosos a OEFA es de máximo 24 horas (Art. 50 D.S. 014-2017-MINAM).',
      gravedad: 'Critico',
    });
  }

  // 9. Indicadores
  if (!data.indicadores || data.indicadores.length === 0) {
    pendientes.push({
      seccion: '9. Indicadores',
      pasoIndice: 8,
      campo: 'Indicadores de Seguimiento',
      mensaje: 'Debe incluir al menos 2 indicadores con fórmula matemática de cálculo.',
      gravedad: 'Advertencia',
    });
  }

  // 10. Cronograma
  if (!data.cronograma || data.cronograma.length === 0) {
    pendientes.push({
      seccion: '10. Cronograma',
      pasoIndice: 9,
      campo: 'Cronograma',
      mensaje: 'Debe incluir actividades calendarizadas con plazos de reporte SIGERSOL.',
      gravedad: 'Advertencia',
    });
  }

  // 11. Presupuesto
  let presupuestoTotalPEN = 0;
  if (!data.presupuesto || data.presupuesto.length === 0) {
    pendientes.push({
      seccion: '11. Presupuesto y Recursos',
      pasoIndice: 10,
      campo: 'Presupuesto',
      mensaje: 'Debe asignar partidas presupuestarias en Soles (PEN) para la sostenibilidad del plan.',
      gravedad: 'Advertencia',
    });
  } else {
    data.presupuesto.forEach((p) => {
      presupuestoTotalPEN += p.costoEstimadoPEN || 0;
    });
  }

  // 12. Funciones del Responsable
  if (!data.funcionesResponsable.nombres || data.funcionesResponsable.funciones.length === 0) {
    pendientes.push({
      seccion: '12. Funciones del Responsable',
      pasoIndice: 11,
      campo: 'Funciones y Perfil',
      mensaje: 'Debe definir el profesional a cargo y listar sus funciones operativas y de reporte.',
      gravedad: 'Advertencia',
    });
  }

  const hayCriticos = pendientes.some((p) => p.gravedad === 'Critico');
  const esValidoParaExportar = !hayCriticos;

  return {
    esValidoParaExportar,
    totalResiduosMensualTn,
    totalResiduosAnualTn,
    totalPeligrososTn,
    totalNoPeligrososTn,
    porcentajePeligrosos,
    presupuestoTotalPEN,
    tieneAlertaPlaguicidas,
    tieneAlertaColoresNTP,
    tieneAlmacenPeligrososConforme,
    pendientes,
  };
}
