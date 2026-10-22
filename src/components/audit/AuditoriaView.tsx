import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/validation';
import { History, Search, Download } from 'lucide-react';

export const AuditoriaView: React.FC = () => {
  const { auditLogs } = useApp();
  const [filterQuery, setFilterQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilter(filterQuery.trim().toLowerCase());
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!activeFilter) return true;
    const q = activeFilter;
    return (
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.detail.toLowerCase().includes(q) ||
      log.ip.toLowerCase().includes(q) ||
      log.timestamp.includes(q)
    );
  });

  const handleExportAuditCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Accion', 'Detalle', 'IP'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.username}"`,
      `"${l.action}"`,
      `"${l.detail.replace(/"/g, '""')}"`,
      `"${l.ip}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_geominer_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#f0f4f8] min-h-[calc(100vh-62px)]">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#102a43] tracking-tight">
              Registro de auditoría
            </h1>
            <p className="text-xs text-[#486581] mt-1">
              Trazabilidad completa de operaciones, accesos y modificaciones en el sistema.
            </p>
          </div>

          <button
            onClick={handleExportAuditCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>

        {/* Filter input & button */}
        <form onSubmit={handleFilterSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrar por usuario, acción o detalle..."
            className="flex-1 px-3.5 py-2 text-xs border border-[#cbd5e1] rounded-md bg-white focus:ring-2 focus:ring-[#133e66] outline-none text-[#102a43]"
          />
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            Filtrar
          </button>
          {activeFilter && (
            <button
              type="button"
              onClick={() => {
                setFilterQuery('');
                setActiveFilter('');
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec] rounded-md cursor-pointer transition-colors"
            >
              Limpiar
            </button>
          )}
        </form>

        {/* Audit Log Table */}
        <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
                <th className="py-3 px-4 w-40">Fecha</th>
                <th className="py-3 px-4 w-36">Usuario</th>
                <th className="py-3 px-4 w-44">Acción</th>
                <th className="py-3 px-4">Detalle</th>
                <th className="py-3 px-4 w-28 text-right">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-center text-[#627d98] font-sans text-xs">
                    No se encontraron registros de auditoría para la búsqueda actual.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3 px-4 text-[#486581] tabular-nums">
                      {formatDate(log.timestamp, true)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#102a43]">
                      {log.username}
                    </td>
                    <td className="py-3 px-4 text-[#102a43] font-sans font-medium">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-[#486581] font-sans text-xs">
                      {log.detail}
                    </td>
                    <td className="py-3 px-4 text-[#627d98] text-right tabular-nums">
                      {log.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
