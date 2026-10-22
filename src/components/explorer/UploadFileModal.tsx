import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBytes } from '../../utils/validation';
import { FileType } from '../../types';
import {
  UploadCloud,
  X,
  Lock,
  AlertCircle,
  FileCheck2,
  File
} from 'lucide-react';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (fileData: {
    name: string;
    sizeBytes: number;
    fileType: FileType;
    extension: string;
  }) => { success: boolean; message?: string };
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({ isOpen, onClose, onUpload }) => {
  const { currentUser, currentClientId, users } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [sizeBytes, setSizeBytes] = useState<number>(0);
  const [sizeMBDisplay, setSizeMBDisplay] = useState<string>('0.00');
  const [fileType, setFileType] = useState<FileType>('pdf');
  const [fileTypeLabel, setFileTypeLabel] = useState<string>('Documento');
  const [extension, setExtension] = useState<string>('pdf');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const targetClient = users.find(u => u.id === currentClientId) || currentUser;
  const currentUsed = targetClient.usedStorageBytes || 0;
  const quota = targetClient.storageQuotaBytes || (2 * 1024 * 1024 * 1024);
  const wouldExceed = sizeBytes > 0 && (currentUsed + sizeBytes > quota);

  const detectFileTypeFromExt = (ext: string): { type: FileType; label: string } => {
    switch (ext) {
      case 'dwg':
      case 'dxf':
        return { type: 'dwg', label: 'Plano CAD (.dwg / .dxf)' };
      case 'pdf':
        return { type: 'pdf', label: 'Documento PDF (.pdf)' };
      case 'xlsx':
      case 'xls':
      case 'csv':
        return { type: 'excel', label: 'Hoja de Cálculo Excel (.xlsx)' };
      case 'docx':
      case 'doc':
        return { type: 'word', label: 'Documento Word (.docx)' };
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
        return { type: 'video', label: 'Video (.mp4)' };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return { type: 'image', label: 'Imagen (.jpg / .png)' };
      case 'zip':
      case 'rar':
      case '7z':
        return { type: 'zip', label: 'Archivo Comprimido (.zip)' };
      default:
        return { type: 'other', label: `Archivo (.${ext || 'desconocido'})` };
    }
  };

  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilename(file.name);
      setSizeBytes(file.size);
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      setSizeMBDisplay(mb);

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      setExtension(ext);
      const detected = detectFileTypeFromExt(ext);
      setFileType(detected.type);
      setFileTypeLabel(detected.label);
      setErrorMessage('');
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !filename.trim()) {
      setErrorMessage('Por favor seleccione un archivo para cargar.');
      return;
    }

    const res = onUpload({
      name: filename.trim(),
      sizeBytes: sizeBytes || 1024 * 1024,
      fileType,
      extension: extension || 'pdf'
    });

    if (!res.success) {
      setErrorMessage(res.message || 'Error al cargar el archivo.');
    } else {
      onClose();
      // Reset
      setSelectedFile(null);
      setFilename('');
      setSizeBytes(0);
      setSizeMBDisplay('0.00');
      setErrorMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-sm">Cargar archivo</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
          {/* File Picker area */}
          <div className="border border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors">
            <input
              type="file"
              id="filePickerInput"
              className="hidden"
              onChange={handleNativeFileSelect}
            />
            <label htmlFor="filePickerInput" className="cursor-pointer text-xs flex flex-col items-center">
              {selectedFile ? (
                <>
                  <FileCheck2 className="w-8 h-8 text-emerald-600 mb-1" />
                  <span className="font-bold text-slate-900 text-sm">{selectedFile.name}</span>
                  <span className="text-[11px] text-blue-600 hover:underline mt-1 font-semibold">
                    Haga clic aquí si desea cambiar de archivo
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-blue-600 mb-1" />
                  <span className="font-semibold text-blue-600 hover:underline text-sm">
                    Seleccionar archivo desde el equipo
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Cualquier formato: Planos, PDFs, Documentos, Hojas de cálculo, Multimedia o ZIP
                  </span>
                </>
              )}
            </label>
          </div>

          {/* File Details (Auto-detected & Read-Only) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Archivo *
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Seleccione un archivo arriba..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Auto-detected read-only file type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tipo de Archivo</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <Lock className="w-2.5 h-2.5" /> Automático
                  </span>
                </label>
                <input
                  type="text"
                  value={fileTypeLabel}
                  readOnly
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded-md text-slate-700 font-semibold cursor-not-allowed select-none outline-none"
                />
              </div>

              {/* Auto-detected read-only file size in MB */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tamaño Detectado (MB)</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <Lock className="w-2.5 h-2.5" /> Automático
                  </span>
                </label>
                <input
                  type="text"
                  value={`${sizeMBDisplay} MB`}
                  readOnly
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded-md text-slate-700 font-mono font-semibold cursor-not-allowed select-none outline-none"
                />
              </div>
            </div>
          </div>

          {/* Storage Quota Impact */}
          {sizeBytes > 0 && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                <span>Cuota de Almacenamiento ({targetClient.username}):</span>
                <span className={`font-mono tabular-nums ${wouldExceed ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                  {formatBytes(currentUsed + sizeBytes)} / {formatBytes(quota)}
                </span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    wouldExceed ? 'bg-rose-600' : 'bg-blue-600'
                  }`}
                  style={{
                    width: `${Math.min(100, ((currentUsed + sizeBytes) / quota) * 100)}%`
                  }}
                />
              </div>

              {wouldExceed ? (
                <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-semibold mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>¡Excede el límite de almacenamiento disponible para este usuario!</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  Espacio libre restante: {formatBytes(quota - (currentUsed + sizeBytes))}
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs">
              {errorMessage}
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={wouldExceed || !filename.trim()}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-md transition-colors ${
                wouldExceed || !filename.trim()
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Cargar Archivo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
