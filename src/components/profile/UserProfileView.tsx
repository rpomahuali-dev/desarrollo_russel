import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBytes, checkUserAccessStatus, formatDate } from '../../utils/validation';
import {
  User as UserIcon,
  Building2,
  Calendar,
  HardDrive,
  Clock,
  Key,
  Copy,
  Check,
  Shield,
  History,
  FileText,
  FolderTree,
  ExternalLink,
  Tag,
  PlusCircle,
  ArrowRight
} from 'lucide-react';

interface UserProfileViewProps {
  onGoToExplorer: () => void;
  onManageUsers?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onGoToExplorer, onManageUsers }) => {
  const { currentUser, updateUser } = useApp();
  const [profileTab, setProfileTab] = useState<'datos' | 'historial'>('datos');
  const [copiedKey, setCopiedKey] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const accessStatus = checkUserAccessStatus(currentUser);
  const usedBytes = currentUser.usedStorageBytes || 0;
  const quotaBytes = currentUser.storageQuotaBytes || (2 * 1024 * 1024 * 1024);
  const percentUsed = quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;

  const handleCopyCredentials = () => {
    const text = `Credenciales de Acceso:\nUsuario: @${currentUser.username}\nContraseña: ${currentUser.password || '••••••••'}\nRol: ${currentUser.role}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleAddHistoryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const newEvent = {
      id: `h-custom-${Date.now()}`,
      timestamp: `${day}/${month}/${year} ${hours}:${minutes}`,
      action: 'Nota administrativa de expediente',
      detail: newNote.trim(),
      author: currentUser.username,
      tag: 'datos' as const
    };

    const existingHistory = currentUser.history || [];
    updateUser(currentUser.id, {
      history: [newEvent, ...existingHistory]
    });

    setNewNote('');
    setIsAddingNote(false);
  };

  // Default initial history if not populated yet
  const userHistory = currentUser.history || [
    {
      id: 'h-def-1',
      timestamp: `${formatDate(currentUser.createdAt || '2026-04-20')} 09:00`,
      action: 'Registro Inicial en la Plataforma',
      detail: `Usuario registrado como ${currentUser.personType === 'juridica' ? 'Persona Jurídica' : 'Persona Natural'} con documento ${currentUser.docType} ${currentUser.docNumber} y RUC ${currentUser.ruc || 'N/A'}.`,
      author: 'admin',
      tag: 'creacion' as const
    },
    {
      id: 'h-def-2',
      timestamp: `${formatDate(currentUser.validFrom || '2026-04-20')} 10:00`,
      action: 'Asignación de Cuota de Almacenamiento',
      detail: `Límite asignado en ${Math.round(quotaBytes / (1024 * 1024))} MB con vigencia hasta ${formatDate(currentUser.validUntil)}.`,
      author: 'admin',
      tag: 'cuota' as const
    }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-100 min-h-[calc(100vh-100px)]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md ${
              currentUser.role === 'admin'
                ? 'bg-slate-900'
                : currentUser.role === 'collaborator'
                ? 'bg-blue-600'
                : 'bg-amber-600'
            }`}>
              {currentUser.personType === 'juridica' ? (
                <Building2 className="w-8 h-8" />
              ) : (
                <UserIcon className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {currentUser.businessName || `${currentUser.firstName} ${currentUser.lastNamePaterno} ${currentUser.lastNameMaterno}`}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : currentUser.role === 'collaborator'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}>
                  {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'collaborator' ? 'Colaborador' : 'Cliente Titular'}
                </span>

                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  currentUser.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {currentUser.status === 'active' ? '● Cuenta Activa' : '● Inactivo'}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span className="font-mono font-medium text-slate-700">@{currentUser.username}</span>
                <span>·</span>
                <span>RUC: <strong className="font-mono text-slate-800">{currentUser.ruc || 'No registrado'}</strong></span>
                <span>·</span>
                <span>{currentUser.personType === 'juridica' ? 'Persona Jurídica' : 'Persona Natural'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCopyCredentials}
              className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copiado' : 'Copiar Credenciales'}</span>
            </button>

            <button
              onClick={onGoToExplorer}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FolderTree className="w-4 h-4" />
              <span>Ir a mis Archivos y Carpetas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Ficha y Datos vs Línea de Historia */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setProfileTab('datos')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              profileTab === 'datos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Ficha y Datos del Usuario</span>
          </button>

          <button
            onClick={() => setProfileTab('historial')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              profileTab === 'historial'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <History className="w-4 h-4 text-amber-500" />
            <span>Línea de Historia del Usuario</span>
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
              {userHistory.length}
            </span>
          </button>
        </div>

        {/* TAB 1: DATOS DEL USUARIO */}
        {profileTab === 'datos' && (
          <div className="space-y-6 animate-in fade-in duration-100">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Storage metric */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Almacenamiento</span>
                  <HardDrive className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {formatBytes(usedBytes)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    de {formatBytes(quotaBytes)} ({Math.round(quotaBytes / (1024 * 1024))} MB)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      percentUsed >= 90 ? 'bg-rose-500' : percentUsed >= 75 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {Math.round(percentUsed)}% utilizado · Quedan {formatBytes(Math.max(0, quotaBytes - usedBytes))} libres
                </p>
              </div>

              {/* Validity metric */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Vigencia de Acceso</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {accessStatus.daysRemaining === 9999 ? 'Ilimitado' : `${accessStatus.daysRemaining} días`}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  {formatDate(currentUser.validFrom)} al {formatDate(currentUser.validUntil)}
                </div>
                <p className={`text-[11px] font-semibold ${
                  !accessStatus.isAllowed ? 'text-rose-600' : accessStatus.daysRemaining <= 7 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {!accessStatus.isAllowed ? 'Acceso Vencido' : accessStatus.daysRemaining <= 7 ? 'Próximo a expirar' : 'Acceso Autorizado'}
                </p>
              </div>

              {/* Role & Permissions metric */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Perfil y Permisos</span>
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-base font-bold text-slate-900">
                  {currentUser.role === 'admin'
                    ? 'Acceso Total (Administrador)'
                    : currentUser.role === 'collaborator'
                    ? 'Visualizador Técnico (Colaborador)'
                    : 'Cliente Titular (Carga y Gestión)'}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {currentUser.role === 'admin'
                    ? 'Puede crear usuarios, configurar cuotas, restaurar papelera y auditar.'
                    : currentUser.role === 'collaborator'
                    ? 'Puede consultar expedientes y buscar por usuario sin modificar archivos.'
                    : 'Puede subir archivos y crear carpetas respetando su cuota de almacenamiento.'}
                </p>
              </div>
            </div>

            {/* Detailed Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Datos de Identidad y Registro Técnico</span>
                </h3>
                {currentUser.role === 'admin' && onManageUsers && (
                  <button
                    onClick={onManageUsers}
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Gestionar en Catálogo de Usuarios</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Tipo de Persona
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {currentUser.personType === 'juridica' ? 'Persona Jurídica (Empresa)' : 'Persona Natural'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Número de RUC
                  </span>
                  <p className="text-sm font-mono font-bold text-blue-700">
                    {currentUser.ruc || 'No registrado'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Documento de Identidad
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-800">
                    {currentUser.docType}: {currentUser.docNumber}
                  </p>
                </div>

                {currentUser.personType === 'juridica' && (
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                      Razón Social de la Empresa
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {currentUser.businessName}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    {currentUser.personType === 'juridica' ? 'Representante Legal' : 'Nombres Completos'}
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {currentUser.firstName} {currentUser.lastNamePaterno} {currentUser.lastNameMaterno}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Correo Electrónico
                  </span>
                  <p className="text-sm font-medium text-slate-800">
                    {currentUser.email || 'No especificado'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Teléfono Celular
                  </span>
                  <p className="text-sm font-mono font-medium text-slate-800">
                    {currentUser.phone || 'No especificado'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Nombre de Usuario del Sistema
                  </span>
                  <p className="text-sm font-mono font-bold text-purple-700">
                    @{currentUser.username}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Límite Asignado en MB
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {Math.round(quotaBytes / (1024 * 1024))} MB
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Último Ingreso
                  </span>
                  <p className="text-sm font-mono font-semibold text-slate-900">
                    {currentUser.lastLoginAt ? formatDate(currentUser.lastLoginAt, true) : 'Sesión iniciada recientemente'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                    Fecha de Creación
                  </span>
                  <p className="text-sm font-mono text-slate-700">
                    {formatDate(currentUser.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LÍNEA DE HISTORIA (TIMELINE) */}
        {profileTab === 'historial' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6 animate-in fade-in duration-100">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600" />
                  <span>Línea de Historia y Trazabilidad del Usuario</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro cronológico de cambios de tipo de persona (Natural a Jurídica), modificaciones de RUC, cuotas de almacenamiento y accesos.
                </p>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Agregar Hito o Nota</span>
                </button>
              )}
            </div>

            {/* Quick add note form */}
            {isAddingNote && (
              <form onSubmit={handleAddHistoryNote} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Registrar Nota o Suceso en la Línea de Historia
                </label>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="ej. Se validó constancia de RUC activo en SUNAT para trámite ambiental..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white outline-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer shadow-xs"
                  >
                    Guardar en Historial
                  </button>
                </div>
              </form>
            )}

            {/* Vertical Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {userHistory.map((item, idx) => {
                const isTipoPersona = item.tag === 'tipo_persona';
                const isCuota = item.tag === 'cuota';
                const isCreacion = item.tag === 'creacion';
                const isVigencia = item.tag === 'vigencia';

                return (
                  <div key={item.id || idx} className="relative group">
                    {/* Node circle */}
                    <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                      isTipoPersona
                        ? 'bg-amber-500 text-white'
                        : isCuota
                        ? 'bg-blue-600 text-white'
                        : isCreacion
                        ? 'bg-purple-600 text-white'
                        : isVigencia
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}>
                      {isTipoPersona ? (
                        <Building2 className="w-3 h-3" />
                      ) : isCuota ? (
                        <HardDrive className="w-3 h-3" />
                      ) : isCreacion ? (
                        <UserIcon className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>

                    {/* Timeline Event Content Card */}
                    <div className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl border border-slate-200/90 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {item.action}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            isTipoPersona
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : isCuota
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : isCreacion
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'bg-slate-200 text-slate-800'
                          }`}>
                            {isTipoPersona ? 'Cambio Tipo Persona' : isCuota ? 'Cuota MB' : isCreacion ? 'Registro' : 'Modificación'}
                          </span>
                        </div>

                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {item.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed mt-1">
                        {item.detail}
                      </p>

                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Registrado por: <strong>@{item.author}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
