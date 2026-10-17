import React, { useState } from 'react';
import { BookOpen, Search, CheckCircle, AlertCircle, Edit, Save, Plus, Scale, Info, ExternalLink, BookCheck } from 'lucide-react';
import { OFFICIAL_NORMATIVE_MATRIX, NormativeRequirement } from '../data/normativeMatrix';
import { NormativeLibraryModal } from './NormativeLibraryModal';

export const NormativeMatrixView: React.FC = () => {
  const [matrix, setMatrix] = useState<NormativeRequirement[]>(() => {
    const saved = localStorage.getItem('pmrs_custom_matrix');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return OFFICIAL_NORMATIVE_MATRIX;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const saveToLocal = (newMatrix: NormativeRequirement[]) => {
    setMatrix(newMatrix);
    localStorage.setItem('pmrs_custom_matrix', JSON.stringify(newMatrix));
  };

  const handleUpdate = (id: string, field: keyof NormativeRequirement, val: any) => {
    const updated = matrix.map((item) => (item.id === id ? { ...item, [field]: val } : item));
    saveToLocal(updated);
  };

  const filteredMatrix = matrix.filter((item) => {
    const matchQuery =
      item.requisito.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seccionTitulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.articuloReferencia.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedFilter === 'critical') return matchQuery && item.esCritico;
    if (selectedFilter === 'sectorial') return matchQuery && item.estadoVerificacionNormativa.includes('sectorial');
    return matchQuery;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 rounded">
              Base Verificable
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Matriz Normativa de Requisitos del PMMRS
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Requisitos oficiales de la R.M. N° 089-2023-MINAM, D.L. N° 1278, D.S. N° 014-2017-MINAM y NTP 900.058:2019.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            title="Abrir biblioteca y consultar o descargar normas oficiales"
          >
            <BookCheck className="w-4 h-4" />
            <span>Documentos normativos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Restablecer la matriz a los valores oficiales por defecto?')) {
                saveToLocal(OFFICIAL_NORMATIVE_MATRIX);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Restablecer a Oficiales
          </button>
        </div>
      </div>

      {/* Guide notice explaining sector verification and user-supplied info */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-sm text-emerald-900">
          <Info className="w-4 h-4 text-emerald-700" />
          <span>Información Requerida para Complementar la Matriz Sectorial</span>
        </div>
        <p>
          Las referencias normativas generales están <strong>verificadas oficialmente</strong> en los textos promulgados del D.L. 1278, D.S. 014-2017-MINAM, R.M. 089-2023-MINAM y la NTP 900.058:2019. Sin embargo, para actividades sectoriales específicas (Agrario/MIDAGRI, Industria/PRODUCE, Minería y Energía/MINEM, Construcción/VIVIENDA), el usuario puede suministrar:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-emerald-900/90">
          <li><strong>Reglamento sectorial específico de residuos:</strong> Ej. R.M. D000164-2026-MIDAGRI (Agrario) o D.S. 002-2022-VIVIENDA (Construcción).</li>
          <li><strong>Tasa o límites de residuos similares a municipales:</strong> Acuerdos con la municipalidad provincial o distrital respectiva (Art. 34 y 47).</li>
          <li><strong>Resolución de aprobación del IGA principal:</strong> Si el PMMRS se aprueba como parte de una DIA, EIA-sd, PAMA o modificación de instrumento.</li>
        </ul>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por sección, artículo o requisito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({matrix.length})
          </button>
          <button
            onClick={() => setSelectedFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedFilter === 'critical'
                ? 'bg-red-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Críticos ({matrix.filter((m) => m.esCritico).length})
          </button>
        </div>
      </div>

      {/* Matrix List */}
      <div className="space-y-4">
        {filteredMatrix.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <div
              key={item.id}
              className={`p-5 bg-white rounded-xl border transition-all text-xs space-y-3 ${
                item.esCritico ? 'border-l-4 border-l-red-500 border-slate-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {item.id} • {item.seccionTitulo}
                  </span>
                  {item.esCritico && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-700 rounded">
                      Criterio Crítico
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    {item.estadoVerificacionNormativa}
                  </span>
                  <button
                    onClick={() => setEditingId(isEditing ? null : item.id)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Editar referencia o criterio"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Base Legal y Artículo de Referencia:
                    </label>
                    <input
                      type="text"
                      value={item.articuloReferencia}
                      onChange={(e) => handleUpdate(item.id, 'articuloReferencia', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Texto Resumido Oficial:
                    </label>
                    <textarea
                      rows={2}
                      value={item.textoResumidoOficial}
                      onChange={(e) => handleUpdate(item.id, 'textoResumidoOficial', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Criterio de Verificación:
                    </label>
                    <textarea
                      rows={2}
                      value={item.criterioVerificacion}
                      onChange={(e) => handleUpdate(item.id, 'criterioVerificacion', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                    />
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-semibold"
                    >
                      Guardar en Matriz
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <span className="font-bold text-slate-800 block mb-0.5">Requisito Oficial:</span>
                      <p className="text-slate-700">{item.requisito}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-0.5">Base Legal Precisa:</span>
                      <p className="text-emerald-800 font-semibold">{item.articuloReferencia}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{item.normaPrincipal}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-0.5">Criterio de Verificación:</span>
                      <p className="text-slate-600">{item.criterioVerificacion}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-0.5">Deficiencia Común Observada:</span>
                      <p className="text-slate-600">{item.deficienciasComunes}</p>
                    </div>
                  </div>

                  {item.alertaEspecial && (
                    <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-900 font-medium text-[11px]">
                      {item.alertaEspecial}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Biblioteca Normativa */}
      <NormativeLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />
    </div>
  );
};
