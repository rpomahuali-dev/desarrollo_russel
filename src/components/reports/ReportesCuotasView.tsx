import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBytes } from '../../utils/validation';
import {
  BarChart3,
  HardDrive,
  AlertTriangle,
  Compass,
  Download,
  CheckCircle,
  Sliders,
  X
} from 'lucide-react';

export const ReportesCuotasView: React.FC = () => {
  const { quotaReports, totalDiskStats, totalQuotaStats, updateUser, users, files } = useApp();
  const [filterThreshold, setFilterThreshold] = useState<'all' | 'warning' | 'critical'>('all');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [newQuotaMB, setNewQuotaMB] = useState<number>(2048);

  // Dynamic file type breakdown calculation
  const fileBreakdown = useMemo(() => {
    const activeFiles = files.filter(f => !f.inTrash && !f.isFolder);
    const total = activeFiles.reduce((acc, f) => acc + f.sizeBytes, 0) || 1;

    const dwg = activeFiles.filter(f => f.fileType === 'dwg' || f.category === 'Planos').reduce((a, b) => a + b.sizeBytes, 0);
    const pdf = activeFiles.filter(f => f.fileType === 'pdf' && f.category !== 'Planos').reduce((a, b) => a + b.sizeBytes, 0);
    const video = activeFiles.filter(f => f.fileType === 'video' || f.fileType === 'image' || f.category === 'Multimedia').reduce((a, b) => a + b.sizeBytes, 0);
    const xls = activeFiles.filter(f => f.fileType === 'excel' || f.category === 'Costos').reduce((a, b) => a + b.sizeBytes, 0);
    const otros = activeFiles.filter(f =>
      !['dwg', 'video', 'image', 'excel'].includes(f.fileType) &&
      f.fileType !== 'pdf' &&
      !(f.category && ['Planos', 'Multimedia', 'Costos'].includes(f.category))
    ).reduce((a, b) => a + b.sizeBytes, 0);

    return [
      { label: 'Planos Topográficos y Diseños (.dwg, .dxf)', bytes: dwg, pct: Math.round((dwg / total) * 100), color: 'bg-amber-500' },
      { label: 'Documentos Técnicos y Memorias (.pdf)', bytes: pdf, pct: Math.round((pdf / total) * 100), color: 'bg-rose-500' },
      { label: 'Videos de Inspección y Multimedia (.mp4)', bytes: video, pct: Math.round((video / total) * 100), color: 'bg-purple-500' },
      { label: 'Hojas de Cálculo y Balances (.xlsx)', bytes: xls, pct: Math.round((xls / total) * 100), color: 'bg-emerald-500' },
      { label: 'Otros Archivos y Comprimidos (.zip, etc.)', bytes: otros, pct: Math.round((otros / total) * 100), color: 'bg-blue-500' }
    ].filter(item => item.bytes > 0 || total === 1);
  }, [files]);

  // Filter clients
  const filteredReports = quotaReports.filter(r => {
    if (filterThreshold === 'warning') return r.percentageUsed >= 70;
    if (filterThreshold === 'critical') return r.percentageUsed >= 85 || r.isOverLimit;
    return true;
  });

  const handleSaveQuota = () => {
    if (!editingClientId) return;
    const targetUser = users.find(u => u.id === editingClientId);
    if (!targetUser) return;

    updateUser(editingClientId, {
      storageQuotaBytes: newQuotaMB * 1024 * 1024
    });
    setEditingClientId(null);
  };

  const handleExportCSV = () => {
    const headers = ['Cliente', 'Usuario', 'Cuota_Asignada_Bytes', 'Usado_Bytes', 'Porcentaje', 'Total_Archivos', 'Estado'];
    const rows = quotaReports.map(r => [
      `"${r.clientName}"`,
      r.username,
      r.assignedQuotaBytes,
      r.usedBytes,
      `${r.percentageUsed}%`,
      r.fileCount,
      r.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_consumo_cuotas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#f0f4f8] min-h-[calc(100vh-62px)]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#102a43] tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#133e66]" />
              <span>Reportes de Consumo de Cuotas de Almacenamiento</span>
            </h1>
            <p className="text-xs text-[#486581] mt-1">
              Monitoreo del espacio asignado a cada titular, límites en MB/GB y consumo en tiempo real sincronizado.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Informe CSV</span>
          </button>
        </div>

        {/* Global KPI Cards: Exact Quota & Storage Consumed */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#d9e2ec] shadow-2xs">
            <div className="flex items-center justify-between text-[#627d98] mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Consumo Total de Cuotas</span>
              <HardDrive className="w-4 h-4 text-[#133e66]" />
            </div>
            <div className="text-2xl font-bold text-[#102a43] font-mono tabular-nums">
              {formatBytes(totalQuotaStats.totalConsumedQuotaBytes)}
            </div>
            <p className="text-[11px] text-[#627d98] mt-1">
              De {formatBytes(totalQuotaStats.totalAssignedQuotaBytes)} asignados en total
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#d9e2ec] shadow-2xs">
            <div className="flex items-center justify-between text-[#627d98] mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Espacio Libre Servidor</span>
              <CheckCircle className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-[#102a43] font-mono tabular-nums">
              {formatBytes(totalDiskStats.freeBytes)}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              {Math.round(100 - totalDiskStats.percentUsed)}% libre ({formatBytes(totalDiskStats.usedBytes)} ocupado de {formatBytes(totalDiskStats.totalBytes)})
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#d9e2ec] shadow-2xs">
            <div className="flex items-center justify-between text-[#627d98] mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Clientes Monitoreados</span>
              <BarChart3 className="w-4 h-4 text-[#133e66]" />
            </div>
            <div className="text-2xl font-bold text-[#102a43] font-mono tabular-nums">
              {quotaReports.length}
            </div>
            <p className="text-[11px] text-[#627d98] mt-1">
              Titulares con cuotas activas
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#d9e2ec] shadow-2xs">
            <div className="flex items-center justify-between text-[#627d98] mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Cuentas Cerca del Límite</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {quotaReports.filter(r => r.isNearLimit || r.isOverLimit).length}
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">
              Consumo mayor al 80%
            </p>
          </div>
        </div>

        {/* Detailed Client Quotas Table */}
        <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d9e2ec] flex flex-wrap items-center justify-between gap-3 bg-white">
            <div>
              <h3 className="font-bold text-base text-[#102a43]">
                Consumo Detallado por Cliente
              </h3>
              <p className="text-xs text-[#627d98]">
                Límites configurados desde el panel y porcentaje de utilización en tiempo real.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#f0f4f8] border border-[#d9e2ec] rounded-lg text-xs">
              <button
                onClick={() => setFilterThreshold('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filterThreshold === 'all' ? 'bg-[#133e66] text-white shadow-2xs' : 'text-[#486581] hover:text-[#102a43]'
                }`}
              >
                Todos los Clientes
              </button>
              <button
                onClick={() => setFilterThreshold('warning')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filterThreshold === 'warning' ? 'bg-[#133e66] text-white shadow-2xs' : 'text-[#486581] hover:text-[#102a43]'
                }`}
              >
                Advertencia (&gt;70%)
              </button>
              <button
                onClick={() => setFilterThreshold('critical')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filterThreshold === 'critical' ? 'bg-[#9e1c1c] text-white shadow-2xs' : 'text-[#486581] hover:text-[#102a43]'
                }`}
              >
                Críticos (&gt;85%)
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
                <th className="py-3 px-4">Titular / Cliente</th>
                <th className="py-3 px-3">Usuario</th>
                <th className="py-3 px-3">Espacio Usado</th>
                <th className="py-3 px-3">Límite Asignado</th>
                <th className="py-3 px-4 w-52">Nivel de Consumo (%)</th>
                <th className="py-3 px-3 text-center">Archivos</th>
                <th className="py-3 px-4 text-right">Ajuste de Cuota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredReports.map((report) => (
                <tr key={report.clientId} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#102a43]">
                    {report.clientName}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#486581]">
                    @{report.username}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-[#102a43] tabular-nums">
                    {formatBytes(report.usedBytes)}
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-[#102a43] tabular-nums">
                    {formatBytes(report.assignedQuotaBytes)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={`font-semibold ${
                          report.percentageUsed >= 85
                            ? 'text-rose-600'
                            : report.percentageUsed >= 70
                            ? 'text-amber-600'
                            : 'text-[#102a43]'
                        }`}>
                          {report.percentageUsed}%
                        </span>
                        <span className="text-[10px] text-[#627d98]">
                          {formatBytes(Math.max(0, report.assignedQuotaBytes - report.usedBytes))} libres
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            report.percentageUsed >= 85
                              ? 'bg-[#9e1c1c]'
                              : report.percentageUsed >= 70
                              ? 'bg-amber-500'
                              : 'bg-[#133e66]'
                          }`}
                          style={{ width: `${Math.min(100, report.percentageUsed)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-[#486581]">
                    {report.fileCount}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setEditingClientId(report.clientId);
                        setNewQuotaMB(Math.round(report.assignedQuotaBytes / (1024 * 1024)));
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#d9e2ec] hover:bg-[#bcccdc] text-[#102a43] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Modificar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Categories Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#d9e2ec] shadow-2xs">
            <h4 className="font-bold text-base text-[#102a43] mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-600" />
              <span>Desglose Real por Tipo de Archivo</span>
            </h4>
            <div className="space-y-3 text-xs">
              {fileBreakdown.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-[#334e68] mb-1">
                    <span>{item.label}</span>
                    <span className="font-mono font-semibold tabular-nums text-[#102a43]">
                      {formatBytes(item.bytes)} · {item.pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#edf2f7] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-300`}
                      style={{ width: `${Math.min(100, item.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#d9e2ec] shadow-2xs flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-base text-[#102a43] mb-2">
                Políticas de Cuota y Almacenamiento
              </h4>
              <p className="text-xs text-[#486581] leading-relaxed">
                El sistema valida el límite asignado antes de permitir la subida de nuevos documentos. Cuando un usuario intenta subir un archivo que excede su cuota restante, la plataforma bloquea la operación y notifica que debe solicitar una ampliación al Administrador.
              </p>
            </div>

            <div className="mt-4 p-3.5 bg-[#f0f4f8] rounded-lg border border-[#d9e2ec] text-xs text-[#334e68] space-y-1.5">
              <div><strong className="text-[#102a43]">Alerta Preventiva:</strong> Al alcanzar el 80% de ocupación.</div>
              <div><strong className="text-[#102a43]">Bloqueo de Carga:</strong> Al alcanzar el 100% de la cuota contratada.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Modal */}
      {editingClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#d9e2ec] w-full max-w-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-[#103b66] text-white flex items-center justify-between">
              <h4 className="font-bold text-xs">Modificar Límite de Almacenamiento</h4>
              <button onClick={() => setEditingClientId(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#102a43] mb-1">
                  Nueva Cuota de Almacenamiento (MB)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    step="50"
                    value={newQuotaMB}
                    onChange={(e) => setNewQuotaMB(Math.max(10, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 border border-[#cbd5e1] rounded font-mono font-bold text-[#102a43] focus:ring-2 focus:ring-[#133e66] outline-none"
                  />
                  <span className="font-mono font-bold text-[#133e66] text-xs min-w-16 text-right">
                    {newQuotaMB >= 1024 ? `${(newQuotaMB / 1024).toFixed(1)} GB` : `${newQuotaMB} MB`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 justify-center flex-wrap">
                {[250, 500, 1000, 2048, 5120, 10240].map(mb => (
                  <button
                    key={mb}
                    type="button"
                    onClick={() => setNewQuotaMB(mb)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer ${
                      newQuotaMB === mb ? 'bg-[#133e66] text-white border-[#133e66]' : 'bg-[#f0f4f8] border-[#d9e2ec] text-[#334e68] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    {mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#d9e2ec] flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditingClientId(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec] rounded-md cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveQuota}
                  className="px-4 py-1.5 bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md font-semibold text-xs shadow-2xs cursor-pointer transition-colors"
                >
                  Guardar Cuota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
