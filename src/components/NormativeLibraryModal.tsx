import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ExternalLink,
  FileText,
  Info,
  Search,
  Download,
} from 'lucide-react';

interface OfficialNormativeDoc {
  id: string;
  codigo: string;
  titulo?: string;
  entidad: string;
  descripcion: string;
  urlOficial?: string;
  textoBoton?: string;
  esNTP?: boolean;
  urlMaterialInacal?: string;
  urlFichaInacal?: string;
}

const OFFICIAL_DOCUMENTS: OfficialNormativeDoc[] = [
  {
    id: 'rm-089-2023-minam',
    codigo: 'R.M. N.º 089-2023-MINAM',
    entidad: 'Ministerio del Ambiente (MINAM)',
    descripcion: 'Aprueba el Contenido Mínimo del Plan de Minimización y Manejo de Residuos Sólidos No Municipales.',
    urlOficial: 'https://www.gob.pe/institucion/minam/normas-legales/3980927-089-2023-minam',
    textoBoton: 'Descargar de fuente oficial',
  },
  {
    id: 'dl-1278',
    codigo: 'Decreto Legislativo N.º 1278',
    entidad: 'Ministerio del Ambiente (MINAM) / Presidencia de la República',
    descripcion: 'Decreto Legislativo que aprueba la Ley de Gestión Integral de Residuos Sólidos.',
    urlOficial: 'https://www.gob.pe/es/institucion/minam/normas-legales/3610-1278',
    textoBoton: 'Descargar de fuente oficial',
  },
  {
    id: 'ds-014-2017-minam',
    codigo: 'Decreto Supremo N.º 014-2017-MINAM',
    entidad: 'Ministerio del Ambiente (MINAM)',
    descripcion: 'Reglamento del Decreto Legislativo N.º 1278.',
    urlOficial: 'https://www.gob.pe/institucion/minam/normas-legales/3695-014-2017-minam',
    textoBoton: 'Descargar de fuente oficial',
  },
  {
    id: 'ntp-900-058-2019',
    codigo: 'NTP 900.058:2019',
    entidad: 'Instituto Nacional de Calidad (INACAL)',
    descripcion: 'Gestión de residuos. Código de colores para el almacenamiento de residuos sólidos.',
    urlMaterialInacal: 'https://www.inacal.gob.pe/repositorioaps/data/1/1/1/jer/catalogoespecializado/files/GESTION%20DE%20RESIDUOS.pdf',
    urlFichaInacal: 'https://servicios.inacal.gob.pe/cidalerta/biblioteca-detalle.aspx?id=28586',
    esNTP: true,
  },
];

const SECTORIAL_DOCUMENTS = [
  {
    sector: 'Agrario y Riego',
    entidad: 'MIDAGRI',
    codigo: 'D.S. N.º 005-2020-MINAGRI y R.M. D000164-2026-MIDAGRI',
    descripcion: 'Reglamento de Gestión Ambiental del Sector Agrario y de Riego (manejo de biomasa y envases con triple lavado).',
    urlOficial: 'https://www.gob.pe/institucion/midagri/normas-legales',
  },
  {
    sector: 'Industria Manufacturera',
    entidad: 'PRODUCE',
    codigo: 'D.S. N.º 017-2015-PRODUCE',
    descripcion: 'Reglamento de Gestión Ambiental para la Industria Manufacturera y Comercio Interno.',
    urlOficial: 'https://www.gob.pe/institucion/produce/normas-legales',
  },
  {
    sector: 'Construcción y Saneamiento',
    entidad: 'VIVIENDA',
    codigo: 'D.S. N.º 002-2022-VIVIENDA',
    descripcion: 'Reglamento de Gestión y Manejo de Residuos Sólidos de la Construcción y Demolición.',
    urlOficial: 'https://www.gob.pe/institucion/vivienda/normas-legales',
  },
  {
    sector: 'Minería y Energía',
    entidad: 'MINEM',
    codigo: 'D.S. N.º 040-2014-EM',
    descripcion: 'Reglamento de Protección y Gestión Ambiental para Actividades Mineras.',
    urlOficial: 'https://www.gob.pe/institucion/minem/normas-legales',
  },
];

interface NormativeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NormativeLibraryModal: React.FC<NormativeLibraryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'principales' | 'sectoriales'>('principales');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredPrincipales = OFFICIAL_DOCUMENTS.filter(
    (doc) =>
      doc.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.titulo && doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredSectoriales = SECTORIAL_DOCUMENTS.filter(
    (doc) =>
      doc.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Encabezado */}
        <div className="px-5 py-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700/80 text-emerald-200 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Biblioteca normativa del PMMRS
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Consulta las principales normas utilizadas como referencia técnica y normativa en esta plataforma.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar biblioteca"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de pestañas y búsqueda */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('principales')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'principales'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Normas Principales ({OFFICIAL_DOCUMENTS.length})
            </button>
            <button
              onClick={() => setActiveTab('sectoriales')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sectoriales'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Normativa Sectorial ({SECTORIAL_DOCUMENTS.length})
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar norma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: NORMAS PRINCIPALES */}
          {activeTab === 'principales' && (
            <div className="space-y-3.5">
              {filteredPrincipales.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                >
                  <div className="border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        {doc.codigo}
                      </h3>
                      {doc.esNTP && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          INACAL
                        </span>
                      )}
                    </div>
                    {doc.titulo && (
                      <p className="text-xs font-medium text-slate-800 pt-0.5">
                        {doc.titulo}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {doc.descripcion}
                  </p>

                  {doc.esNTP ? (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {/* Nota aclaratoria de derechos y enlace textual discreto a la ficha */}
                      <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-relaxed space-y-1.5">
                        <div className="flex items-start space-x-2">
                          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>
                            <strong>Nota:</strong> Las Normas Técnicas Peruanas (NTP) se encuentran protegidas por derechos de autor y su versión íntegra se adquiere a través de INACAL. El enlace provisto corresponde a material técnico oficial publicado por INACAL sobre gestión de residuos y código de colores.
                          </span>
                        </div>
                        {doc.urlFichaInacal && (
                          <div className="pl-5.5 pt-0.5">
                            <a
                              href={doc.urlFichaInacal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-600 hover:text-emerald-700 underline underline-offset-2 transition-colors cursor-pointer"
                              title="Consultar ficha catalográfica oficial de la norma en INACAL"
                            >
                              <span>Consultar ficha oficial de la norma</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Acción principal única */}
                      <div className="flex items-center justify-end pt-1">
                        <a
                          href={doc.urlMaterialInacal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                          title="Descargar material oficial de INACAL sobre residuos y código de colores (PDF)"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar material oficial INACAL</span>
                          <ExternalLink className="w-3 h-3 text-emerald-200" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                      <a
                        href={doc.urlOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                        title={`Abrir página oficial de ${doc.codigo}`}
                      >
                        <span>{doc.textoBoton}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: NORMATIVA SECTORIAL */}
          {activeTab === 'sectoriales' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2.5 text-xs text-slate-700">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">
                    Normativa Sectorial Específica
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Las normas sectoriales se incorporan según el ámbito de la actividad. Acceda directamente a las fuentes oficiales de cada autoridad ambiental competente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredSectoriales.map((sectorDoc, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {sectorDoc.sector}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {sectorDoc.entidad}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {sectorDoc.codigo}
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {sectorDoc.descripcion}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                      <a
                        href={sectorDoc.urlOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      >
                        <span>Ver en fuente oficial</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Enlaces oficiales directos • Sin alojamiento de copias no autorizadas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors ml-auto cursor-pointer"
          >
            Cerrar Biblioteca
          </button>
        </div>
      </div>
    </div>
  );
};
