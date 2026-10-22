import React, { useState } from 'react';
import { FileItem } from '../../types';
import { formatBytes, formatDate } from '../../utils/validation';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Layers,
  Compass,
  FileSpreadsheet,
  FileCode,
  Image,
  Video,
  Archive,
  Info,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface FilePreviewModalProps {
  file: FileItem;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, onDownload }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    'Curvas de Nivel (1m)': true,
    'Vetas Auríferas (Cuarzo)': true,
    'Ejes de Socavón': true,
    'Bocamina y Chimeneas': true,
    'Puntos Geodésicos IGN': true,
    'Infraestructura Campamento': true
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const simulated = file.fileContentSimulated || {
    previewType: file.fileType === 'dwg' ? 'cad' : file.fileType === 'pdf' ? 'pdf' : file.fileType === 'excel' ? 'spreadsheet' : 'text',
    summary: file.description || 'Archivo técnico minero'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col w-full max-w-5xl h-[88vh] overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 truncate">
            <div className="p-1.5 bg-slate-800 rounded-md">
              {file.fileType === 'dwg' && <Compass className="w-5 h-5 text-amber-400" />}
              {file.fileType === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
              {file.fileType === 'excel' && <FileSpreadsheet className="w-5 h-5 text-emerald-400" />}
              {file.fileType === 'image' && <Image className="w-5 h-5 text-blue-400" />}
              {file.fileType === 'video' && <Video className="w-5 h-5 text-purple-400" />}
              {file.fileType === 'zip' && <Archive className="w-5 h-5 text-orange-400" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold truncate text-white" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {formatBytes(file.sizeBytes)} · Subido el {formatDate(file.createdAt, true)} por {file.uploadedByName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Visualizer Area */}
          <div className="flex-1 bg-slate-900 relative overflow-auto flex items-center justify-center p-6">
            {/* CAD DWG Visualizer */}
            {file.fileType === 'dwg' && (
              <div
                className="w-full h-full min-h-[400px] border border-slate-700 rounded-lg relative overflow-hidden bg-[#0c1322] flex flex-col justify-between p-4"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
              >
                {/* Simulated CAD Canvas Grid */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cadGrid)" />
                </svg>

                {/* Simulated Georeferenced Elements */}
                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  {/* Top CAD toolbar inside view */}
                  <div className="flex items-center justify-between text-xs text-sky-400 font-mono">
                    <span className="bg-slate-800/80 px-2.5 py-1 rounded-sm border border-slate-700">
                      PROYECCIÓN: UTM WGS84 ZONA 19 SUR
                    </span>
                    <span className="bg-slate-800/80 px-2.5 py-1 rounded-sm border border-slate-700">
                      ESCALA: 1:500 | COTAS: 4,850 - 5,200 msnm
                    </span>
                  </div>

                  {/* Blueprint Graphic Lines */}
                  <div className="flex-1 flex items-center justify-center relative my-4">
                    <svg viewBox="0 0 800 450" className="w-full h-full max-h-[360px]">
                      {/* Curvas de nivel */}
                      {activeLayers['Curvas de Nivel (1m)'] && (
                        <g stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.6">
                          <path d="M 50 100 Q 200 40 400 90 T 750 120" />
                          <path d="M 50 160 Q 220 110 420 150 T 750 190" />
                          <path d="M 50 220 Q 240 180 440 210 T 750 260" />
                          <path d="M 50 280 Q 260 250 460 270 T 750 330" />
                          <path d="M 50 340 Q 280 320 480 330 T 750 400" />
                        </g>
                      )}

                      {/* Veta Aurífera */}
                      {activeLayers['Vetas Auríferas (Cuarzo)'] && (
                        <g stroke="#f59e0b" strokeWidth="4" fill="none">
                          <path d="M 120 380 L 260 280 L 410 210 L 580 140 L 710 80" />
                          <text x="420" y="195" fill="#f59e0b" fontSize="12" fontFamily="monospace">
                            VETA CUMBRE (Potencia 0.50m - Ley 22.1 g/t Au)
                          </text>
                        </g>
                      )}

                      {/* Socavón */}
                      {activeLayers['Ejes de Socavón'] && (
                        <g stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6,3" fill="none">
                          <path d="M 150 400 L 280 320 L 450 250 L 590 190" />
                          <circle cx="150" cy="400" r="6" fill="#38bdf8" />
                          <text x="165" y="405" fill="#38bdf8" fontSize="11" fontFamily="monospace">
                            Bocamina Nivel 1 (Cota 5,120)
                          </text>
                        </g>
                      )}

                      {/* Chimeneas */}
                      {activeLayers['Bocamina y Chimeneas'] && (
                        <g fill="#ef4444">
                          <rect x="275" y="315" width="10" height="10" />
                          <text x="290" y="325" fill="#ef4444" fontSize="10" fontFamily="monospace">
                            CH-01
                          </text>
                          <rect x="445" y="245" width="10" height="10" />
                          <text x="460" y="255" fill="#ef4444" fontSize="10" fontFamily="monospace">
                            CH-02 (Ventilación)
                          </text>
                        </g>
                      )}

                      {/* Puntos Geodésicos IGN */}
                      {activeLayers['Puntos Geodésicos IGN'] && (
                        <g fill="#10b981">
                          <polygon points="100,80 108,95 92,95" />
                          <text x="115" y="92" fill="#10b981" fontSize="10" fontFamily="monospace">
                            BM-01 (IGN Oficial)
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>

                  {/* Bottom CAD status coordinates */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-800/80 p-2 rounded-sm border border-slate-700">
                    <span>CURSOR UTM: E: 452,389.12 · N: 8,382,914.88 · Z: 5,124.50</span>
                    <span className="text-amber-400">MODEL SPACE (CAD 2026 ENGINE)</span>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Visualizer */}
            {file.fileType === 'pdf' && (
              <div
                className="w-full max-w-2xl bg-white text-slate-800 p-8 rounded-lg shadow-2xl min-h-[500px] flex flex-col justify-between"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              >
                <div>
                  <div className="flex items-start justify-between border-b pb-4 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        DOCUMENTO OFICIAL TÉCNICO MINERO
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">
                        {file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Referencia del expediente: EXP-{file.id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center font-bold text-slate-400 text-xs">
                      PDF
                    </div>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                    <p className="font-medium text-slate-900">
                      {simulated.summary || 'Expediente técnico revisado y visado para fines de trámite ante las autoridades competentes.'}
                    </p>
                    <p>
                      El presente documento forma parte integral del archivo del titular minero, certificando los estudios de ingeniería, georreferenciación y cumplimiento normativo vigente en el territorio nacional.
                    </p>
                    <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1 font-mono text-[11px]">
                      <div><strong>Titular:</strong> {file.uploadedByName}</div>
                      <div><strong>Código de Registro:</strong> REG-MIN-2026-0981</div>
                      <div><strong>Firma Digital:</strong> Verificada y con validez legal</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Página {currentPage} de {simulated.totalPages || 4}</span>
                  <span>Confidencial · Uso Exclusivo del Cliente</span>
                </div>
              </div>
            )}

            {/* Excel Visualizer */}
            {file.fileType === 'excel' && (
              <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-emerald-800 text-white flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>Hoja de Cálculo Minera - {file.name}</span>
                  </div>
                  <span className="text-emerald-200 font-mono text-[11px]">FORMATO XLSX</span>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        {(simulated.sheetHeaders || ['Ítem', 'Descripción', 'Unidad', 'Cantidad', 'Costo Unit.', 'Total']).map((header, idx) => (
                          <th key={idx} className="p-2.5 border-r border-slate-200 text-slate-900">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                      {(simulated.sheetRows || [
                        ['1', 'Perforación de frentes con jackleg', 'Metros', '120', '$ 45.00', '$ 5,400.00'],
                        ['2', 'Dinamita 65% y accesorios de voladura', 'Cajas', '35', '$ 82.50', '$ 2,887.50'],
                        ['3', 'Transporte de mineral en carros mineros', 'TM', '450', '$ 12.00', '$ 5,400.00'],
                        ['4', 'Tratamiento en planta de beneficio', 'TM', '450', '$ 35.00', '$ 15,750.00']
                      ]).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-slate-200">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-sm font-semibold text-emerald-700">
                    Hoja 1 (Resumen)
                  </span>
                  <span className="px-2.5 py-1 text-slate-500">Hoja 2 (Datos Crudos)</span>
                  <span className="px-2.5 py-1 text-slate-500">Hoja 3 (Gráficos)</span>
                </div>
              </div>
            )}

            {/* Image / Video / Archive visualizers */}
            {file.fileType === 'image' && (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="max-w-xl max-h-[70vh] bg-slate-800 p-2 rounded-lg shadow-xl border border-slate-700">
                  <div className="w-full h-80 bg-gradient-to-br from-slate-800 via-amber-950/40 to-slate-900 rounded-md flex items-center justify-center flex-col text-slate-300 p-6 text-center">
                    <Image className="w-16 h-16 text-amber-500/80 mb-3" />
                    <h5 className="font-semibold text-sm text-white">{file.name}</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {simulated.summary || 'Registro fotográfico geológico de labores subterráneas en mina.'}
                    </p>
                    <span className="text-[11px] font-mono text-amber-400 mt-2 bg-slate-900/80 px-2 py-0.5 rounded">
                      {simulated.dimensions || '4032 x 3024 px · Sensor 48MP'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {file.fileType === 'video' && (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-black rounded-lg shadow-2xl overflow-hidden border border-slate-800">
                  <div className="h-72 bg-gradient-to-t from-slate-900 via-slate-800 to-black flex flex-col items-center justify-center text-white p-6 relative">
                    <Video className="w-16 h-16 text-sky-400 mb-2" />
                    <span className="font-semibold text-sm">{file.name}</span>
                    <span className="text-xs text-slate-400 mt-1 font-mono">
                      Duración: {simulated.duration || '08:45 min'} · Resolución 4K UHD
                    </span>
                    <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors">
                      ▶ Reproducir Video de Inspección
                    </button>
                  </div>
                </div>
              </div>
            )}

            {file.fileType === 'zip' && (
              <div className="w-full max-w-lg bg-white rounded-lg shadow-xl p-5 text-slate-800">
                <div className="flex items-center gap-3 border-b pb-3 mb-3">
                  <Archive className="w-8 h-8 text-amber-600" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{file.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Archivo comprimido ZIP · {formatBytes(file.sizeBytes)}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mb-3 font-medium">
                  Contenido indexado en el archivo:
                </div>
                <div className="bg-slate-50 rounded-md border border-slate-200 divide-y divide-slate-100 font-mono text-xs max-h-48 overflow-y-auto">
                  <div className="p-2 flex items-center justify-between">
                    <span>📄 01_Plano_Topografico_Planta.dwg</span>
                    <span className="text-slate-400">42.1 MB</span>
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <span>📄 02_Plano_Cortes_Longitudinales.dwg</span>
                    <span className="text-slate-400">38.4 MB</span>
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <span>📄 03_Memoria_Descriptiva_Ingenieria.pdf</span>
                    <span className="text-slate-400">14.2 MB</span>
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <span>📄 04_Especificaciones_Tecnicas.docx</span>
                    <span className="text-slate-400">3.8 MB</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Information & Layers Panel */}
          <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col p-4 text-xs overflow-y-auto shrink-0">
            {/* Zoom & Canvas controls for CAD or PDF */}
            {(file.fileType === 'dwg' || file.fileType === 'pdf') && (
              <div className="mb-4 pb-4 border-b border-slate-200">
                <h5 className="font-semibold text-slate-700 mb-2">Controles de Visualización</h5>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-slate-200">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                    title="Alejar"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center font-mono font-medium text-slate-700 tabular-nums">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                    title="Acercar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="px-2 py-1 hover:bg-slate-100 rounded text-[11px] font-medium text-slate-600"
                  >
                    100%
                  </button>
                </div>
              </div>
            )}

            {/* CAD Layers Toggles */}
            {file.fileType === 'dwg' && (
              <div className="mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-2">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>Capas del Plano (Layers)</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(activeLayers).map(([layerName, isVisible]) => (
                    <label
                      key={layerName}
                      className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-100"
                    >
                      <span className="text-[11px] font-medium text-slate-700 truncate pr-2">
                        {layerName}
                      </span>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleLayer(layerName)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Properties & Permission Badges */}
            <div className="space-y-3">
              <h5 className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Propiedades del Archivo</span>
              </h5>

              <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Ruta en servidor</span>
                  <p className="font-mono text-[11px] text-slate-700 break-all">{file.path}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Tamaño</span>
                  <p className="font-mono text-slate-800 font-semibold">{formatBytes(file.sizeBytes)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Subido por</span>
                  <p className="text-slate-800">{file.uploadedByName} ({file.uploadedByRole})</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Fecha de carga</span>
                  <p className="font-mono text-slate-700">{formatDate(file.createdAt, true)}</p>
                </div>
              </div>

              {/* Client Access State */}
              <div className={`p-3 rounded-lg border ${
                file.isClientReadOnly
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                  {file.isClientReadOnly ? (
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  )}
                  <span>
                    {file.isClientReadOnly ? 'Protegido (Solo Lectura)' : 'Subido por Minero (Editable)'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {file.isClientReadOnly
                    ? 'Este documento fue cargado por la administración. El minero puede visualizarlo y descargarlo, pero no modificarlo ni borrarlo.'
                    : 'Este archivo fue aportado por el minero. Puede ser reemplazado o movido por el cliente o el administrador.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
