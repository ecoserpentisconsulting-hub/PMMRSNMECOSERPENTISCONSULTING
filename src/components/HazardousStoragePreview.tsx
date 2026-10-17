import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Wind,
  Flame,
  HelpCircle,
} from 'lucide-react';

export interface HazardousStoragePreviewProps {
  hasImpermeableFloor: boolean;
  hasContainmentCurb: boolean;
  hasRoofAndVentilation: boolean;
  hasSpillKitAndExtinguisher: boolean;
  maxStorageMonths: number;
}

export const HazardousStoragePreview: React.FC<HazardousStoragePreviewProps> = ({
  hasImpermeableFloor,
  hasContainmentCurb,
  hasRoofAndVentilation,
  hasSpillKitAndExtinguisher,
  maxStorageMonths,
}) => {
  // Count verified criteria (0 to 4)
  const criteria = [
    {
      id: 'floor',
      name: 'Losa impermeable',
      detail: 'Resina epóxica sellante',
      active: hasImpermeableFloor,
      icon: Layers,
    },
    {
      id: 'curb',
      name: 'Sardinel perimetral',
      detail: 'Capacidad ≥ 110% mayor',
      active: hasContainmentCurb,
      icon: ShieldAlert,
    },
    {
      id: 'roof',
      name: 'Techo y ventilación',
      detail: 'Cubierta y flujo cruzado',
      active: hasRoofAndVentilation,
      icon: Wind,
    },
    {
      id: 'safety',
      name: 'Seguridad y respuesta',
      detail: 'Kit antiderrame + Extintor',
      active: hasSpillKitAndExtinguisher,
      icon: Flame,
    },
  ];

  const fulfilledCount = criteria.filter((c) => c.active).length;
  const isTimeValid = maxStorageMonths <= 12 && maxStorageMonths > 0;

  // Determine overall status
  let statusText = 'Incompleto';
  let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
  let statusDotClass = 'bg-slate-400';

  if (fulfilledCount === 4) {
    statusText = 'Configurado técnicamente';
    statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    statusDotClass = 'bg-emerald-500';
  } else if (fulfilledCount >= 2) {
    statusText = 'Parcialmente configurado';
    statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
    statusDotClass = 'bg-amber-500';
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header técnico del diagrama */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Vista Técnica del Almacén
          </h4>
        </div>
        <span
          className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
          <span>{statusText}</span>
        </span>
      </div>

      {/* Barra de progreso de criterios cumplidos */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-semibold text-slate-600">
            Criterios técnicos cumplidos:
          </span>
          <span className="font-bold text-slate-900">
            {fulfilledCount} de 4 ({Math.round((fulfilledCount / 4) * 100)}%)
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((stepIdx) => {
            const isFilled = stepIdx < fulfilledCount;
            return (
              <div
                key={stepIdx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isFilled
                    ? fulfilledCount === 4
                      ? 'bg-emerald-600'
                      : fulfilledCount >= 2
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                    : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Contenedor del Diagrama Técnico SVG */}
      <div className="relative p-3 bg-gradient-to-b from-slate-50/50 to-slate-100/40 flex-1 flex flex-col justify-center items-center select-none overflow-hidden min-h-[220px]">
        {/* Badge flotante de tiempo de almacenamiento */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-medium border shadow-xs transition-colors ${
              isTimeValid
                ? 'bg-white/95 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800 font-bold animate-pulse'
            }`}
            title={
              isTimeValid
                ? 'Tiempo reglamentario conforme al Art. 55 del D.S. 014-2017-MINAM'
                : 'Supera el límite legal de 12 meses establecido en el Art. 55'
            }
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span>
              Tiempo máx: <strong>{maxStorageMonths} meses</strong>
            </span>
            {!isTimeValid && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />}
          </div>
        </div>

        {/* SVG ISOMÉTRICO / AXONOMÉTRICO TÉCNICO */}
        <svg
          viewBox="0 0 460 270"
          className="w-full max-w-[420px] h-auto drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Patrón de losa con resina epóxica impermeable */}
            <pattern id="epoxyGrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#059669" strokeWidth="0.5" strokeOpacity="0.25" />
            </pattern>
            {/* Patrón de concreto crudo inactivo */}
            <pattern id="rawConcrete" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0 10 L 10 0" fill="none" stroke="#94A3B8" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="2 2" />
            </pattern>
            {/* Gradientes sutiles */}
            <linearGradient id="activeRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="epoxySlabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D1FAE5" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="curbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
          </defs>

          {/* Sombra base del almacén */}
          <ellipse cx="230" cy="225" rx="170" ry="32" fill="#0F172A" fillOpacity="0.06" />

          {/* ================================================================= */}
          {/* ELEMENTO 1: LOSA DE CONCRETO IMPERMEABLE (PISO / BASE)           */}
          {/* ================================================================= */}
          <g id="losa-impermeable" className="transition-all duration-300">
            {/* Cara inferior / grosor de la losa */}
            <path
              d="M 60 170 L 230 235 L 400 170 L 400 182 L 230 247 L 60 182 Z"
              fill={hasImpermeableFloor ? '#065F46' : '#64748B'}
              fillOpacity={hasImpermeableFloor ? '0.75' : '0.3'}
            />

            {/* Superficie superior de la losa (plataforma isométrica) */}
            <polygon
              points="60,170 230,105 400,170 230,235"
              fill={hasImpermeableFloor ? 'url(#epoxySlabGrad)' : '#F1F5F9'}
              stroke={hasImpermeableFloor ? '#059669' : '#94A3B8'}
              strokeWidth={hasImpermeableFloor ? '2' : '1.2'}
              strokeDasharray={hasImpermeableFloor ? 'none' : '4 3'}
              strokeOpacity={hasImpermeableFloor ? '1' : '0.6'}
            />

            {/* Malla epóxica o textura si está activa */}
            {hasImpermeableFloor ? (
              <polygon
                points="60,170 230,105 400,170 230,235"
                fill="url(#epoxyGrid)"
                fillOpacity="0.7"
              />
            ) : (
              <polygon
                points="60,170 230,105 400,170 230,235"
                fill="url(#rawConcrete)"
                fillOpacity="0.5"
              />
            )}

            {/* Etiqueta / indicador sutil sobre la losa */}
            <text
              x="230"
              y="224"
              textAnchor="middle"
              className="text-[9px] font-mono tracking-wider font-semibold"
              fill={hasImpermeableFloor ? '#065F46' : '#94A3B8'}
            >
              {hasImpermeableFloor
                ? 'LOSA IMPERMEABLE CON RESINA EPÓXICA [ACTIVA]'
                : '[LOSA NO VERIFICADA / POR IMPLEMENTAR]'}
            </text>
          </g>

          {/* ================================================================= */}
          {/* ELEMENTO 2: SARDINEL DE CONTENCIÓN PERIMETRAL (≥ 110% VOLUMEN)   */}
          {/* ================================================================= */}
          <g id="sardinel-contencion" className="transition-all duration-300">
            {/* Zócalo exterior perimetral elevado */}
            <path
              d="M 52 167 L 230 98 L 408 167 L 408 178 L 230 247 L 52 178 Z"
              fill="none"
              stroke={hasContainmentCurb ? 'url(#curbGrad)' : '#CBD5E1'}
              strokeWidth={hasContainmentCurb ? '5' : '2'}
              strokeLinejoin="round"
              strokeDasharray={hasContainmentCurb ? 'none' : '5 4'}
              strokeOpacity={hasContainmentCurb ? '0.95' : '0.4'}
            />
            {/* Relieve interior de contención estanca */}
            {hasContainmentCurb && (
              <>
                {/* Sardinel frontal izquierdo */}
                <path
                  d="M 52 167 L 230 236 L 230 245 L 52 176 Z"
                  fill="#047857"
                  fillOpacity="0.85"
                />
                {/* Sardinel frontal derecho */}
                <path
                  d="M 230 236 L 408 167 L 408 176 L 230 245 Z"
                  fill="#065F46"
                  fillOpacity="0.9"
                />
                {/* Franja reflectiva / señalética de contención */}
                <path
                  d="M 68 175 L 222 235"
                  stroke="#FBBF24"
                  strokeWidth="1.5"
                  strokeDasharray="8 6"
                  strokeOpacity="0.9"
                />
                <path
                  d="M 238 235 L 392 175"
                  stroke="#FBBF24"
                  strokeWidth="1.5"
                  strokeDasharray="8 6"
                  strokeOpacity="0.9"
                />
              </>
            )}
          </g>

          {/* ================================================================= */}
          {/* CONTENIDO INTERNO: PARIHUELA Y CILINDROS DE RESIDUOS PELIGROSOS   */}
          {/* ================================================================= */}
          <g id="residuos-peligrosos-estiba">
            {/* Parihuela / Pallet de contención interior */}
            <polygon
              points="170,170 230,147 290,170 230,193"
              fill="#D97706"
              fillOpacity="0.4"
              stroke="#B45309"
              strokeWidth="1"
            />
            <path
              d="M 170 170 L 170 176 L 230 199 L 290 176 L 290 170"
              stroke="#92400E"
              strokeWidth="1"
              fill="#92400E"
              fillOpacity="0.3"
            />

            {/* Cilindro Rojo 1 (Residuos Peligrosos NTP 900.058:2019) */}
            <g transform="translate(192, 132)">
              {/* Cuerpo del tambor */}
              <rect x="0" y="8" width="22" height="30" rx="3" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
              {/* Tapa */}
              <ellipse cx="11" cy="8" rx="11" ry="4" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
              {/* Zunchos metálicos */}
              <line x1="0" y1="18" x2="22" y2="18" stroke="#7F1D1D" strokeWidth="1" />
              <line x1="0" y1="28" x2="22" y2="28" stroke="#7F1D1D" strokeWidth="1" />
              {/* Rombo / Etiqueta de residuo peligroso */}
              <polygon points="11,20 16,24 11,28 6,24" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.5" />
            </g>

            {/* Cilindro Rojo 2 */}
            <g transform="translate(220, 142)">
              <rect x="0" y="8" width="22" height="30" rx="3" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1" />
              <ellipse cx="11" cy="8" rx="11" ry="4" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1" />
              <line x1="0" y1="18" x2="22" y2="18" stroke="#581C1C" strokeWidth="1" />
              <line x1="0" y1="28" x2="22" y2="28" stroke="#581C1C" strokeWidth="1" />
              <polygon points="11,20 16,24 11,28 6,24" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.5" />
            </g>

            {/* Cilindro Amarillo 3 (Hidrocarburos/Específico) */}
            <g transform="translate(245, 130)">
              <rect x="0" y="8" width="20" height="28" rx="3" fill="#D97706" stroke="#92400E" strokeWidth="1" />
              <ellipse cx="10" cy="8" rx="10" ry="3.8" fill="#F59E0B" stroke="#92400E" strokeWidth="1" />
              <line x1="0" y1="17" x2="20" y2="17" stroke="#78350F" strokeWidth="1" />
              <line x1="0" y1="26" x2="20" y2="26" stroke="#78350F" strokeWidth="1" />
              <polygon points="10,19 15,23 10,27 5,23" fill="#DC2626" stroke="#7F1D1D" strokeWidth="0.5" />
            </g>
          </g>

          {/* ================================================================= */}
          {/* ELEMENTO 3: COLUMNAS ESTRUCTURALES Y TECHO CON VENTILACIÓN         */}
          {/* ================================================================= */}
          <g id="estructura-techo-ventilacion" className="transition-all duration-300">
            {/* 4 Columnas estructurales */}
            {/* Columna Izquierda Posterior */}
            <line
              x1="230"
              y1="105"
              x2="230"
              y2="45"
              stroke={hasRoofAndVentilation ? '#334155' : '#94A3B8'}
              strokeWidth={hasRoofAndVentilation ? '3.5' : '1.5'}
              strokeDasharray={hasRoofAndVentilation ? 'none' : '4 3'}
              strokeOpacity={hasRoofAndVentilation ? '0.9' : '0.35'}
            />
            {/* Columna Lateral Izquierda */}
            <line
              x1="60"
              y1="170"
              x2="60"
              y2="95"
              stroke={hasRoofAndVentilation ? '#334155' : '#94A3B8'}
              strokeWidth={hasRoofAndVentilation ? '3.5' : '1.5'}
              strokeDasharray={hasRoofAndVentilation ? 'none' : '4 3'}
              strokeOpacity={hasRoofAndVentilation ? '0.9' : '0.35'}
            />
            {/* Columna Lateral Derecha */}
            <line
              x1="400"
              y1="170"
              x2="400"
              y2="95"
              stroke={hasRoofAndVentilation ? '#334155' : '#94A3B8'}
              strokeWidth={hasRoofAndVentilation ? '3.5' : '1.5'}
              strokeDasharray={hasRoofAndVentilation ? 'none' : '4 3'}
              strokeOpacity={hasRoofAndVentilation ? '0.9' : '0.35'}
            />
            {/* Columna Frontal Central (acceso) */}
            <line
              x1="230"
              y1="235"
              x2="230"
              y2="155"
              stroke={hasRoofAndVentilation ? '#334155' : '#94A3B8'}
              strokeWidth={hasRoofAndVentilation ? '3.5' : '1.5'}
              strokeDasharray={hasRoofAndVentilation ? 'none' : '4 3'}
              strokeOpacity={hasRoofAndVentilation ? '0.9' : '0.35'}
            />

            {/* REJILLAS DE VENTILACIÓN CRUZADA (LOUVERS LATERALES) */}
            <g
              id="ventilacion-cruzada"
              opacity={hasRoofAndVentilation ? '1' : '0.25'}
              className="transition-opacity duration-300"
            >
              {/* Pared lateral izquierda con rejillas tipo louver */}
              <polygon
                points="60,170 230,105 230,45 60,95"
                fill={hasRoofAndVentilation ? '#0F172A' : '#F1F5F9'}
                fillOpacity={hasRoofAndVentilation ? '0.08' : '0.1'}
              />
              {/* Ranuras de ventilación lateral izquierda */}
              {[110, 120, 130, 140, 150].map((yPos, i) => (
                <line
                  key={`vent-l-${i}`}
                  x1={80 + i * 18}
                  y1={yPos - 12}
                  x2={110 + i * 18}
                  y2={yPos}
                  stroke={hasRoofAndVentilation ? '#0284C7' : '#94A3B8'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}

              {/* Flechas de flujo de aire cruzado permanente */}
              {hasRoofAndVentilation && (
                <g className="text-sky-600">
                  <path
                    d="M 30 140 Q 60 130 90 135"
                    stroke="#0284C7"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                  />
                  <path d="M 88 132 L 95 136 L 88 140 Z" fill="#0284C7" />

                  <path
                    d="M 370 120 Q 400 125 430 115"
                    stroke="#0284C7"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                  />
                  <path d="M 428 112 L 435 116 L 428 120 Z" fill="#0284C7" />
                </g>
              )}
            </g>

            {/* TECHO INDUSTRIAL A DOS AGUAS / CUBIERTA ESTRUCTURAL */}
            <g
              id="cubierta-techo"
              opacity={hasRoofAndVentilation ? '1' : '0.3'}
              className="transition-all duration-300"
            >
              {/* Vertiente izquierda del techo */}
              <polygon
                points="45,90 230,18 230,80 45,115"
                fill={hasRoofAndVentilation ? 'url(#activeRoofGrad)' : '#E2E8F0'}
                stroke={hasRoofAndVentilation ? '#334155' : '#94A3B8'}
                strokeWidth={hasRoofAndVentilation ? '2' : '1.2'}
                strokeDasharray={hasRoofAndVentilation ? 'none' : '4 3'}
              />
              {/* Vertiente derecha del techo */}
              <polygon
                points="230,18 415,90 415,115 230,80"
                fill={hasRoofAndVentilation ? '#0F172A' : '#CBD5E1'}
                stroke={hasRoofAndVentilation ? '#1E293B' : '#94A3B8'}
                strokeWidth={hasRoofAndVentilation ? '2' : '1.2'}
                strokeDasharray={hasRoofAndVentilation ? 'none' : '4 3'}
              />
              {/* Cumbrera / Viga central */}
              <line
                x1="230"
                y1="18"
                x2="230"
                y2="80"
                stroke={hasRoofAndVentilation ? '#38BDF8' : '#64748B'}
                strokeWidth={hasRoofAndVentilation ? '2.5' : '1'}
              />
              {/* Aleros y pestañas de ventilación de cumbrera */}
              <path
                d="M 45 90 L 230 18 L 415 90"
                stroke={hasRoofAndVentilation ? '#64748B' : '#94A3B8'}
                strokeWidth="1.5"
              />
            </g>
          </g>

          {/* ================================================================= */}
          {/* ELEMENTO 4: KIT ANTIDERRAME Y EXTINTOR (SEGURIDAD Y RESPUESTA)    */}
          {/* ================================================================= */}
          <g
            id="estacion-emergencia"
            transform="translate(370, 160)"
            className="transition-all duration-300"
            opacity={hasSpillKitAndExtinguisher ? '1' : '0.35'}
          >
            {/* Soporte / base de seguridad */}
            <rect
              x="-6"
              y="-32"
              width="44"
              height="58"
              rx="4"
              fill={hasSpillKitAndExtinguisher ? '#FEF2F2' : '#F8FAFC'}
              stroke={hasSpillKitAndExtinguisher ? '#EF4444' : '#CBD5E1'}
              strokeWidth="1"
              strokeDasharray={hasSpillKitAndExtinguisher ? 'none' : '3 2'}
            />

            {/* EXTINTOR PQS (Cilindro rojo) */}
            <g transform="translate(0, -26)">
              {/* Manija y boquilla */}
              <rect x="5" y="0" width="4" height="4" fill="#1E293B" />
              <line x1="2" y1="2" x2="12" y2="2" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
              {/* Cuerpo del extintor */}
              <rect
                x="3"
                y="4"
                width="8"
                height="20"
                rx="3"
                fill={hasSpillKitAndExtinguisher ? '#DC2626' : '#94A3B8'}
                stroke={hasSpillKitAndExtinguisher ? '#991B1B' : '#64748B'}
                strokeWidth="0.8"
              />
              {/* Cinto y manómetro */}
              <line x1="3" y1="12" x2="11" y2="12" stroke="#FEF08A" strokeWidth="1" />
              <circle cx="7" cy="3" r="1.5" fill="#FEF08A" />
            </g>

            {/* KIT ANTIDERRAME (Tambor / contenedor amarillo de respuesta) */}
            <g transform="translate(18, -20)">
              {/* Tapa */}
              <ellipse
                cx="8"
                cy="4"
                rx="7"
                ry="3"
                fill={hasSpillKitAndExtinguisher ? '#F59E0B' : '#94A3B8'}
                stroke={hasSpillKitAndExtinguisher ? '#B45309' : '#64748B'}
                strokeWidth="0.8"
              />
              {/* Cuerpo */}
              <rect
                x="1"
                y="4"
                width="14"
                height="22"
                rx="2"
                fill={hasSpillKitAndExtinguisher ? '#FBBF24' : '#CBD5E1'}
                stroke={hasSpillKitAndExtinguisher ? '#D97706' : '#94A3B8'}
                strokeWidth="0.8"
              />
              {/* Rótulo "KIT" */}
              <rect
                x="3"
                y="11"
                width="10"
                height="6"
                fill={hasSpillKitAndExtinguisher ? '#0F172A' : '#64748B'}
                rx="1"
              />
              <text
                x="8"
                y="15.5"
                textAnchor="middle"
                fontSize="4"
                fontWeight="bold"
                fill="#FFFFFF"
                letterSpacing="0.5"
              >
                KIT
              </text>
            </g>

            {/* Señalética superior de emergencia */}
            <circle
              cx="16"
              cy="-28"
              r="3.5"
              fill={hasSpillKitAndExtinguisher ? '#16A34A' : '#94A3B8'}
            />
            <path
              d="M 14.5 -28 L 15.8 -26.8 L 17.8 -29.2"
              stroke="#FFFFFF"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ================================================================= */}
          {/* CALLOUTS TÉCNICOS / ANOTACIONES DE INGENIERÍA                     */}
          {/* ================================================================= */}
          {/* Anotación 1: Techo y Ventilación */}
          <g className="text-[9px] font-sans">
            <line
              x1="120"
              y1="50"
              x2="90"
              y2="28"
              stroke={hasRoofAndVentilation ? '#0284C7' : '#94A3B8'}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="90" cy="28" r="2.5" fill={hasRoofAndVentilation ? '#0284C7' : '#94A3B8'} />
            <rect
              x="5"
              y="18"
              width="82"
              height="18"
              rx="4"
              fill="#FFFFFF"
              stroke={hasRoofAndVentilation ? '#BAE6FD' : '#E2E8F0'}
              strokeWidth="1"
              className="drop-shadow-2xs"
            />
            <text
              x="46"
              y="30"
              textAnchor="middle"
              className="text-[8.5px] font-semibold"
              fill={hasRoofAndVentilation ? '#0369A1' : '#64748B'}
            >
              Techo + Vent. Cruzada
            </text>
          </g>

          {/* Anotación 2: Sardinel Perimetral */}
          <g className="text-[9px] font-sans">
            <line
              x1="90"
              y1="190"
              x2="50"
              y2="215"
              stroke={hasContainmentCurb ? '#059669' : '#94A3B8'}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="50" cy="215" r="2.5" fill={hasContainmentCurb ? '#059669' : '#94A3B8'} />
            <rect
              x="10"
              y="218"
              width="88"
              height="18"
              rx="4"
              fill="#FFFFFF"
              stroke={hasContainmentCurb ? '#A7F3D0' : '#E2E8F0'}
              strokeWidth="1"
              className="drop-shadow-2xs"
            />
            <text
              x="54"
              y="230"
              textAnchor="middle"
              className="text-[8.5px] font-semibold"
              fill={hasContainmentCurb ? '#047857' : '#64748B'}
            >
              Sardinel (≥110% Vol.)
            </text>
          </g>

          {/* Anotación 3: Kit Antiderrame + Extintor */}
          <g className="text-[9px] font-sans">
            <line
              x1="395"
              y1="155"
              x2="425"
              y2="135"
              stroke={hasSpillKitAndExtinguisher ? '#DC2626' : '#94A3B8'}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx="425" cy="135" r="2.5" fill={hasSpillKitAndExtinguisher ? '#DC2626' : '#94A3B8'} />
            <rect
              x="365"
              y="112"
              width="90"
              height="18"
              rx="4"
              fill="#FFFFFF"
              stroke={hasSpillKitAndExtinguisher ? '#FECACA' : '#E2E8F0'}
              strokeWidth="1"
              className="drop-shadow-2xs"
            />
            <text
              x="410"
              y="124"
              textAnchor="middle"
              className="text-[8.5px] font-semibold"
              fill={hasSpillKitAndExtinguisher ? '#B91C1C' : '#64748B'}
            >
              Kit Antiderrame + PQS
            </text>
          </g>
        </svg>
      </div>

      {/* Leyenda interactiva de componentes del almacén */}
      <div className="p-3 bg-white border-t border-slate-200/80 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {criteria.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-start space-x-2 p-1.5 rounded-lg border transition-all ${
                  item.active
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-500 opacity-75'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {item.active ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={`block font-semibold leading-tight truncate ${
                      item.active ? 'text-emerald-950' : 'text-slate-600'
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="block text-[10px] text-slate-500 leading-tight truncate">
                    {item.detail}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nota legal / didáctica */}
        <p className="text-[10px] text-slate-400 leading-tight pt-1 border-t border-slate-100 flex items-start space-x-1">
          <HelpCircle className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Vista técnica referencial del almacén según los criterios marcados por el usuario. Esta representación tiene fines de apoyo visual y no reemplaza la verificación normativa especializada.
          </span>
        </p>
      </div>
    </div>
  );
};
