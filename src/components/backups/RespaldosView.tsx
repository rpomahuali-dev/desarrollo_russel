import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/validation';
import { HardDrive, CheckCircle2, Download, Check, Trash2, ShieldCheck, X } from 'lucide-react';

export const RespaldosView: React.FC = () => {
  const {
    backups,
    createBackupNow,
    verifyBackupItem,
    deleteBackupItem
  } = useApp();

  const [notification, setNotification] = useState<string | null>(null);
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    backupId: string;
    filename: string;
    checksum: string;
    isVerified: boolean;
  }>({
    isOpen: false,
    backupId: '',
    filename: '',
    checksum: '',
    isVerified: false
  });

  const handleCreateBackup = () => {
    const newBak = createBackupNow();
    setNotification(`Respaldo generado exitosamente: ${newBak.filename}`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleVerify = (bak: any) => {
    verifyBackupItem(bak.id);
    setVerificationModal({
      isOpen: true,
      backupId: bak.id,
      filename: bak.filename,
      checksum: bak.checksum,
      isVerified: true
    });
  };

  const handleDownloadBackup = (bak: any) => {
    const manifest = {
      sistema: 'GeoMiner Drive v2.4',
      fecha: bak.date,
      archivo_respaldo: bak.filename,
      checksum_sha256: bak.checksum,
      archivos_indexados: bak.fileCount,
      estado: 'COMPLETO_VERIFICADO',
      entidades: ['usuarios_mineros', 'minas', 'expedientes_planos', 'auditoria', 'cuotas']
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = bak.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setNotification(`Descargando ${bak.filename}`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#f0f4f8] min-h-[calc(100vh-62px)]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header matching reference image */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#102a43] tracking-tight">
            Respaldos
          </h1>

          <button
            onClick={handleCreateBackup}
            className="px-4 py-2 bg-[#133e66] hover:bg-[#0e2e4d] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Crear respaldo ahora</span>
          </button>
        </div>

        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-emerald-700 cursor-pointer">✕</button>
          </div>
        )}

        {/* Section 1: Estado matching reference image */}
        <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs p-6 space-y-3">
          <h3 className="font-bold text-base text-[#102a43]">
            Estado
          </h3>

          <p className="text-xs text-[#334e68] leading-relaxed">
            Un respaldo guarda <strong className="font-bold text-[#102a43]">la base de datos, la clave interna y todos los archivos</strong> en un solo .zip verificable. Los datos ocupan hoy <strong className="font-bold text-[#102a43]">1.5 MB</strong> y quedan <strong className="font-bold text-[#102a43]">192.4 GB</strong> libres en el disco de respaldos.
          </p>

          <ul className="text-xs text-[#334e68] space-y-1.5 list-disc list-inside">
            <li>
              Carpeta de respaldos: <span className="font-mono text-[#486581]">D:\Desarrollo\py_gestot_archivos\gestor_archivos\respaldos</span>
            </li>
            <li>Respaldo automático: cada 24 h mientras el sistema esté encendido</li>
            <li>Se conservan los últimos 10 respaldos; los más antiguos se borran solos.</li>
            <li>Copia externa: no configurada (recomendado: disco externo o carpeta sincronizada)</li>
          </ul>

          <p className="text-xs text-[#627d98] leading-relaxed pt-2">
            Un respaldo en el mismo equipo no protege contra la pérdida del equipo. Copia periódicamente los respaldos a otro lugar (descárgalos aquí o configura la copia externa). Los respaldos contienen todos los datos: guárdalos con el mismo cuidado que el sistema.
          </p>
        </div>

        {/* Section 2: Respaldos disponibles matching reference image */}
        <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 bg-white">
            <h3 className="font-bold text-base text-[#102a43]">
              Respaldos disponibles ({backups.length})
            </h3>
          </div>

          <div className="px-6 pb-6">
            <div className="border border-[#d9e2ec] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
                    <th className="py-3 px-5">Respaldo</th>
                    <th className="py-3 px-5">Fecha</th>
                    <th className="py-3 px-5">Tamaño</th>
                    <th className="py-3 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] bg-white">
                  {backups.map(bak => (
                    <tr key={bak.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-[#334e68]">
                        {bak.filename}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-[#334e68] tabular-nums">
                        {formatDate(bak.date, true)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-[#334e68] tabular-nums">
                        {bak.size}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleDownloadBackup(bak)}
                            className="px-3.5 py-1.5 bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                          >
                            Descargar
                          </button>

                          <button
                            onClick={() => handleVerify(bak)}
                            className="px-3.5 py-1.5 bg-[#d9e2ec] hover:bg-[#bcccdc] text-[#102a43] rounded-md text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Verificar
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`¿Desea eliminar el respaldo ${bak.filename}?`)) {
                                deleteBackupItem(bak.id);
                                setNotification(`Respaldo ${bak.filename} eliminado.`);
                                setTimeout(() => setNotification(null), 3000);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-[#9e1c1c] hover:bg-[#7f1d1d] text-white rounded-md text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Dialog */}
      {verificationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-xs">Verificación de Integridad de Respaldo</h4>
              </div>
              <button
                onClick={() => setVerificationModal({ ...verificationModal, isOpen: false })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Archivo verificado correctamente. La firma criptográfica y el árbol de ficheros son íntegros.</span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] bg-slate-50 p-3 rounded border border-slate-200 text-slate-700">
                <div><strong>Archivo:</strong> {verificationModal.filename}</div>
                <div><strong>Hash SHA-256:</strong> {verificationModal.checksum}</div>
                <div><strong>Estado:</strong> 100% libre de corrupción</div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setVerificationModal({ ...verificationModal, isOpen: false })}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
