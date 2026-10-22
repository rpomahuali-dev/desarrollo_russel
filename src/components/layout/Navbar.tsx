import React from 'react';
import { useApp } from '../../context/AppContext';
import { checkUserAccessStatus, formatBytes, formatDate } from '../../utils/validation';
import {
  FolderTree,
  Users,
  AlertTriangle,
  BarChart3,
  Trash2,
  HardDrive,
  History,
  Clock,
  Lock,
  LogOut,
  UserCircle
} from 'lucide-react';

export type ActiveTab = 'explorer' | 'profile' | 'users' | 'alerts' | 'reports' | 'trash' | 'backups' | 'audit';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, users, trashCases, trashFiles, logout } = useApp();

  // Count alerts (users expiring within 7 days)
  const expiringCount = users.filter(u => {
    if (u.role === 'admin' || u.status === 'inactive') return false;
    const status = checkUserAccessStatus(u);
    return status.daysRemaining <= 7 && status.daysRemaining >= 0;
  }).length;

  const trashCount = trashCases.length + trashFiles.length;

  // Active client validity check
  const activeUserStatus = checkUserAccessStatus(currentUser);

  return (
    <header className="sticky top-0 z-40 select-none shadow-2xs">
      {/* Expiration warning banner if active user access is near or expired */}
      {currentUser.role === 'client' && (
        <div className={`px-6 py-1.5 text-xs font-medium flex items-center justify-between border-b ${
          !activeUserStatus.isAllowed
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : activeUserStatus.daysRemaining <= 7
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {!activeUserStatus.isAllowed ? (
              <Lock className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>
              <strong>Vigencia de cuenta:</strong> {formatDate(currentUser.validFrom)} al {formatDate(currentUser.validUntil)}
              {' · '}
              {activeUserStatus.daysRemaining === 0 ? (
                <span className="font-semibold text-rose-600">Acceso Vencido</span>
              ) : (
                <span>Vence en <strong className="tabular-nums">{activeUserStatus.daysRemaining} días</strong></span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span>
              Almacenamiento:{' '}
              <strong className="tabular-nums">{formatBytes(currentUser.usedStorageBytes)}</strong> de{' '}
              <strong className="tabular-nums">{formatBytes(currentUser.storageQuotaBytes)}</strong>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">
              Modo Cliente: Subida de archivos y creación de carpetas habilitada.
            </span>
          </div>
        </div>
      )}

      {/* Row 1: Brand Wordmark on Executive Navy Bar */}
      <div className="flex items-center justify-between gap-4 px-6 py-2.5 bg-[#103b66] border-b border-[#0e3154] text-white">
        {/* Brand Wordmark - "Administrador de archivos" */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-2xs">
            <FolderTree className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
              Administrador de archivos
            </span>
            <p className="text-[11px] text-blue-100/75 leading-tight">
              Plataforma de Expedientes, Planos y Documentación Técnica
            </p>
          </div>
        </div>

        {/* Right side: Active Logged-in User Profile display only + Logout button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Active Logged-in User Card */}
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 transition-colors text-left cursor-pointer group"
            title="Ver Mi Ficha / Datos del Usuario"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 ${
              currentUser.role === 'admin'
                ? 'bg-white text-[#103b66]'
                : currentUser.role === 'collaborator'
                ? 'bg-blue-300 text-[#103b66]'
                : 'bg-amber-300 text-amber-950'
            }`}>
              {currentUser.firstName.charAt(0)}{currentUser.lastNamePaterno.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate max-w-[180px]">
                  {currentUser.businessName || `${currentUser.firstName} ${currentUser.lastNamePaterno}`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-blue-100/80">
                <span className="capitalize font-semibold text-blue-200">
                  {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'collaborator' ? 'Colaborador' : 'Cliente'}
                </span>
                <span>·</span>
                <span className="font-mono text-[10px] text-blue-100/90">@{currentUser.username}</span>
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg border border-white/20 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Row 2: Dedicated Navigation Menu Bar */}
      <div className="px-6 py-2 bg-white border-b border-[#d9e2ec]">
        <nav className="flex items-center gap-2 flex-wrap text-xs font-medium">
          {/* TAB 1: Archivos y Carpetas */}
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-xs font-semibold ${
              activeTab === 'explorer'
                ? 'bg-[#133e66] text-white shadow-2xs'
                : 'bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec]'
            }`}
            title="Explorador de Archivos y Carpetas"
          >
            <FolderTree className={`w-4 h-4 ${activeTab === 'explorer' ? 'text-white' : 'text-[#133e66]'}`} />
            <span>Archivos y Carpetas</span>
          </button>

          {/* TAB 2: Mi Ficha / Datos */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-xs font-semibold ${
              activeTab === 'profile'
                ? 'bg-[#133e66] text-white shadow-2xs'
                : 'bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec]'
            }`}
            title="Ver mis datos y línea de historia"
          >
            <UserCircle className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-[#133e66]'}`} />
            <span>Mi Ficha / Datos</span>
          </button>

          {/* Opciones EXCLUSIVAS de Administrador */}
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-xs font-semibold ${
                  activeTab === 'users'
                    ? 'bg-[#133e66] text-white shadow-2xs'
                    : 'bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec]'
                }`}
                title="Gestión de Mineros y Usuarios"
              >
                <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-white' : 'text-[#133e66]'}`} />
                <span>Gestión de Usuarios</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-xs font-semibold ${
                  activeTab === 'alerts'
                    ? 'bg-[#133e66] text-white shadow-2xs'
                    : 'bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec]'
                }`}
                title="Alertas de Vencimiento de Acceso"
              >
                <AlertTriangle className={`w-4 h-4 ${activeTab === 'alerts' ? 'text-white' : 'text-amber-600'}`} />
                <span>Alertas de Vencimiento</span>
                {expiringCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold tabular-nums">
                    {expiringCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-xs font-semibold ${
                  activeTab === 'reports'
                    ? 'bg-[#133e66] text-white shadow-2xs'
                    : 'bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec]'
                }`}
                title="Reporte de Consumo de Cuotas"
              >
                <BarChart3 className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-emerald-700'}`} />
                <span>Consumo de Cuotas</span>
              </button>

              <button
                onClick={() => setActiveTab('trash')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-xs font-semibold ${
                  activeTab === 'trash'
                    ? 'bg-[#133e66] text-white shadow-2xs'
                    : 'bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec]'
                }`}
                title="Papelera de Reciclaje (Exclusiva para Administrador)"
              >
                <Trash2 className={`w-4 h-4 ${activeTab === 'trash' ? 'text-white' : 'text-[#9e1c1c]'}`} />
                <span>Papelera</span>
                {trashCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold tabular-nums border border-rose-200">
                    {trashCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('backups')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-xs font-semibold ${
                  activeTab === 'backups'
                    ? 'bg-[#133e66] text-white shadow-2xs'
                    : 'bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec]'
                }`}
                title="Respaldos y Copias de Seguridad"
              >
                <HardDrive className={`w-4 h-4 ${activeTab === 'backups' ? 'text-white' : 'text-[#133e66]'}`} />
                <span>Respaldos</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer text-xs font-semibold ${
                  activeTab === 'audit'
                    ? 'bg-[#133e66] text-white shadow-2xs'
                    : 'bg-[#f0f4f8] hover:bg-[#e2e8f0] text-[#102a43] border border-[#d9e2ec]'
                }`}
                title="Bitácora de Auditoría y Trazabilidad"
              >
                <History className={`w-4 h-4 ${activeTab === 'audit' ? 'text-white' : 'text-[#133e66]'}`} />
                <span>Auditoría</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
