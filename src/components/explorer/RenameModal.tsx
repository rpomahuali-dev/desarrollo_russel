import React, { useState, useEffect, useRef } from 'react';
import { Edit2, X } from 'lucide-react';
import { FileItem } from '../../types';

interface RenameModalProps {
  isOpen: boolean;
  item: FileItem | null;
  onClose: () => void;
  onRename: (itemId: string, newName: string) => { success: boolean; message?: string };
}

export const RenameModal: React.FC<RenameModalProps> = ({ isOpen, item, onClose, onRename }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item && isOpen) {
      setName(item.name);
      setError('');
      // Focus and highlight filename without extension if file
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (!item.isFolder && item.name.includes('.')) {
            const lastDot = item.name.lastIndexOf('.');
            inputRef.current.setSelectionRange(0, lastDot);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    if (trimmed === item.name) {
      onClose();
      return;
    }

    const res = onRename(item.id, trimmed);
    if (!res.success) {
      setError(res.message || 'Error al renombrar el elemento.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm">
              Renombrar {item.isFolder ? 'Carpeta' : 'Archivo'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nuevo Nombre para el elemento *
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none font-medium"
            />
            {error && <p className="text-xs text-rose-600 mt-1 font-semibold">{error}</p>}
          </div>

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
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-2xs"
            >
              Guardar Nombre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
