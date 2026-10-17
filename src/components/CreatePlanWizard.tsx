import React, { useState, useEffect } from 'react';
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck,
  Building,
  Target,
  Factory,
  Trash,
  Recycle,
  Boxes,
  ShieldAlert,
  BarChart3,
  Calendar,
  DollarSign,
  UserCheck,
  Eye,
  Sparkles,
  Info,
  X,
  Copy,
  RefreshCw,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PmmrsData, WasteItem, MinimizationStrategy, EnvironmentalMeasure, PmmrsIndicator, ScheduleItem, BudgetItem } from '../types/pmrs';
import { validatePmmrsData, ConsistencySummary } from '../utils/validationEngine';
import { generatePmmrsDocx } from '../utils/docxGenerator';
import { generatePmmrsPdf } from '../utils/pdfGenerator';
import { FICTITIOUS_DEMO_PMMRS } from '../data/demoData';
import { HazardousStoragePreview } from './HazardousStoragePreview';

interface CreatePlanWizardProps {
  initialData?: PmmrsData;
  onPlanCreated?: (data: PmmrsData) => void;
}

const STEPS = [
  { id: 'general', title: '1. Datos Generales', icon: Building, desc: 'Empresa, RUC, ubicación, operación y responsable' },
  { id: 'objetivos', title: '2. Objetivos y Alcance', icon: Target, desc: 'Metas de gestión, frentes de obra y contratistas' },
  { id: 'fuentes', title: '3. Fuentes de Generación', icon: Factory, desc: 'Procesos operativos, etapas y actividades' },
  { id: 'inventario', title: '4. Inventario de Residuos', icon: Trash, desc: 'Masa, peligrosidad, Basilea y estimación' },
  { id: 'minimizacion', title: '5. Minimización y Descarte', icon: Recycle, desc: 'Estrategias en la fuente y bienes priorizados' },
  { id: 'manejo', title: '6. Gestión y Manejo Interno/Externo', icon: Boxes, desc: 'NTP colores, almacén central, EO-RS y destino' },
  { id: 'medidas', title: '7. Medidas Ambientales', icon: ShieldAlert, desc: 'Mitigación de impactos al agua, suelo y aire' },
  { id: 'emergencias', title: '8. Plan de Emergencias', icon: AlertTriangle, desc: 'Derrames, incendios y reporte 24h a OEFA' },
  { id: 'indicadores', title: '9. Indicadores', icon: BarChart3, desc: 'Fórmula, meta, frecuencia y responsable' },
  { id: 'cronograma', title: '10. Cronograma', icon: Calendar, desc: 'Actividades y fechas perentorias SIGERSOL' },
  { id: 'presupuesto', title: '11. Presupuesto', icon: DollarSign, desc: 'Partidas analíticas en Soles (PEN)' },
  { id: 'responsable', title: '12. Responsable Técnico', icon: UserCheck, desc: 'Colegiatura CIP, funciones y archivo 5 años' },
  { id: 'preview', title: '13. Revisión y Exportación', icon: Eye, desc: 'Validación de coherencia, Word (.docx) y PDF' },
];

const INITIAL_EMPTY_DATA: PmmrsData = {
  generalInfo: {
    razonSocial: '',
    ruc: '',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: '',
    direccion: '',
    coordenadasUTM: '',
    actividadEconomica: '',
    ciiu: '',
    representanteLegal: '',
    dniRepresentante: '',
    responsableTecnico: '',
    profesionResponsable: '',
    cipResponsable: '',
    emailResponsable: '',
    telefonoResponsable: '',
    descripcionOperacion: '',
    etapasOperativas: ['Construcción', 'Operación', 'Mantenimiento'],
    vidaUtilAnios: 20,
  },
  objetivos: {
    general: '',
    especificos: [
      'Reducir al mínimo la generación de residuos no aprovechables en origen.',
      'Segregar el 100% de los residuos según la NTP 900.058:2019 (ámbito no municipal).',
      'Entregar residuos peligrosos exclusivamente a EO-RS autorizadas por el MINAM.',
    ],
  },
  alcance: {
    descripcion: '',
    instalacionesComprendidas: ['Área de producción / empaque', 'Almacén central de residuos', 'Talleres'],
    personalComprendido: 'Todo el personal propio de la planta',
    contratistasComprendidos: 'Contratistas de transporte y mantenimiento',
  },
  fuentesGeneracion: [],
  inventarioResiduos: [],
  estrategiasMinimizacion: [],
  gestionManejo: {
    segregacion: {
      descripcion: 'Segregación en la fuente con recipientes codificados y rotulados conforme a la NTP 900.058:2019 (Tabla 2: Ámbito No Municipal).',
      cumpleNTP: true,
      colores: [
        { tipo: 'Papel y Cartón', color: 'Azul', colorHex: '#1d4ed8', ejemplos: 'Cajas de cartón, papel de oficina' },
        { tipo: 'Plásticos', color: 'Blanco', colorHex: '#f8fafc', ejemplos: 'Botellas plásticas, film, zunchos' },
        { tipo: 'Metales', color: 'Amarillo', colorHex: '#eab308', ejemplos: 'Chatarra metálica, latas' },
        { tipo: 'Orgánicos', color: 'Marrón', colorHex: '#854d0e', ejemplos: 'Restos de poda, restos de comida' },
        { tipo: 'Vidrio', color: 'Plomo', colorHex: '#94a3b8', ejemplos: 'Botellas y frascos de vidrio' },
        { tipo: 'Peligrosos', color: 'Rojo', colorHex: '#dc2626', ejemplos: 'Envases con químicos, waypes con hidrocarburos' },
        { tipo: 'No aprovechables', color: 'Negro', colorHex: '#1e293b', ejemplos: 'Papel higiénico, servilletas usadas' },
      ],
    },
    recoleccionInterna: {
      frecuencia: 'Diaria al término de la jornada laboral',
      horarios: '17:00 a 18:30 horas',
      equipamiento: 'Carritos de transporte cerrados y plataforma rodante para cilindros',
      epps: ['Guantes de nitrilo/cuero', 'Lentes de seguridad', 'Zapatos con puntera de acero', 'Respirador con filtro'],
      rutasInternas: 'Rutas señalizadas libres de obstáculos hacia el almacén central',
    },
    almacenamiento: {
      primario: 'Puntos ecológicos de acopio inicial en cada estación de trabajo',
      intermedio: 'Áreas de acopio temporal en talleres y naves',
      centralNoPeligrosos: 'Área techada de 60 m² con piso de concreto y división por materiales valorizables',
      centralPeligrosos: {
        cumpleLosaImpermeable: true,
        cumpleSardinelContencion: true,
        cumpleTechoVentilacion: true,
        cumpleSenaleticaPeligro: true,
        cumpleKitAntiderrame: true,
        cumpleExtintorContraIncendio: true,
        tiempoMaximoMeses: 12,
        descripcion: 'Ambiente cerrado con losa de concreto impermeable, sardinel de contención de 20 cm, techo, ventilación natural, extintores y kit antiderrame. Tiempo máximo de almacenamiento: 12 meses conforme al Art. 55 del D.S. 014-2017-MINAM.',
      },
    },
    transporteExterno: {
      nombreEORS: '',
      registroMINAM: '',
      autorizacionMTC: '',
      frecuenciaRecojo: 'Mensual para peligrosos; quincenal para no peligrosos',
    },
    valorizacion: {
      aplica: true,
      tipo: 'Valorización material mediante reciclaje y compostaje',
      operadorOPlanta: 'EO-RS autorizada de valorización',
      descripcion: 'Comercialización de cartón y plásticos a través de EO-RS; compostaje de biomasa',
    },
    disposicionFinal: {
      tipoInfraestructura: 'Relleno de Seguridad',
      nombrePlanta: '',
      resolucionAprobacionIGA: '',
      ubicacion: '',
      operadorResponsable: '',
    },
  },
  medidasAmbientales: [],
  planEmergencias: {
    responsableEmergencia: '',
    telefonoEmergencia: '',
    procedimientoDerrame: '1. Acordonar área. 2. Colocarse EPPs. 3. Aplicar material absorbente desde los bordes hacia el centro. 4. Recoger en contenedor rojo rotulado. 5. Si hay suelo afectado retirar primeros 10 cm. 6. Reportar a OEFA dentro de 24 horas (Art. 50 D.S. 014-2017-MINAM).',
    procedimientoIncendio: '1. Activar alarma. 2. Evacuar personal. 3. Combatir con extintores PQS/CO2. 4. Comunicar a Bomberos 116.',
    procedimientoFuga: '1. Cortar suministro. 2. Usar respirador. 3. Trasvasar a tambor de sobreempaque. 4. Ventilar.',
    comunicacionAutoridadHoras: 24,
    equipamientoEmergencia: ['Kit antiderrame de 55 galones', 'Pala antichispa', 'Extintores PQS de 10 kg', 'Ducha lavaojos'],
  },
  indicadores: [
    {
      id: 'IND-01',
      nombreIndicador: 'Tasa de Valorización de Residuos (TVR)',
      formulaCalculo: '(Residuos valorizados [tn] / Residuos totales generados [tn]) * 100',
      meta: '≥ 70% anual',
      frecuencia: 'Mensual',
      responsable: 'Responsable Técnico PMMRS',
      medioVerificacion: 'Guías de remisión y boletas de pesaje de EO-RS',
    },
  ],
  cronograma: [
    {
      id: 'CRON-01',
      actividad: 'Presentación de Declaración Anual de Manejo de Residuos No Municipales en SIGERSOL',
      etapa: 'Operación',
      plazo: 'Primeros 15 días hábiles de abril',
      frecuencia: 'Anual (Obligatorio)',
      responsable: 'Responsable Técnico',
      obligacionLegalAsociada: 'D.S. 014-2017-MINAM Art. 13.4 y 48.2',
    },
    {
      id: 'CRON-02',
      actividad: 'Reporte de Manifiestos de Residuos Peligrosos acumulados en SIGERSOL',
      etapa: 'Operación',
      plazo: 'Primeros 15 días hábiles de cada trimestre',
      frecuencia: 'Trimestral (Obligatorio)',
      responsable: 'Responsable Técnico',
      obligacionLegalAsociada: 'D.S. 014-2017-MINAM Art. 13.4 y 56',
    },
  ],
  presupuesto: [
    {
      id: 'PRE-01',
      rubro: 'Adquisición de Contenedores NTP 900.058',
      descripcion: 'Tachos cilíndricos y bolsas codificadas por colores para ámbito no municipal',
      costoEstimadoPEN: 5000,
      fuenteFinanciamiento: 'Recursos propios',
      periodo: 'Anual',
    },
    {
      id: 'PRE-02',
      rubro: 'Servicio de EO-RS para Transporte y Disposición',
      descripcion: 'Contratación de EO-RS autorizada por MINAM para residuos peligrosos y no aprovechables',
      costoEstimadoPEN: 18000,
      fuenteFinanciamiento: 'Presupuesto Operativo',
      periodo: 'Anual',
    },
  ],
  funcionesResponsable: {
    nombres: '',
    cargo: 'Responsable de la Gestión de Residuos Sólidos',
    profesion: 'Ingeniero Ambiental / Químico / Sanitario',
    cip: '',
    funciones: [
      'Conducir el registro interno de generación y manejo de residuos sólidos (Art. 48.1 literal b D.S. 014-2017-MINAM).',
      'Reportar la Declaración Anual y Manifiestos de Residuos Peligrosos en el SIGERSOL dentro de los plazos legales.',
      'Custodiar los Manifiestos de Residuos Peligrosos (MRSP) durante cinco (5) años para fiscalización de OEFA (Art. 56 literal b).',
      'Verificar permanentemente la vigencia del Registro Autoritativo en MINAM de las EO-RS contratadas.',
      'Supervisar las condiciones de seguridad e higiene del almacén central de residuos peligrosos.',
      'Activar el plan de contingencia ante derrames y notificar a OEFA dentro de las 24 horas siguientes (Art. 50).',
    ],
  },
};

const createInitialEmptyData = (): PmmrsData =>
  JSON.parse(JSON.stringify(INITIAL_EMPTY_DATA));

export const CreatePlanWizard: React.FC<CreatePlanWizardProps> = ({ initialData, onPlanCreated }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<PmmrsData>(() => {
    const saved = localStorage.getItem('pmrs_form_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error('Error al recuperar borrador:', e);
      }
    }
    return initialData ? JSON.parse(JSON.stringify(initialData)) : createInitialEmptyData();
  });

  const isResettingRef = React.useRef(false);
  const [confirmClearModalOpen, setConfirmClearModalOpen] = useState(false);
  const [resetToastMessage, setResetToastMessage] = useState<string | null>(null);

  // Escuchar evento para cargar datos demo instantáneamente
  useEffect(() => {
    const handleDemoEvent = (e: any) => {
      if (e.detail) {
        const demoClone = JSON.parse(JSON.stringify(e.detail));
        localStorage.setItem('pmrs_form_data', JSON.stringify(demoClone));
        setFormData(demoClone);
        setTouchedFields({});
        setAttemptedSteps({});
        setStepValidationBanner(null);
        setCurrentStepIndex(0);
      }
    };
    window.addEventListener('pmrs_load_demo_event', handleDemoEvent);
    return () => window.removeEventListener('pmrs_load_demo_event', handleDemoEvent);
  }, []);

  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // AI Technical Review in Step 13
  const [isReviewingAi, setIsReviewingAi] = useState(false);
  const [aiReviewResult, setAiReviewResult] = useState<string | null>(null);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);
  const [aiReviewCopied, setAiReviewCopied] = useState(false);

  // Step 13 audit filter state
  const [auditFilter, setAuditFilter] = useState<'todas' | 'criticas' | 'advertencias'>('todas');

  // Interactive validation states (tracks fields interacted with or step advancement attempts)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [attemptedSteps, setAttemptedSteps] = useState<Record<number, boolean>>({});
  const [stepValidationBanner, setStepValidationBanner] = useState<string | null>(null);

  const markFieldTouched = (fieldKey: string) => {
    setTouchedFields((prev) => (prev[fieldKey] ? prev : { ...prev, [fieldKey]: true }));
  };

  const isFieldEmpty = (fieldKey: string): boolean => {
    switch (fieldKey) {
      case 'razonSocial':
        return !formData.generalInfo.razonSocial || formData.generalInfo.razonSocial.trim().length === 0;
      case 'ruc':
        return !formData.generalInfo.ruc || formData.generalInfo.ruc.trim().length === 0;
      case 'departamento':
        return !formData.generalInfo.departamento || formData.generalInfo.departamento.trim().length === 0;
      case 'provincia':
        return !formData.generalInfo.provincia || formData.generalInfo.provincia.trim().length === 0;
      case 'distrito':
        return !formData.generalInfo.distrito || formData.generalInfo.distrito.trim().length === 0;
      case 'direccion':
        return !formData.generalInfo.direccion || formData.generalInfo.direccion.trim().length === 0;
      case 'coordenadasUTM':
        return !formData.generalInfo.coordenadasUTM || formData.generalInfo.coordenadasUTM.trim().length === 0;
      case 'actividadEconomica':
        return !formData.generalInfo.actividadEconomica || formData.generalInfo.actividadEconomica.trim().length === 0;
      case 'descripcionOperacion':
        return !formData.generalInfo.descripcionOperacion || formData.generalInfo.descripcionOperacion.trim().length === 0;
      case 'responsableTecnico':
        return !formData.generalInfo.responsableTecnico || formData.generalInfo.responsableTecnico.trim().length === 0;
      case 'cipResponsable':
        return !formData.generalInfo.cipResponsable || formData.generalInfo.cipResponsable.trim().length === 0;
      case 'objetivoGeneral':
        return !formData.objetivos.general || formData.objetivos.general.trim().length === 0;
      case 'objetivosEspecificos':
        return !formData.objetivos.especificos || formData.objetivos.especificos.length === 0 || formData.objetivos.especificos.some((o) => !o || o.trim().length === 0);
      case 'alcanceDescripcion':
        return !formData.alcance.descripcion || formData.alcance.descripcion.trim().length === 0;
      case 'nombreEORS':
        return !formData.gestionManejo.transporteExterno.nombreEORS || formData.gestionManejo.transporteExterno.nombreEORS.trim().length === 0;
      case 'responsableEmergencia':
        return !formData.planEmergencias.responsableEmergencia || formData.planEmergencias.responsableEmergencia.trim().length === 0;
      case 'telefonoEmergencia':
        return !formData.planEmergencias.telefonoEmergencia || formData.planEmergencias.telefonoEmergencia.trim().length === 0;
      case 'procedimientoDerrame':
        return !formData.planEmergencias.procedimientoDerrame || formData.planEmergencias.procedimientoDerrame.trim().length === 0;
      case 'funcionesNombres':
        return !formData.funcionesResponsable.nombres || formData.funcionesResponsable.nombres.trim().length === 0;
      case 'funcionesCip':
        return !formData.funcionesResponsable.cip || formData.funcionesResponsable.cip.trim().length === 0;
      default:
        return false;
    }
  };

  const getRequiredFieldsForStep = (stepIdx: number): string[] => {
    switch (stepIdx) {
      case 0:
        return [
          'razonSocial',
          'ruc',
          'departamento',
          'provincia',
          'distrito',
          'direccion',
          'coordenadasUTM',
          'actividadEconomica',
          'descripcionOperacion',
          'responsableTecnico',
          'cipResponsable',
        ];
      case 1:
        return ['objetivoGeneral', 'objetivosEspecificos', 'alcanceDescripcion'];
      case 5:
        return ['nombreEORS'];
      case 7:
        return ['responsableEmergencia', 'telefonoEmergencia', 'procedimientoDerrame'];
      case 11:
        return ['funcionesNombres', 'funcionesCip'];
      default:
        return [];
    }
  };

  const shouldShowFieldError = (fieldKey: string, stepIdx: number): boolean => {
    return Boolean(touchedFields[fieldKey] || attemptedSteps[stepIdx]) && isFieldEmpty(fieldKey);
  };

  const getInputClass = (fieldKey: string, stepIdx: number, extraClasses = 'px-3 py-2 rounded-lg') => {
    const hasError = shouldShowFieldError(fieldKey, stepIdx);
    return `w-full ${extraClasses} border transition-colors focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-red-500 bg-red-50/20 focus:ring-red-500'
        : 'border-slate-300 bg-white focus:ring-emerald-500'
    }`;
  };

  const validateCurrentStepAndNavigate = (targetStepIdx: number) => {
    if (targetStepIdx <= currentStepIndex) {
      setStepValidationBanner(null);
      setCurrentStepIndex(targetStepIdx);
      return;
    }

    const reqFields = getRequiredFieldsForStep(currentStepIndex);
    const missingFields = reqFields.filter((f) => isFieldEmpty(f));

    // Check list-based mandatory steps (Steps 3, 4, 5)
    let listMissingMessage: string | null = null;
    if (currentStepIndex === 2 && formData.fuentesGeneracion.length === 0) {
      listMissingMessage = 'Este campo es obligatorio. Registre al menos un proceso generador antes de continuar.';
    } else if (currentStepIndex === 3 && formData.inventarioResiduos.length === 0) {
      listMissingMessage = 'Este campo es obligatorio. Registre al menos un residuo en el inventario antes de continuar.';
    } else if (currentStepIndex === 4 && formData.estrategiasMinimizacion.length === 0) {
      listMissingMessage = 'Este campo es obligatorio. Registre al menos una estrategia de minimización antes de continuar.';
    }

    if (missingFields.length > 0 || listMissingMessage) {
      setAttemptedSteps((prev) => ({ ...prev, [currentStepIndex]: true }));
      const newTouched: Record<string, boolean> = { ...touchedFields };
      missingFields.forEach((f) => {
        newTouched[f] = true;
      });
      setTouchedFields(newTouched);
      setStepValidationBanner(
        listMissingMessage || 'Complete los campos obligatorios marcados antes de avanzar al siguiente paso.'
      );

      if (missingFields.length > 0) {
        setTimeout(() => {
          const el = document.getElementById(`pmmrs-field-${missingFields[0]}`);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 40);
      }
      return;
    }

    setStepValidationBanner(null);
    setCurrentStepIndex(targetStepIdx);
  };

  // Auto-save to localStorage (protected against reset race conditions)
  useEffect(() => {
    if (isResettingRef.current) {
      isResettingRef.current = false;
      return;
    }
    localStorage.setItem('pmrs_form_data', JSON.stringify(formData));
    setLastSaved(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [formData]);

  const validation = validatePmmrsData(formData);

  const handleResetForm = () => {
    setConfirmClearModalOpen(true);
  };

  const handleConfirmClearPmmrs = () => {
    // 1. Clean persistent storage for current PMMRS first to prevent autosave race condition
    isResettingRef.current = true;
    localStorage.removeItem('pmrs_form_data');
    localStorage.removeItem('pmmrsDraft');
    localStorage.removeItem('currentPmmrs');
    localStorage.removeItem('formData');

    // 2. Reset form state with a fresh deep clone of the initial structure
    const freshEmptyData = createInitialEmptyData();
    setFormData(freshEmptyData);

    // 3. Reset all validation, touched, dirty, attempted steps, and AI review states
    setTouchedFields({});
    setAttemptedSteps({});
    setStepValidationBanner(null);
    setAiReviewResult(null);
    setAiReviewError(null);
    setLastSaved(null);

    // 4. Return automatically to Step 1 — Datos Generales
    setCurrentStepIndex(0);

    // 5. Close confirmation dialog and display subtle toast notification
    setConfirmClearModalOpen(false);
    setResetToastMessage('PMMRS reiniciado correctamente.');
    setTimeout(() => {
      setResetToastMessage(null);
    }, 3500);
  };

  const handleLoadDemo = () => {
    const demoClone = JSON.parse(JSON.stringify(FICTITIOUS_DEMO_PMMRS));
    localStorage.setItem('pmrs_form_data', JSON.stringify(demoClone));
    setFormData(demoClone);
    setTouchedFields({});
    setAttemptedSteps({});
    setStepValidationBanner(null);
    setCurrentStepIndex(0);
  };

  const handleExportWord = async () => {
    setIsExportingWord(true);
    try {
      const blob = await generatePmmrsDocx(formData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PMMRS_${(formData.generalInfo.razonSocial || 'Plan').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error al generar Word: ' + err.message);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const pdf = generatePmmrsPdf(formData);
      pdf.save(`PMMRS_${(formData.generalInfo.razonSocial || 'Plan').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`);
    } catch (err: any) {
      alert('Error al generar PDF: ' + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleReviewPlanWithAi = async () => {
    setIsReviewingAi(true);
    setAiReviewError(null);
    setAiReviewResult(null);

    try {
      const res = await fetch('/api/assist-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: 'revision_global',
          sectionTitle: 'Revisión y Consistencia Técnica Global del PMMRS',
          currentData: {
            objetivos: formData.objetivos,
            alcance: formData.alcance,
            residuos: formData.inventarioResiduos.map((w) => ({
              nombre: w.nombre,
              peligrosidad: w.clasificacionManejo,
              mensual: w.cantidadMensual,
              unidad: w.unidad,
            })),
            estrategias: formData.estrategiasMinimizacion.map((s) => ({
              tipo: s.tipoEstrategia,
              meta: s.metaReduccion,
              medida: s.descripcionMedida,
            })),
            almacenamientoPeligrosos: formData.gestionManejo.almacenamiento.centralPeligrosos,
            transporteEO: formData.gestionManejo.transporteExterno.nombreEORS,
            disposicionFinal: formData.gestionManejo.disposicionFinal.tipoInfraestructura,
          },
          companyProfile: {
            razonSocial: formData.generalInfo.razonSocial,
            ruc: formData.generalInfo.ruc,
            actividadEconomica: formData.generalInfo.actividadEconomica,
            departamento: formData.generalInfo.departamento,
            provincia: formData.generalInfo.provincia,
            distrito: formData.generalInfo.distrito,
          },
          promptInstruction:
            'Analice la redacción técnica global y coherencia del PMMRS con base estricta en los datos ya ingresados por el usuario conforme a la R.M. 089-2023-MINAM. No invente datos no proporcionados; destaque fortalezas de la redacción y recomendaciones de mejora técnica puntuales.',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiReviewResult(data.textoRedactado || 'El plan presenta redacción técnica coherente con los datos ingresados.');
      } else {
        const err = await res.json().catch(() => ({}));
        setAiReviewError(err.error || 'No fue posible completar la revisión de redacción con IA.');
      }
    } catch (e: any) {
      console.error('Error al revisar plan con IA:', e);
      setAiReviewError('No fue posible conectar con el servicio de IA. Intente nuevamente.');
    } finally {
      setIsReviewingAi(false);
    }
  };

  // Updaters helper
  const updateGeneral = (field: keyof PmmrsData['generalInfo'], value: any) => {
    setFormData((prev) => ({
      ...prev,
      generalInfo: { ...prev.generalInfo, [field]: value },
    }));
  };

  const updateObjetivos = (field: 'general' | 'especificos', value: any) => {
    setFormData((prev) => ({
      ...prev,
      objetivos: { ...prev.objetivos, [field]: value },
    }));
  };

  const updateAlcance = (field: keyof PmmrsData['alcance'], value: any) => {
    setFormData((prev) => ({
      ...prev,
      alcance: { ...prev.alcance, [field]: value },
    }));
  };

  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
              Módulo 1
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Elaborar PMMRS No Municipal
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Formulario guiado paso a paso según el Contenido Mínimo de la R.M. N° 089-2023-MINAM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {resetToastMessage && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center mr-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {resetToastMessage}
            </span>
          )}

          {lastSaved && !resetToastMessage && (
            <span className="text-[11px] text-slate-400 flex items-center mr-2">
              <Save className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Guardado: {lastSaved}
            </span>
          )}

          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#185844] border border-emerald-300 font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
            title="Cargar plan de demostración completo"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cargar Demo</span>
          </button>

          <button
            type="button"
            onClick={handleResetForm}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors flex items-center space-x-1 cursor-pointer"
            title="Borrar campos e iniciar en blanco"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Steps Navigation Bar (Horizontal Scrollable) */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs overflow-x-auto scrollbar-thin">
        <div className="flex items-center min-w-max space-x-1">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => validateCurrentStepAndNavigate(idx)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : isCompleted
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
                <span>{step.title.split('.')[0]}. {step.title.split('.')[1]}</span>
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Content Container */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 sm:px-8 pt-3 sm:pt-4 pb-5 sm:pb-6 shadow-xs">
        {/* FILA 1: NAVEGACIÓN SUPERIOR EXCLUSIVA */}
        <div className="pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={() => validateCurrentStepAndNavigate(Math.max(0, currentStepIndex - 1))}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Paso Anterior</span>
          </button>

          {currentStepIndex < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => validateCurrentStepAndNavigate(Math.min(STEPS.length - 1, currentStepIndex + 1))}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <span>Siguiente Paso</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* FILA 2: ENCABEZADO DE LA SECCIÓN */}
        <div className="border-b border-slate-200 pb-4 mb-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <currentStep.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{currentStep.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{currentStep.desc}</p>
            </div>
          </div>
        </div>

        {/* Interactive Step Validation Banner */}
        {stepValidationBanner && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{stepValidationBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStepValidationBanner(null)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* STEP 1: DATOS GENERALES */}
        {currentStepIndex === 0 && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Razón social de la empresa titular
                </label>
                <input
                  id="pmmrs-field-razonSocial"
                  type="text"
                  required
                  value={formData.generalInfo.razonSocial}
                  onBlur={() => markFieldTouched('razonSocial')}
                  onChange={(e) => {
                    updateGeneral('razonSocial', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: AGROINDUSTRIAS DEL NORTE S.A.C."
                  className={getInputClass('razonSocial', 0)}
                />
                {shouldShowFieldError('razonSocial', 0) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Número de RUC
                </label>
                <input
                  id="pmmrs-field-ruc"
                  type="text"
                  required
                  maxLength={11}
                  value={formData.generalInfo.ruc}
                  onBlur={() => markFieldTouched('ruc')}
                  onChange={(e) => {
                    updateGeneral('ruc', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: 20601234567"
                  className={getInputClass('ruc', 0)}
                />
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  11 dígitos numéricos. Debe comenzar con 10 o 20 (SUNAT Perú).
                </span>
                {shouldShowFieldError('ruc', 0) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departamento</label>
                <input
                  id="pmmrs-field-departamento"
                  type="text"
                  required
                  value={formData.generalInfo.departamento}
                  onBlur={() => markFieldTouched('departamento')}
                  onChange={(e) => {
                    updateGeneral('departamento', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  className={getInputClass('departamento', 0)}
                />
                {shouldShowFieldError('departamento', 0) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Provincia</label>
                <input
                  id="pmmrs-field-provincia"
                  type="text"
                  required
                  value={formData.generalInfo.provincia}
                  onBlur={() => markFieldTouched('provincia')}
                  onChange={(e) => {
                    updateGeneral('provincia', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  className={getInputClass('provincia', 0)}
                />
                {shouldShowFieldError('provincia', 0) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Distrito</label>
                <input
                  id="pmmrs-field-distrito"
                  type="text"
                  required
                  value={formData.generalInfo.distrito}
                  onBlur={() => markFieldTouched('distrito')}
                  onChange={(e) => {
                    updateGeneral('distrito', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: Chao / Lurín / Majes"
                  className={getInputClass('distrito', 0)}
                />
                {shouldShowFieldError('distrito', 0) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección o predio</label>
                <input
                  id="pmmrs-field-direccion"
                  type="text"
                  required
                  value={formData.generalInfo.direccion}
                  onBlur={() => markFieldTouched('direccion')}
                  onChange={(e) => {
                    updateGeneral('direccion', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: Km 498 Carretera Panamericana Norte"
                  className={getInputClass('direccion', 0)}
                />
                {shouldShowFieldError('direccion', 0) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Coordenadas UTM
                </label>
                <input
                  id="pmmrs-field-coordenadasUTM"
                  type="text"
                  required
                  value={formData.generalInfo.coordenadasUTM}
                  onBlur={() => markFieldTouched('coordenadasUTM')}
                  onChange={(e) => {
                    updateGeneral('coordenadasUTM', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: Zona 17S, Este: 724150 m E, Norte: 9062300 m N"
                  className={getInputClass('coordenadasUTM', 0)}
                />
                <span className="block text-[11px] text-slate-400 mt-0.5">Sistema geodésico WGS84.</span>
                {shouldShowFieldError('coordenadasUTM', 0) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Actividad económica principal
                </label>
                <input
                  id="pmmrs-field-actividadEconomica"
                  type="text"
                  required
                  value={formData.generalInfo.actividadEconomica}
                  onBlur={() => markFieldTouched('actividadEconomica')}
                  onChange={(e) => {
                    updateGeneral('actividadEconomica', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: Procesamiento agroindustrial de frutas y hortalizas"
                  className={getInputClass('actividadEconomica', 0)}
                />
                {shouldShowFieldError('actividadEconomica', 0) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código CIIU</label>
                <input
                  type="text"
                  value={formData.generalInfo.ciiu}
                  onChange={(e) => updateGeneral('ciiu', e.target.value)}
                  placeholder="Ej: 1030 - Elaboración y conservación de frutas"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="block text-[11px] text-slate-400 mt-0.5">Clasificación Industrial Internacional Uniforme (Revisión 4).</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Descripción de la operación y procesos
              </label>
              <textarea
                id="pmmrs-field-descripcionOperacion"
                rows={3}
                required
                value={formData.generalInfo.descripcionOperacion}
                onBlur={() => markFieldTouched('descripcionOperacion')}
                onChange={(e) => {
                  updateGeneral('descripcionOperacion', e.target.value);
                  if (stepValidationBanner) setStepValidationBanner(null);
                }}
                placeholder="Describa el flujo productivo, maquinaria principal y turnos operativos..."
                className={getInputClass('descripcionOperacion', 0)}
              />
              {shouldShowFieldError('descripcionOperacion', 0) && (
                <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responsable técnico de la gestión
                </label>
                <input
                  id="pmmrs-field-responsableTecnico"
                  type="text"
                  required
                  value={formData.generalInfo.responsableTecnico}
                  onBlur={() => markFieldTouched('responsableTecnico')}
                  onChange={(e) => {
                    updateGeneral('responsableTecnico', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: Ing. Lucía Paredes Saldaña"
                  className={`${getInputClass('responsableTecnico', 0)} mb-1`}
                />
                {shouldShowFieldError('responsableTecnico', 0) && (
                  <p className="text-[11px] text-red-600 mb-2">Este campo es obligatorio.</p>
                )}
                <span className="block text-[11px] text-slate-400 mb-2">Ingeniero colegiado designado para la gestión ambiental.</span>
                <input
                  type="text"
                  value={formData.generalInfo.profesionResponsable}
                  onChange={(e) => updateGeneral('profesionResponsable', e.target.value)}
                  placeholder="Profesión: Ingeniero Ambiental / Químico / Sanitario"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Número de colegiatura CIP
                </label>
                <input
                  id="pmmrs-field-cipResponsable"
                  type="text"
                  required
                  value={formData.generalInfo.cipResponsable}
                  onBlur={() => markFieldTouched('cipResponsable')}
                  onChange={(e) => {
                    updateGeneral('cipResponsable', e.target.value);
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: CIP N° 189422"
                  className={`${getInputClass('cipResponsable', 0)} mb-1`}
                />
                {shouldShowFieldError('cipResponsable', 0) && (
                  <p className="text-[11px] text-red-600 mb-2">Este campo es obligatorio.</p>
                )}
                <span className="block text-[11px] text-slate-400 mb-2">Colegiatura profesional habilitada.</span>
                <input
                  type="text"
                  value={formData.generalInfo.emailResponsable}
                  onChange={(e) => updateGeneral('emailResponsable', e.target.value)}
                  placeholder="Email de contacto corporativo"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: OBJETIVOS Y ALCANCE */}
        {currentStepIndex === 1 && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Objetivo general del PMMRS
              </label>
              <textarea
                id="pmmrs-field-objetivoGeneral"
                rows={3}
                required
                value={formData.objetivos.general}
                onBlur={() => markFieldTouched('objetivoGeneral')}
                onChange={(e) => {
                  updateObjetivos('general', e.target.value);
                  if (stepValidationBanner) setStepValidationBanner(null);
                }}
                placeholder="Ej: Implementar un sistema de gestión integral de residuos sólidos no municipales orientado a la prevención y minimización en origen..."
                className={getInputClass('objetivoGeneral', 1)}
              />
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Sección 2 del contenido mínimo de la R.M. N° 089-2023-MINAM.
              </span>
              {shouldShowFieldError('objetivoGeneral', 1) && (
                <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block font-semibold text-slate-700">Objetivos específicos</label>
                  <span className="text-[11px] text-slate-400">Metas específicas y cuantificables de prevención, valorización o manejo seguro.</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateObjetivos('especificos', [
                      ...formData.objetivos.especificos,
                      'Nuevo objetivo específico de valorización o segregación',
                    ])
                  }
                  className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Objetivo</span>
                </button>
              </div>

              <div className="space-y-2">
                {formData.objetivos.especificos.map((obj, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-slate-400 font-bold w-6">{idx + 1}.</span>
                    <input
                      id={idx === 0 ? 'pmmrs-field-objetivosEspecificos' : undefined}
                      type="text"
                      required
                      value={obj}
                      onBlur={() => markFieldTouched('objetivosEspecificos')}
                      onChange={(e) => {
                        const newObjs = [...formData.objetivos.especificos];
                        newObjs[idx] = e.target.value;
                        updateObjetivos('especificos', newObjs);
                        if (stepValidationBanner) setStepValidationBanner(null);
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-lg border transition-colors focus:ring-2 focus:outline-none ${
                        shouldShowFieldError('objetivosEspecificos', 1) && (!obj || obj.trim().length === 0)
                          ? 'border-red-500 bg-red-50/20 focus:ring-red-500'
                          : 'border-slate-300 bg-white focus:ring-emerald-500'
                      }`}
                    />
                    {formData.objetivos.especificos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newObjs = formData.objetivos.especificos.filter((_, i) => i !== idx);
                          updateObjetivos('especificos', newObjs);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {shouldShowFieldError('objetivosEspecificos', 1) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="font-bold text-slate-900 mb-2">3. Alcance del Plan</h3>
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Descripción del alcance</label>
                  <textarea
                    id="pmmrs-field-alcanceDescripcion"
                    rows={2}
                    required
                    value={formData.alcance.descripcion}
                    onBlur={() => markFieldTouched('alcanceDescripcion')}
                    onChange={(e) => {
                      updateAlcance('descripcion', e.target.value);
                      if (stepValidationBanner) setStepValidationBanner(null);
                    }}
                    placeholder="El plan aplica a todas las instalaciones de la planta..."
                    className={getInputClass('alcanceDescripcion', 1)}
                  />
                  {shouldShowFieldError('alcanceDescripcion', 1) && (
                    <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Personal comprendido</label>
                    <input
                      type="text"
                      value={formData.alcance.personalComprendido}
                      onChange={(e) => updateAlcance('personalComprendido', e.target.value)}
                      placeholder="Ej: Colaboradores permanentes y personal de temporada"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contratistas comprendidos</label>
                    <input
                      type="text"
                      value={formData.alcance.contratistasComprendidos}
                      onChange={(e) => updateAlcance('contratistasComprendidos', e.target.value)}
                      placeholder="Ej: Empresas de transporte, maestranza y obras civiles"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FUENTES DE GENERACIÓN */}
        {currentStepIndex === 2 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Fuentes y Procesos Generadores por Etapa</h3>
                <p className="text-xs text-slate-500">Mapeo de entradas, actividades y residuos sólidos generados.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newSource = {
                    id: 'FG-' + Date.now(),
                    etapa: 'Operación',
                    proceso: 'Nuevo Proceso Operativo',
                    actividades: 'Descripción de tareas de la actividad',
                    residuosGenerados: 'Residuos resultantes',
                  };
                  setFormData((prev) => ({
                    ...prev,
                    fuentesGeneracion: [...prev.fuentesGeneracion, newSource],
                  }));
                }}
                className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Proceso</span>
              </button>
            </div>

            {formData.fuentesGeneracion.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <Factory className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">No hay fuentes de generación registradas.</p>
                <button
                  type="button"
                  onClick={() => {
                    const newSource = {
                      id: 'FG-' + Date.now(),
                      etapa: 'Operación',
                      proceso: 'Operación Principal',
                      actividades: '',
                      residuosGenerados: '',
                    };
                    setFormData((prev) => ({
                      ...prev,
                      fuentesGeneracion: [newSource],
                    }));
                  }}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                >
                  Agregar primer proceso
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.fuentesGeneracion.map((src, idx) => (
                  <div key={src.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-700">#{idx + 1}</span>
                        <select
                          value={src.etapa}
                          onChange={(e) => {
                            const updated = [...formData.fuentesGeneracion];
                            updated[idx].etapa = e.target.value;
                            setFormData((prev) => ({ ...prev, fuentesGeneracion: updated }));
                          }}
                          className="px-2 py-1 rounded border border-slate-300 bg-white font-medium text-xs"
                        >
                          <option value="Planificación">Planificación</option>
                          <option value="Construcción">Construcción</option>
                          <option value="Operación">Operación</option>
                          <option value="Mantenimiento">Mantenimiento</option>
                          <option value="Cierre">Cierre</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.fuentesGeneracion.filter((_, i) => i !== idx);
                          setFormData((prev) => ({ ...prev, fuentesGeneracion: updated }));
                        }}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Proceso</label>
                        <input
                          type="text"
                          value={src.proceso}
                          onChange={(e) => {
                            const updated = [...formData.fuentesGeneracion];
                            updated[idx].proceso = e.target.value;
                            setFormData((prev) => ({ ...prev, fuentesGeneracion: updated }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Actividades</label>
                        <input
                          type="text"
                          value={src.actividades}
                          onChange={(e) => {
                            const updated = [...formData.fuentesGeneracion];
                            updated[idx].actividades = e.target.value;
                            setFormData((prev) => ({ ...prev, fuentesGeneracion: updated }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Residuos generados</label>
                        <input
                          type="text"
                          value={src.residuosGenerados}
                          onChange={(e) => {
                            const updated = [...formData.fuentesGeneracion];
                            updated[idx].residuosGenerados = e.target.value;
                            setFormData((prev) => ({ ...prev, fuentesGeneracion: updated }));
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: INVENTARIO DE RESIDUOS */}
        {currentStepIndex === 3 && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <div>
                <div className="font-bold text-emerald-900 text-sm">Resumen Métrico del Inventario</div>
                <div className="text-xs text-emerald-800">
                  Total Generado: <strong>{validation.totalResiduosMensualTn} tn/mes</strong> ({validation.totalResiduosAnualTn} tn/año) •{' '}
                  Peligrosos: <strong>{validation.totalPeligrososTn} tn/mes ({validation.porcentajePeligrosos}%)</strong> •{' '}
                  No Peligrosos: <strong>{validation.totalNoPeligrososTn} tn/mes</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newWaste: WasteItem = {
                    id: 'W-' + Date.now(),
                    nombre: 'Nuevo residuo sólido',
                    etapa: 'Operación',
                    procesoGenerador: 'Línea de producción',
                    clasificacionManejo: 'No peligroso',
                    clasificacionGestion: 'No municipal',
                    codigoConvenioBasilea: 'B3010',
                    cantidadMensual: 0.5,
                    unidad: 'tn/mes',
                    cantidadAnual: 6.0,
                    metodoEstimacion: 'Pesaje directo',
                  };
                  setFormData((prev) => ({
                    ...prev,
                    inventarioResiduos: [...prev.inventarioResiduos, newWaste],
                  }));
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Residuo</span>
              </button>
            </div>

            {/* Waste items list / table */}
            <div className="space-y-4">
              {formData.inventarioResiduos.map((waste, idx) => (
                <div
                  key={waste.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    waste.clasificacionManejo === 'Peligroso'
                      ? 'bg-red-50/40 border-red-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">#{idx + 1}</span>
                      <input
                        type="text"
                        value={waste.nombre}
                        onChange={(e) => {
                          const updated = [...formData.inventarioResiduos];
                          updated[idx].nombre = e.target.value;
                          setFormData((prev) => ({ ...prev, inventarioResiduos: updated }));
                        }}
                        placeholder="Nombre descriptivo del residuo"
                        className="px-3 py-1 font-semibold rounded border border-slate-300 bg-white text-xs sm:text-sm w-64 sm:w-80"
                      />
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          waste.clasificacionManejo === 'Peligroso'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-emerald-200 text-emerald-800'
                        }`}
                      >
                        {waste.clasificacionManejo}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.inventarioResiduos.filter((_, i) => i !== idx);
                        setFormData((prev) => ({ ...prev, inventarioResiduos: updated }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Etapa</label>
                      <select
                        value={waste.etapa}
                        onChange={(e) => {
                          const updated = [...formData.inventarioResiduos];
                          updated[idx].etapa = e.target.value as any;
                          setFormData((prev) => ({ ...prev, inventarioResiduos: updated }));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      >
                        <option value="Planificación">Planificación</option>
                        <option value="Construcción">Construcción</option>
                        <option value="Operación">Operación</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Cierre">Cierre</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center space-x-1 text-[11px] font-semibold text-slate-600 mb-1">
                        <span>Peligrosidad</span>
                        <span
                          title="Criterios y características de peligrosidad según Art. 30 del D.L. 1278 y D.S. 014-2017-MINAM"
                          className="text-slate-400 hover:text-slate-600 cursor-help select-none"
                        >
                          ⓘ
                        </span>
                      </label>
                      <select
                        value={waste.clasificacionManejo}
                        onChange={(e) => {
                          const updated = [...formData.inventarioResiduos];
                          const val = e.target.value as any;
                          updated[idx].clasificacionManejo = val;
                          if (val === 'Peligroso' && (!updated[idx].codigoConvenioBasilea || updated[idx].codigoConvenioBasilea?.startsWith('B'))) {
                            updated[idx].codigoConvenioBasilea = 'A4130';
                            updated[idx].caracteristicasPeligrosidad = 'Tóxico';
                          } else if (val === 'No peligroso' && updated[idx].codigoConvenioBasilea?.startsWith('A')) {
                            updated[idx].codigoConvenioBasilea = 'B3010';
                            updated[idx].caracteristicasPeligrosidad = undefined;
                          }
                          setFormData((prev) => ({ ...prev, inventarioResiduos: updated }));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold"
                      >
                        <option value="No peligroso">No peligroso</option>
                        <option value="Peligroso">Peligroso</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Código Basilea</label>
                      <input
                        type="text"
                        value={waste.codigoConvenioBasilea || ''}
                        onChange={(e) => {
                          const updated = [...formData.inventarioResiduos];
                          updated[idx].codigoConvenioBasilea = e.target.value;
                          setFormData((prev) => ({ ...prev, inventarioResiduos: updated }));
                        }}
                        placeholder="Ej: A4130 / B3010"
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cantidad mensual</label>
                      <input
                        type="number"
                        step="0.01"
                        value={waste.cantidadMensual}
                        onChange={(e) => {
                          const updated = [...formData.inventarioResiduos];
                          const qty = parseFloat(e.target.value) || 0;
                          updated[idx].cantidadMensual = qty;
                          updated[idx].cantidadAnual = +(qty * 12).toFixed(2);
                          setFormData((prev) => ({ ...prev, inventarioResiduos: updated }));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Unidad</label>
                      <select
                        value={waste.unidad}
                        onChange={(e) => {
                          const updated = [...formData.inventarioResiduos];
                          updated[idx].unidad = e.target.value as any;
                          setFormData((prev) => ({ ...prev, inventarioResiduos: updated }));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium"
                      >
                        <option value="tn/mes">tn/mes</option>
                        <option value="kg/mes">kg/mes</option>
                        <option value="m3/mes">m3/mes</option>
                        <option value="unidades/mes">unidades/mes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Método de estimación</label>
                      <select
                        value={waste.metodoEstimacion}
                        onChange={(e) => {
                          const updated = [...formData.inventarioResiduos];
                          updated[idx].metodoEstimacion = e.target.value as any;
                          setFormData((prev) => ({ ...prev, inventarioResiduos: updated }));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      >
                        <option value="Pesaje directo">Pesaje directo</option>
                        <option value="Balance de materia">Balance de materia</option>
                        <option value="Factor de generación">Factor de generación</option>
                        <option value="Muestreo y caracterización">Muestreo</option>
                        <option value="Estimación de proyecto">Estimación proyecto</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: ESTRATEGIAS DE MINIMIZACIÓN */}
        {currentStepIndex === 4 && (
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Estrategias de Prevención y Minimización en la Fuente</h3>
              <button
                type="button"
                onClick={() => {
                  const newStrat: MinimizationStrategy = {
                    id: 'MIN-' + Date.now(),
                    residuoOProceso: 'Insumo o proceso específico',
                    etapa: 'Operación',
                    tipoEstrategia: 'Prevención en origen',
                    descripcionMedida: 'Descripción técnica de la medida organizativa o tecnológica',
                    metaReduccion: 'Reducción del 10% anual',
                    responsable: 'Jefatura de Operaciones',
                  };
                  setFormData((prev) => ({
                    ...prev,
                    estrategiasMinimizacion: [...prev.estrategiasMinimizacion, newStrat],
                  }));
                }}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium text-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Estrategia</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.estrategiasMinimizacion.map((strat, idx) => (
                <div key={strat.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Estrategia #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.estrategiasMinimizacion.filter((_, i) => i !== idx);
                        setFormData((prev) => ({ ...prev, estrategiasMinimizacion: updated }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Residuo o proceso</label>
                      <input
                        type="text"
                        value={strat.residuoOProceso}
                        onChange={(e) => {
                          const updated = [...formData.estrategiasMinimizacion];
                          updated[idx].residuoOProceso = e.target.value;
                          setFormData((prev) => ({ ...prev, estrategiasMinimizacion: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tipo de estrategia</label>
                      <select
                        value={strat.tipoEstrategia}
                        onChange={(e) => {
                          const updated = [...formData.estrategiasMinimizacion];
                          updated[idx].tipoEstrategia = e.target.value as any;
                          setFormData((prev) => ({ ...prev, estrategiasMinimizacion: updated }));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      >
                        <option value="Prevención en origen">Prevención en origen</option>
                        <option value="Sustitución de insumos">Sustitución de insumos</option>
                        <option value="Ecodiseño">Ecodiseño</option>
                        <option value="Retornabilidad de envases">Retornabilidad de envases</option>
                        <option value="Aprovechamiento material descarte">Material de descarte (Art. 4 y 5)</option>
                        <option value="Compostaje interno">Compostaje interno</option>
                        <option value="Logística inversa">Logística inversa (Bienes priorizados)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Meta de reducción</label>
                      <input
                        type="text"
                        value={strat.metaReduccion}
                        onChange={(e) => {
                          const updated = [...formData.estrategiasMinimizacion];
                          updated[idx].metaReduccion = e.target.value;
                          setFormData((prev) => ({ ...prev, estrategiasMinimizacion: updated }));
                        }}
                        placeholder="Ej: Reducir 20% anual"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Descripción de la medida operativa</label>
                    <textarea
                      rows={2}
                      value={strat.descripcionMedida}
                      onChange={(e) => {
                        const updated = [...formData.estrategiasMinimizacion];
                        updated[idx].descripcionMedida = e.target.value;
                        setFormData((prev) => ({ ...prev, estrategiasMinimizacion: updated }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: GESTIÓN Y MANEJO */}
        {currentStepIndex === 5 && (
          <div className="space-y-6 text-xs sm:text-sm">
            {/* 6.1 Segregación */}
            <div>
              <h3 className="font-bold text-slate-900 mb-1">
                6.1 Segregación y Código de Colores (NTP 900.058:2019 - Ámbito No Municipal)
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Para el ámbito no municipal, la NTP 900.058:2019 (Tabla 2) establece 7 colores específicos (Plástico = Blanco, Metales = Amarillo, Papel = Azul, etc.).
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {formData.gestionManejo.segregacion.colores.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center space-y-1">
                    <div
                      className="w-8 h-8 rounded-full mx-auto border shadow-xs"
                      style={{ backgroundColor: c.colorHex }}
                    />
                    <div className="font-bold text-[11px] text-slate-800">{c.tipo}</div>
                    <div className="text-[10px] font-semibold text-emerald-800">{c.color}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6.2 Almacenamiento Central de Residuos Peligrosos */}
            <div className="p-4 sm:p-5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    6.2 Almacén Central de Residuos Peligrosos (Art. 54 y 55 D.S. 014-2017-MINAM)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  Infraestructura No Municipal
                </span>
              </div>

              {/* Grid de 2 columnas: Izquierda (Formulario 58%), Derecha (Vista Técnica Interactiva 42%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Columna Izquierda: Formulario y Checkboxes */}
                <div className="lg:col-span-7 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Marque las condiciones técnicas verificables con las que cuenta el almacén central de residuos peligrosos para asegurar la estanqueidad, ventilación y respuesta a emergencias:
                  </p>

                  <div className="space-y-2.5 text-xs">
                    {/* Condición 1: Losa impermeable */}
                    <label
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleLosaImpermeable
                          ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleLosaImpermeable}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            gestionManejo: {
                              ...prev.gestionManejo,
                              almacenamiento: {
                                ...prev.gestionManejo.almacenamiento,
                                centralPeligrosos: {
                                  ...prev.gestionManejo.almacenamiento.centralPeligrosos,
                                  cumpleLosaImpermeable: e.target.checked,
                                },
                              },
                            },
                          }));
                        }}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block text-slate-900">
                          Losa de concreto impermeable con resina protectora
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                          Base de concreto estanca recubierta con resina epóxica resistente a derrames químicos y aceites.
                        </span>
                      </div>
                    </label>

                    {/* Condición 2: Sardinel de contención */}
                    <label
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleSardinelContencion
                          ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleSardinelContencion}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            gestionManejo: {
                              ...prev.gestionManejo,
                              almacenamiento: {
                                ...prev.gestionManejo.almacenamiento,
                                centralPeligrosos: {
                                  ...prev.gestionManejo.almacenamiento.centralPeligrosos,
                                  cumpleSardinelContencion: e.target.checked,
                                },
                              },
                            },
                          }));
                        }}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block text-slate-900">
                          Sardinel de contención perimetral (mínimo 110% volumen mayor)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                          Muro perimetral estanco para retener fugas o derrames accidentales del recipiente de mayor capacidad.
                        </span>
                      </div>
                    </label>

                    {/* Condición 3: Techo y ventilación cruzada */}
                    <label
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleTechoVentilacion
                          ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleTechoVentilacion}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            gestionManejo: {
                              ...prev.gestionManejo,
                              almacenamiento: {
                                ...prev.gestionManejo.almacenamiento,
                                centralPeligrosos: {
                                  ...prev.gestionManejo.almacenamiento.centralPeligrosos,
                                  cumpleTechoVentilacion: e.target.checked,
                                },
                              },
                            },
                          }));
                        }}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block text-slate-900">
                          Techo y ventilación cruzada adecuada
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                          Estructura techada con louvers o aperturas opuestas que garantizan renovación continua del aire.
                        </span>
                      </div>
                    </label>

                    {/* Condición 4: Kit antiderrame y extintor */}
                    <label
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleKitAntiderrame
                          ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleKitAntiderrame}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            gestionManejo: {
                              ...prev.gestionManejo,
                              almacenamiento: {
                                ...prev.gestionManejo.almacenamiento,
                                centralPeligrosos: {
                                  ...prev.gestionManejo.almacenamiento.centralPeligrosos,
                                  cumpleKitAntiderrame: e.target.checked,
                                },
                              },
                            },
                          }));
                        }}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block text-slate-900">
                          Kit antiderrame operativo y extintor contra incendio
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">
                          Material absorbente, paños oleofílicos, EPPs de respuesta y extintor PQS/CO2 con carga vigente.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Campo: Tiempo máximo de almacenamiento */}
                  <div className="pt-3 border-t border-slate-200 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Tiempo máximo de almacenamiento de residuos peligrosos
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          max={12}
                          min={1}
                          value={formData.gestionManejo.almacenamiento.centralPeligrosos.tiempoMaximoMeses}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setFormData((prev) => ({
                              ...prev,
                              gestionManejo: {
                                ...prev.gestionManejo,
                                almacenamiento: {
                                  ...prev.gestionManejo.almacenamiento,
                                  centralPeligrosos: {
                                    ...prev.gestionManejo.almacenamiento.centralPeligrosos,
                                    tiempoMaximoMeses: val,
                                  },
                                },
                              },
                            }));
                          }}
                          className={`w-24 px-2.5 py-1.5 rounded-lg border font-bold text-xs bg-white ${
                            formData.gestionManejo.almacenamiento.centralPeligrosos.tiempoMaximoMeses > 12
                              ? 'border-red-400 text-red-700 bg-red-50 focus:ring-red-400'
                              : 'border-slate-300 text-slate-800 focus:ring-emerald-500'
                          }`}
                        />
                      </div>
                      <span className="text-xs text-slate-600">
                        meses (límite legal máximo: <strong>12 meses</strong> conforme al Art. 55 del D.S. 014-2017-MINAM).
                      </span>
                    </div>

                    {formData.gestionManejo.almacenamiento.centralPeligrosos.tiempoMaximoMeses > 12 && (
                      <p className="text-[11px] font-semibold text-rose-700 flex items-center space-x-1 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Advertencia legal: El almacenamiento de residuos peligrosos no puede superar los 12 meses (Art. 55).</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Vista Técnica Interactiva */}
                <div className="lg:col-span-5">
                  <HazardousStoragePreview
                    hasImpermeableFloor={formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleLosaImpermeable}
                    hasContainmentCurb={formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleSardinelContencion}
                    hasRoofAndVentilation={formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleTechoVentilacion}
                    hasSpillKitAndExtinguisher={formData.gestionManejo.almacenamiento.centralPeligrosos.cumpleKitAntiderrame}
                    maxStorageMonths={formData.gestionManejo.almacenamiento.centralPeligrosos.tiempoMaximoMeses}
                  />
                </div>
              </div>
            </div>

            {/* 6.3 EO-RS y Disposición Final */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Transporte Externo (EO-RS Autorizada)
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nombre de la EO-RS</label>
                  <input
                    id="pmmrs-field-nombreEORS"
                    type="text"
                    required
                    value={formData.gestionManejo.transporteExterno.nombreEORS}
                    onBlur={() => markFieldTouched('nombreEORS')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        gestionManejo: {
                          ...prev.gestionManejo,
                          transporteExterno: { ...prev.gestionManejo.transporteExterno, nombreEORS: val },
                        },
                      }));
                      if (stepValidationBanner) setStepValidationBanner(null);
                    }}
                    placeholder="Ej: OPERADORA AMBIENTAL DEL PERÚ S.A.C."
                    className={getInputClass('nombreEORS', 5, 'px-2.5 py-1.5 rounded text-xs')}
                  />
                  {shouldShowFieldError('nombreEORS', 5) && (
                    <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Registro autoritativo MINAM</label>
                  <input
                    type="text"
                    value={formData.gestionManejo.transporteExterno.registroMINAM}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        gestionManejo: {
                          ...prev.gestionManejo,
                          transporteExterno: { ...prev.gestionManejo.transporteExterno, registroMINAM: val },
                        },
                      }));
                    }}
                    placeholder="Ej: EO-RS-00421-2022"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Disposición Final Autorizada
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tipo de infraestructura</label>
                  <select
                    value={formData.gestionManejo.disposicionFinal.tipoInfraestructura}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setFormData((prev) => ({
                        ...prev,
                        gestionManejo: {
                          ...prev.gestionManejo,
                          disposicionFinal: { ...prev.gestionManejo.disposicionFinal, tipoInfraestructura: val },
                        },
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold"
                  >
                    <option value="Relleno de Seguridad">Relleno de Seguridad (Para Peligrosos)</option>
                    <option value="Relleno Sanitario">Relleno Sanitario (Para No Peligrosos)</option>
                    <option value="Escombrera autorizada">Escombrera Autorizada (Construcción/Demolición)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nombre de la instalación</label>
                  <input
                    type="text"
                    value={formData.gestionManejo.disposicionFinal.nombrePlanta}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        gestionManejo: {
                          ...prev.gestionManejo,
                          disposicionFinal: { ...prev.gestionManejo.disposicionFinal, nombrePlanta: val },
                        },
                      }));
                    }}
                    placeholder="Ej: Relleno de Seguridad Bélico"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: MEDIDAS AMBIENTALES */}
        {currentStepIndex === 6 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">7. Matriz de Medidas Ambientales</h3>
                <p className="text-xs text-slate-500">Acciones de mitigación de impacto sobre suelo, agua y aire.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newM: EnvironmentalMeasure = {
                    id: 'MED-' + Date.now(),
                    etapa: 'Operación',
                    componenteAfectado: 'Suelo',
                    impactoRiesgo: 'Posible contaminación por fugas',
                    medidaMitigacion: 'Inspección de recipientes y uso de bandejas de retención',
                    frecuenciaMonitoreo: 'Mensual',
                    responsable: 'Supervisor Ambiental',
                  };
                  setFormData((prev) => ({ ...prev, medidasAmbientales: [...prev.medidasAmbientales, newM] }));
                }}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Medida</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.medidasAmbientales.map((m, idx) => (
                <div key={m.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Medida #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.medidasAmbientales.filter((_, i) => i !== idx);
                        setFormData((prev) => ({ ...prev, medidasAmbientales: updated }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Componente afectado</label>
                      <select
                        value={m.componenteAfectado}
                        onChange={(e) => {
                          const updated = [...formData.medidasAmbientales];
                          updated[idx].componenteAfectado = e.target.value as any;
                          setFormData((prev) => ({ ...prev, medidasAmbientales: updated }));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      >
                        <option value="Suelo">Suelo</option>
                        <option value="Agua superficial y subterránea">Agua superficial y subterránea</option>
                        <option value="Aire y emisiones">Aire y emisiones</option>
                        <option value="Salud de trabajadores">Salud de trabajadores</option>
                        <option value="Flora y Fauna">Flora y Fauna</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Impacto o riesgo</label>
                      <input
                        type="text"
                        value={m.impactoRiesgo}
                        onChange={(e) => {
                          const updated = [...formData.medidasAmbientales];
                          updated[idx].impactoRiesgo = e.target.value;
                          setFormData((prev) => ({ ...prev, medidasAmbientales: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Frecuencia de monitoreo</label>
                      <input
                        type="text"
                        value={m.frecuenciaMonitoreo}
                        onChange={(e) => {
                          const updated = [...formData.medidasAmbientales];
                          updated[idx].frecuenciaMonitoreo = e.target.value;
                          setFormData((prev) => ({ ...prev, medidasAmbientales: updated }));
                        }}
                        placeholder="Ej: Semanal / Mensual"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Medida de mitigación</label>
                    <textarea
                      rows={2}
                      value={m.medidaMitigacion}
                      onChange={(e) => {
                        const updated = [...formData.medidasAmbientales];
                        updated[idx].medidaMitigacion = e.target.value;
                        setFormData((prev) => ({ ...prev, medidasAmbientales: updated }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: PLAN DE EMERGENCIAS */}
        {currentStepIndex === 7 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Responsable de emergencias</label>
                <input
                  id="pmmrs-field-responsableEmergencia"
                  type="text"
                  required
                  value={formData.planEmergencias.responsableEmergencia}
                  onBlur={() => markFieldTouched('responsableEmergencia')}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      planEmergencias: { ...prev.planEmergencias, responsableEmergencia: e.target.value },
                    }));
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: Ing. Residente / Comité de Crisis"
                  className={getInputClass('responsableEmergencia', 7)}
                />
                {shouldShowFieldError('responsableEmergencia', 7) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono o radio de emergencias</label>
                <input
                  id="pmmrs-field-telefonoEmergencia"
                  type="text"
                  required
                  value={formData.planEmergencias.telefonoEmergencia}
                  onBlur={() => markFieldTouched('telefonoEmergencia')}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      planEmergencias: { ...prev.planEmergencias, telefonoEmergencia: e.target.value },
                    }));
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: +51 987 654 321"
                  className={getInputClass('telefonoEmergencia', 7)}
                />
                {shouldShowFieldError('telefonoEmergencia', 7) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Procedimiento operativo ante derrames de residuos peligrosos
              </label>
              <textarea
                id="pmmrs-field-procedimientoDerrame"
                rows={3}
                required
                value={formData.planEmergencias.procedimientoDerrame}
                onBlur={() => markFieldTouched('procedimientoDerrame')}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    planEmergencias: { ...prev.planEmergencias, procedimientoDerrame: e.target.value },
                  }));
                  if (stepValidationBanner) setStepValidationBanner(null);
                }}
                placeholder="Indique pasos de contención, retiro de suelo contaminado, confinamiento y notificación..."
                className={getInputClass('procedimientoDerrame', 7)}
              />
              {shouldShowFieldError('procedimientoDerrame', 7) && (
                <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Procedimiento ante incendios en almacén de residuos
              </label>
              <textarea
                rows={2}
                value={formData.planEmergencias.procedimientoIncendio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    planEmergencias: { ...prev.planEmergencias, procedimientoIncendio: e.target.value },
                  }))
                }
                placeholder="Activación de alarma, combate inicial con extintores PQS/CO2 y evacuación..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 9: INDICADORES */}
        {currentStepIndex === 8 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">9. Indicadores de Seguimiento y Control</h3>
                <p className="text-xs text-slate-500">Debe consignar fórmula matemática y metas objetivas.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newInd: PmmrsIndicator = {
                    id: 'IND-' + Date.now(),
                    nombreIndicador: 'Nuevo Indicador',
                    formulaCalculo: '(Variable A / Variable B) * 100',
                    meta: '≥ 80%',
                    frecuencia: 'Mensual',
                    responsable: 'Responsable Ambiental',
                    medioVerificacion: 'Registros de pesaje',
                  };
                  setFormData((prev) => ({ ...prev, indicadores: [...prev.indicadores, newInd] }));
                }}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Indicador</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.indicadores.map((ind, idx) => (
                <div key={ind.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Indicador #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.indicadores.filter((_, i) => i !== idx);
                        setFormData((prev) => ({ ...prev, indicadores: updated }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nombre del indicador</label>
                      <input
                        type="text"
                        value={ind.nombreIndicador}
                        onChange={(e) => {
                          const updated = [...formData.indicadores];
                          updated[idx].nombreIndicador = e.target.value;
                          setFormData((prev) => ({ ...prev, indicadores: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Fórmula de cálculo</label>
                      <input
                        type="text"
                        value={ind.formulaCalculo}
                        onChange={(e) => {
                          const updated = [...formData.indicadores];
                          updated[idx].formulaCalculo = e.target.value;
                          setFormData((prev) => ({ ...prev, indicadores: updated }));
                        }}
                        placeholder="Ej: Residuos valorizados / Residuos totales x 100%"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Meta</label>
                      <input
                        type="text"
                        value={ind.meta}
                        onChange={(e) => {
                          const updated = [...formData.indicadores];
                          updated[idx].meta = e.target.value;
                          setFormData((prev) => ({ ...prev, indicadores: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Frecuencia</label>
                      <select
                        value={ind.frecuencia}
                        onChange={(e) => {
                          const updated = [...formData.indicadores];
                          updated[idx].frecuencia = e.target.value as any;
                          setFormData((prev) => ({ ...prev, indicadores: updated }));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      >
                        <option value="Mensual">Mensual</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Medio de verificación</label>
                      <input
                        type="text"
                        value={ind.medioVerificacion}
                        onChange={(e) => {
                          const updated = [...formData.indicadores];
                          updated[idx].medioVerificacion = e.target.value;
                          setFormData((prev) => ({ ...prev, indicadores: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 10: CRONOGRAMA */}
        {currentStepIndex === 9 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">10. Cronograma de Implementación</h3>
                <p className="text-xs text-slate-500">
                  Incluye las fechas perentorias de reporte en la plataforma SIGERSOL del MINAM.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newCron: ScheduleItem = {
                    id: 'CRON-' + Date.now(),
                    actividad: 'Nueva actividad calendarizada',
                    etapa: 'Operación',
                    plazo: 'Semestral',
                    frecuencia: '2 veces al año',
                    responsable: 'Responsable PMMRS',
                  };
                  setFormData((prev) => ({ ...prev, cronograma: [...prev.cronograma, newCron] }));
                }}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Actividad</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.cronograma.map((cron, idx) => (
                <div key={cron.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Hito #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.cronograma.filter((_, i) => i !== idx);
                        setFormData((prev) => ({ ...prev, cronograma: updated }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Actividad</label>
                      <input
                        type="text"
                        value={cron.actividad}
                        onChange={(e) => {
                          const updated = [...formData.cronograma];
                          updated[idx].actividad = e.target.value;
                          setFormData((prev) => ({ ...prev, cronograma: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Plazo o período</label>
                      <input
                        type="text"
                        value={cron.plazo}
                        onChange={(e) => {
                          const updated = [...formData.cronograma];
                          updated[idx].plazo = e.target.value;
                          setFormData((prev) => ({ ...prev, cronograma: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Responsable</label>
                      <input
                        type="text"
                        value={cron.responsable}
                        onChange={(e) => {
                          const updated = [...formData.cronograma];
                          updated[idx].responsable = e.target.value;
                          setFormData((prev) => ({ ...prev, cronograma: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 11: PRESUPUESTO Y RECURSOS */}
        {currentStepIndex === 10 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
              <strong>Aclaración Normativa:</strong> En las bases del reto se repetía por error tipográfico el título «Cronograma de implementación» para los ítems 10 y 11. Conforme a la R.M. 089-2023-MINAM, el contenido 11 corresponde a <strong>«Presupuesto y recursos necesarios»</strong>.
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <div>
                <div className="font-bold text-emerald-900 text-sm">Presupuesto Estimado Anual</div>
                <div className="text-xs text-emerald-800">
                  Total Anual: <strong>S/ {validation.presupuestoTotalPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newPre: BudgetItem = {
                    id: 'PRE-' + Date.now(),
                    rubro: 'Nuevo Rubro Presupuestal',
                    descripcion: 'Detalle de insumos o servicios',
                    costoEstimadoPEN: 3000,
                    fuenteFinanciamiento: 'Recursos propios',
                    periodo: 'Anual 2026',
                  };
                  setFormData((prev) => ({ ...prev, presupuesto: [...prev.presupuesto, newPre] }));
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Partida</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.presupuesto.map((pre, idx) => (
                <div key={pre.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Partida #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.presupuesto.filter((_, i) => i !== idx);
                        setFormData((prev) => ({ ...prev, presupuesto: updated }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Rubro</label>
                      <input
                        type="text"
                        value={pre.rubro}
                        onChange={(e) => {
                          const updated = [...formData.presupuesto];
                          updated[idx].rubro = e.target.value;
                          setFormData((prev) => ({ ...prev, presupuesto: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Costo estimado</label>
                      <input
                        type="number"
                        value={pre.costoEstimadoPEN}
                        onChange={(e) => {
                          const updated = [...formData.presupuesto];
                          updated[idx].costoEstimadoPEN = parseFloat(e.target.value) || 0;
                          setFormData((prev) => ({ ...prev, presupuesto: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-bold text-emerald-800"
                      />
                      <span className="block text-[10px] text-slate-400 mt-0.5">En Soles (S/ PEN).</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Fuente o período</label>
                      <input
                        type="text"
                        value={pre.fuenteFinanciamiento}
                        onChange={(e) => {
                          const updated = [...formData.presupuesto];
                          updated[idx].fuenteFinanciamiento = e.target.value;
                          setFormData((prev) => ({ ...prev, presupuesto: updated }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Descripción de recursos asignados</label>
                    <input
                      type="text"
                      value={pre.descripcion}
                      onChange={(e) => {
                        const updated = [...formData.presupuesto];
                        updated[idx].descripcion = e.target.value;
                        setFormData((prev) => ({ ...prev, presupuesto: updated }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 12: FUNCIONES DEL RESPONSABLE */}
        {currentStepIndex === 11 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre completo del responsable</label>
                <input
                  id="pmmrs-field-funcionesNombres"
                  type="text"
                  required
                  value={formData.funcionesResponsable.nombres}
                  onBlur={() => markFieldTouched('funcionesNombres')}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      funcionesResponsable: { ...prev.funcionesResponsable, nombres: e.target.value },
                    }));
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: Ing. Lucía Paredes Saldaña"
                  className={getInputClass('funcionesNombres', 11)}
                />
                {shouldShowFieldError('funcionesNombres', 11) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registro de colegiatura CIP</label>
                <input
                  id="pmmrs-field-funcionesCip"
                  type="text"
                  required
                  value={formData.funcionesResponsable.cip}
                  onBlur={() => markFieldTouched('funcionesCip')}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      funcionesResponsable: { ...prev.funcionesResponsable, cip: e.target.value },
                    }));
                    if (stepValidationBanner) setStepValidationBanner(null);
                  }}
                  placeholder="Ej: CIP N° 189422"
                  className={getInputClass('funcionesCip', 11)}
                />
                {shouldShowFieldError('funcionesCip', 11) && (
                  <p className="text-[11px] text-red-600 mt-1">Este campo es obligatorio.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-0.5">
                Funciones legales específicas
              </label>
              <span className="block text-[11px] text-slate-400 mb-2">
                Conforme a los artículos 48, 55, 56 y 60 del D.S. N° 014-2017-MINAM.
              </span>
              <div className="space-y-2">
                {formData.funcionesResponsable.funciones.map((f, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-slate-400 font-bold mt-1 text-xs">{idx + 1}.</span>
                    <input
                      type="text"
                      value={f}
                      onChange={(e) => {
                        const updated = [...formData.funcionesResponsable.funciones];
                        updated[idx] = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          funcionesResponsable: { ...prev.funcionesResponsable, funciones: updated },
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 13: REVISIÓN Y EXPORTACIÓN - RESTAURACIÓN FIEL A IMAGEN OBJETIVO */}
        {currentStepIndex === 12 && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* 1. BADGE DE ESTADO GENERAL */}
            <div className="flex items-center">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>12 secciones completas · Listo para exportar</span>
              </div>
            </div>

            {/* 2. BLOQUE: REVISIÓN TÉCNICA CON IA — OPCIONAL */}
            <div className="bg-slate-50/50 rounded-xl border border-slate-200/90 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Revisión técnica con IA — opcional
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evalúa la coherencia formal y redacción técnica de los datos ya ingresados conforme al estándar R.M. 089-2023-MINAM.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReviewPlanWithAi}
                disabled={isReviewingAi}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs px-3.5 py-2 rounded-lg shadow-2xs flex items-center space-x-1.5 cursor-pointer shrink-0 self-start sm:self-auto disabled:opacity-50 transition-colors"
              >
                {isReviewingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                    <span>Revisando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Revisar redacción técnica</span>
                  </>
                )}
              </button>
            </div>

            {/* Diagnóstico de IA desplegable si fue ejecutado */}
            {aiReviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
                <span>{aiReviewError}</span>
                <button
                  type="button"
                  onClick={() => setAiReviewError(null)}
                  className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {aiReviewResult && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Diagnóstico Técnico de Redacción del PMMRS
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!aiReviewResult) return;
                        try {
                          await navigator.clipboard.writeText(aiReviewResult);
                          setAiReviewCopied(true);
                          setTimeout(() => setAiReviewCopied(false), 2000);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-1 px-2 py-1 rounded bg-white border border-slate-200 cursor-pointer"
                      title="Copiar texto del diagnóstico"
                    >
                      {aiReviewCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiReviewResult(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Cerrar diagnóstico"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line max-h-60 overflow-y-auto">
                  {aiReviewResult}
                </div>
              </div>
            )}

            {/* 3. BLOQUE PRINCIPAL DE EXPORTACIÓN */}
            <div className="p-5 sm:p-6 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 space-y-5">
              {/* Header del bloque */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#D1FAE5] text-[#00875A] flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                      Exportar Documento Técnico
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Descargue el PMMRS en formatos profesionales con plantilla membretada institucional para su gestión y trámite correspondiente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 self-start sm:self-auto shrink-0">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        12 secciones completas
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Información validada
                      </div>
                    </div>
                  </div>
                  <div className="h-7 w-px bg-slate-300" />
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        Formato técnico
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        R.M. 089-2023-MINAM
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DOS TARJETAS DE DESCARGA: WORD Y PDF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* TARJETA 1: WORD */}
                <div className="bg-white rounded-xl border border-blue-100 p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-12 h-13 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <div className="w-9 h-10 bg-[#1A73E8] rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
                        W
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Word editable
                      </h4>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        Ideal para ajustes posteriores.
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Descargue el documento en formato .docx con plantilla membretada para realizar modificaciones, añadir comentarios o trabajar de forma colaborativa.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportWord}
                    disabled={isExportingWord}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1A73E8] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingWord ? 'Generando .docx...' : 'Descargar .docx'}</span>
                  </button>
                </div>

                {/* TARJETA 2: PDF */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-12 h-13 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                      <div className="w-9 h-10 bg-[#E5252A] rounded-lg flex items-center justify-center text-white font-extrabold text-[11px] tracking-tight">
                        PDF
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        PDF final
                      </h4>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        Ideal para presentación y lectura.
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Descargue el documento en formato PDF con membrete institucional, texto seleccionable y tablas legibles conforme a la R.M. 089-2023-MINAM.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#00875A] hover:bg-[#00734D] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Nota discreta institucional */}
              <div className="flex items-center justify-center space-x-2 pt-1 text-center">
                <span className="text-[11px] text-emerald-800/80 font-medium">
                  Documento generado con plantilla institucional EcoSerpentis Consulting
                </span>
              </div>
            </div>

            {/* 4. RESUMEN DE DATOS DEL PLAN INGRESADO */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                Resumen de Datos del Plan Ingresado
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Card 1: Titular */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-1 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Titular</div>
                  <div className="font-bold text-slate-900 text-xs leading-snug">
                    {formData.generalInfo.razonSocial ? (
                      <>
                        <div>{formData.generalInfo.razonSocial.replace(/\s*\[.*\]$/, '')}</div>
                        {formData.generalInfo.razonSocial.includes('[') && (
                          <div className="text-[11px] text-slate-700 font-bold mt-0.5">
                            {formData.generalInfo.razonSocial.match(/\[.*\]/)?.[0]}
                          </div>
                        )}
                      </>
                    ) : (
                      'No indicado'
                    )}
                  </div>
                </div>

                {/* Card 2: RUC */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-1 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">RUC</div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    {formData.generalInfo.ruc || 'Sin registrar'}
                  </div>
                </div>

                {/* Card 3: Generación Total */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-1 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Generación Total</div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    {validation.totalResiduosMensualTn} tn/mes
                  </div>
                </div>

                {/* Card 4: Presupuesto Anual */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-1 border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Presupuesto Anual</div>
                  <div className="font-bold text-[#00875A] text-xs sm:text-sm">
                    S/ {validation.presupuestoTotalPEN.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Buttons */}
        <div className="border-t border-slate-200 pt-3.5 sm:pt-4 mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={() => validateCurrentStepAndNavigate(Math.max(0, currentStepIndex - 1))}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Paso Anterior</span>
          </button>

          <span className="text-xs font-medium text-slate-500 text-center">
            Paso {currentStepIndex + 1} de {STEPS.length}
          </span>

          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => validateCurrentStepAndNavigate(Math.min(STEPS.length - 1, currentStepIndex + 1))}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <span>Siguiente Paso</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-[105px] shrink-0 pointer-events-none" />
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA LIMPIAR PMMRS */}
      {confirmClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  ¿Limpiar todo el PMMRS?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Se eliminarán todos los datos ingresados en el formulario actual. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfirmClearModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearPmmrs}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Limpiar PMMRS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
