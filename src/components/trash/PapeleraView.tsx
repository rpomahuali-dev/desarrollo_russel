import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBytes, formatDate } from '../../utils/validation';
import { Trash2, RotateCcw } from 'lucide-react';

export const PapeleraView: React.FC = () => {
  const {
    currentUser,
    trashCases,
    trashFiles,
    restoreFromTrash,
    deletePermanently,
    emptyTrash
  } = useApp();

  const [notification, setNotification] = useState<string | null>(null);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Only Administrator can access the trash
  if (currentUser.role !== 'admin') {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-center">
        <div className="p-6 bg-white rounded-xl border border-slate-200 max-w-md">
          <Trash2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Acceso Restringido</h3>
          <p className="text-xs text-slate-500 mt-1">
            La papelera de reciclaje está reservada exclusivamente para el Administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  const hasItems = trashCases.length > 0 || trashFiles.length > 0;

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#f0f4f8] min-h-[calc(100vh-62px)]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#102a43] tracking-tight">
              Papelera
            </h1>
            <p className="text-xs text-[#486581] mt-1 max-w-4xl leading-relaxed">
              Lo que se elimina queda aquí y puede recuperarse. «Borrar definitivamente» elimina también el archivo del disco y no se puede deshacer. Restaurar una carpeta devuelve también lo que contiene (archivos). Al eliminar un usuario, sus carpetas quedan aquí.
            </p>
          </div>

          {hasItems && (
            <button
              onClick={() => {
                if (window.confirm('¿Está seguro de vaciar toda la papelera? Esta acción no se puede deshacer.')) {
                  emptyTrash();
                  showNotify('Papelera vaciada completamente.');
                }
              }}
              className="px-4 py-2 text-xs font-semibold bg-[#9e1c1c] hover:bg-[#7f1d1d] text-white rounded-md shadow-2xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar Papelera</span>
            </button>
          )}
        </div>

        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-700 font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Section 1: Carpetas en Papelera */}
        <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d9e2ec] bg-white">
            <h3 className="font-bold text-base text-[#102a43]">
              Carpetas Eliminadas ({trashCases.length})
            </h3>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Carpeta</th>
                <th className="py-3 px-4">Archivos</th>
                <th className="py-3 px-4">Eliminado</th>
                <th className="py-3 px-4">Por</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {trashCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-[#627d98]">
                    No hay carpetas en la papelera.
                  </td>
                </tr>
              ) : (
                trashCases.map(tc => (
                  <tr key={tc.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#102a43]">
                      {tc.clientName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#102a43]">
                      {tc.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#486581]">
                      {tc.fileCount} arch. ({formatBytes(tc.totalSize)})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#486581] tabular-nums">
                      {formatDate(tc.deletedAt, true)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#486581]">
                      @{tc.deletedBy}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            restoreFromTrash('case', tc.id);
                            showNotify(`Carpeta "${tc.title}" restaurada.`);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#d9e2ec] hover:bg-[#bcccdc] text-[#102a43] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          onClick={() => {
                            deletePermanently('case', tc.id);
                            showNotify(`Carpeta "${tc.title}" borrada definitivamente.`);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#9e1c1c] hover:bg-[#7f1d1d] text-white rounded-md shadow-2xs transition-colors cursor-pointer"
                        >
                          Borrar definitivamente
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: Archivos Eliminados */}
        <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d9e2ec] bg-white">
            <h3 className="font-bold text-base text-[#102a43]">
              Archivos ({trashFiles.length})
            </h3>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
                <th className="py-3 px-4">Archivo</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Tamaño</th>
                <th className="py-3 px-4">Cliente / Ruta</th>
                <th className="py-3 px-4">Eliminado</th>
                <th className="py-3 px-4">Por</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {trashFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 px-4 text-center text-[#627d98]">
                    No hay archivos en la papelera.
                  </td>
                </tr>
              ) : (
                trashFiles.map(tf => (
                  <tr key={tf.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#102a43]">
                      {tf.name}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-[#486581]">
                      {tf.fileType}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-[#486581]">
                      {formatBytes(tf.sizeBytes)}
                    </td>
                    <td className="py-3.5 px-4 text-[#486581] truncate max-w-xs">
                      {tf.clientName} ({tf.casePath})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#486581] tabular-nums">
                      {formatDate(tf.deletedAt, true)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#486581]">
                      @{tf.deletedBy}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            restoreFromTrash('file', tf.id);
                            showNotify(`Archivo "${tf.name}" restaurado.`);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#d9e2ec] hover:bg-[#bcccdc] text-[#102a43] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          onClick={() => {
                            deletePermanently('file', tf.id);
                            showNotify(`Archivo "${tf.name}" borrado definitivamente.`);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#9e1c1c] hover:bg-[#7f1d1d] text-white rounded-md shadow-2xs transition-colors cursor-pointer"
                        >
                          Borrar definitivamente
                        </button>
                      </div>
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
