import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { checkUserAccessStatus, formatDate } from '../../utils/validation';
import { AlertTriangle, Clock, Calendar, Check, ExternalLink } from 'lucide-react';

interface AlertasVencimientoViewProps {
  onManageUser?: (userId: string) => void;
}

export const AlertasVencimientoView: React.FC<AlertasVencimientoViewProps> = ({ onManageUser }) => {
  const { users, extendUserValidity } = useApp();
  const [filterDays, setFilterDays] = useState<7 | 15 | 30>(7);
  const [extensionDays, setExtensionDays] = useState<Record<string, number>>({});
  const [extendedSuccess, setExtendedSuccess] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Expiring soon accounts (active, role client/collab, validUntil >= today and <= today + filterDays)
  const expiringAccounts = users.filter(u => {
    if (u.role === 'admin' || u.status === 'inactive') return false;
    const status = checkUserAccessStatus(u);
    return status.daysRemaining >= 0 && status.daysRemaining <= filterDays;
  });

  // 2. Recently expired accounts (validUntil < today within last 30 days or inactive)
  const recentlyExpiredAccounts = users.filter(u => {
    if (u.role === 'admin') return false;
    const until = new Date(u.validUntil);
    const diffDays = Math.round((today.getTime() - until.getTime()) / (1000 * 60 * 60 * 24));
    return (until < today && diffDays <= 30) || (u.status === 'inactive' && until < today);
  });

  const handleExtend = (userId: string) => {
    const daysToAdd = extensionDays[userId] !== undefined ? extensionDays[userId] : 1;
    extendUserValidity(userId, daysToAdd);
    const user = users.find(u => u.id === userId);
    setExtendedSuccess(`Acceso extendido +${daysToAdd} día(s) para @${user?.username || 'usuario'}.`);
    setTimeout(() => setExtendedSuccess(null), 3000);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#f0f4f8] min-h-[calc(100vh-62px)]">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#102a43] tracking-tight">
              Alertas de vencimiento
            </h1>
            <p className="text-xs text-[#486581] mt-1">
              Accesos que vencen en los próximos {filterDays} días y los que vencieron en los últimos 30. Extensión flexible desde un día en adelante.
            </p>
          </div>

          {/* Filter tabs: 7 días, 15 días, 30 días */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f0f4f8] border border-[#d9e2ec] rounded-lg">
            <button
              onClick={() => setFilterDays(7)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterDays === 7 ? 'bg-[#133e66] text-white shadow-2xs' : 'text-[#486581] hover:text-[#102a43]'
              }`}
            >
              7 días
            </button>
            <button
              onClick={() => setFilterDays(15)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterDays === 15 ? 'bg-[#133e66] text-white shadow-2xs' : 'text-[#486581] hover:text-[#102a43]'
              }`}
            >
              15 días
            </button>
            <button
              onClick={() => setFilterDays(30)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                filterDays === 30 ? 'bg-[#133e66] text-white shadow-2xs' : 'text-[#486581] hover:text-[#102a43]'
              }`}
            >
              30 días
            </button>
          </div>
        </div>

        {extendedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
            <span className="font-medium">{extendedSuccess}</span>
            <button onClick={() => setExtendedSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Section 1: Cuentas de usuario por vencer */}
        <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d9e2ec] bg-white">
            <h3 className="font-bold text-base text-[#102a43]">
              Cuentas de usuario por vencer ({expiringAccounts.length})
            </h3>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Vence</th>
                <th className="py-3 px-4">Cuándo</th>
                <th className="py-3 px-4 text-right">Extensión de Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expiringAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-slate-500">
                    No hay cuentas por vencer en los próximos {filterDays} días.
                  </td>
                </tr>
              ) : (
                expiringAccounts.map(u => {
                  const status = checkUserAccessStatus(u);
                  const selectedDays = extensionDays[u.id] !== undefined ? extensionDays[u.id] : 1;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {u.businessName || `${u.firstName} ${u.lastNamePaterno}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {u.role === 'client' ? 'Cliente' : u.role === 'collaborator' ? 'Colaborador' : 'Administrador'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">
                        {formatDate(u.validUntil)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-amber-100 text-amber-900 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-amber-200">
                          {status.daysRemaining === 0 ? 'Vence hoy' : `En ${status.daysRemaining} días`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Extension selector starting from 1 day */}
                          <select
                            value={selectedDays}
                            onChange={(e) => setExtensionDays({ ...extensionDays, [u.id]: Number(e.target.value) })}
                            className="px-2 py-1 border border-slate-300 rounded-md text-xs bg-white text-slate-800 font-semibold"
                          >
                            <option value={1}>+1 día</option>
                            <option value={2}>+2 días</option>
                            <option value={3}>+3 días</option>
                            <option value={7}>+7 días (1 sem.)</option>
                            <option value={15}>+15 días</option>
                            <option value={30}>+30 días (1 mes)</option>
                            <option value={60}>+60 días</option>
                            <option value={90}>+90 días (3 meses)</option>
                            <option value={180}>+180 días (6 meses)</option>
                            <option value={365}>+365 días (1 año)</option>
                          </select>

                          <button
                            onClick={() => handleExtend(u.id)}
                            className="px-3.5 py-1.5 bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Extender
                          </button>

                          <button
                            onClick={() => onManageUser?.(u.id)}
                            className="px-3.5 py-1.5 bg-[#d9e2ec] hover:bg-[#bcccdc] text-[#102a43] rounded-md text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Gestionar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: Cuentas vencidas recientemente */}
        <div className="bg-white rounded-xl border border-[#d9e2ec] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d9e2ec] bg-white">
            <h3 className="font-bold text-base text-[#102a43]">
              Cuentas vencidas recientemente ({recentlyExpiredAccounts.length})
            </h3>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#edf2f7] text-[#102a43] border-b border-[#d9e2ec] font-bold select-none">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Venció</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Extensión de Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {recentlyExpiredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 px-4 text-center text-[#627d98]">
                    No hay cuentas vencidas recientemente.
                  </td>
                </tr>
              ) : (
                recentlyExpiredAccounts.map(u => {
                  const selectedDays = extensionDays[u.id] !== undefined ? extensionDays[u.id] : 1;

                  return (
                    <tr key={u.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[#102a43]">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#102a43]">
                        {u.businessName || `${u.firstName} ${u.lastNamePaterno}`}
                      </td>
                      <td className="py-3 px-4 text-[#486581] capitalize">
                        {u.role === 'client' ? 'Cliente' : 'Colaborador'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#486581] tabular-nums">
                        {formatDate(u.validUntil)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#9e1c1c] bg-rose-50 border border-rose-200 text-[11px] font-semibold px-2 py-0.5 rounded">
                          Vencido
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={selectedDays}
                            onChange={(e) => setExtensionDays({ ...extensionDays, [u.id]: Number(e.target.value) })}
                            className="px-2 py-1 border border-[#cbd5e1] rounded-md text-xs bg-white text-[#102a43] font-semibold"
                          >
                            <option value={1}>+1 día</option>
                            <option value={3}>+3 días</option>
                            <option value={7}>+7 días</option>
                            <option value={15}>+15 días</option>
                            <option value={30}>+30 días</option>
                            <option value={60}>+60 días</option>
                            <option value={90}>+90 días</option>
                            <option value={365}>+365 días</option>
                          </select>

                          <button
                            onClick={() => handleExtend(u.id)}
                            className="px-3.5 py-1.5 bg-[#133e66] hover:bg-[#0e2e4d] text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Reactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
