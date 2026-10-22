/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { ExplorerView } from './components/explorer/ExplorerView';
import { UsersView } from './components/users/UsersView';
import { AlertasVencimientoView } from './components/alerts/AlertasVencimientoView';
import { ReportesCuotasView } from './components/reports/ReportesCuotasView';
import { PapeleraView } from './components/trash/PapeleraView';
import { RespaldosView } from './components/backups/RespaldosView';
import { AuditoriaView } from './components/audit/AuditoriaView';
import { LoginView } from './components/auth/LoginView';
import { UserProfileView } from './components/profile/UserProfileView';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const { currentUser, isAuthenticated } = useApp();

  // Strict Access: Collaborator and Client only have access to 'explorer' and 'profile'
  React.useEffect(() => {
    if (currentUser.role !== 'admin' && activeTab !== 'explorer' && activeTab !== 'profile') {
      setActiveTab('explorer');
    }
  }, [currentUser.role, activeTab]);

  // If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setActiveTab('profile')} />;
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col text-[#102a43]">
      {/* Top Navbar with brand 'Administrador de archivos' and full visible menus */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'explorer' && (
          <ExplorerView />
        )}

        {activeTab === 'profile' && (
          <UserProfileView
            onGoToExplorer={() => setActiveTab('explorer')}
            onManageUsers={() => setActiveTab('users')}
          />
        )}

        {/* Admin only tabs (Collaborator and Client have NO access to any other option) */}
        {activeTab === 'users' && currentUser.role === 'admin' && (
          <UsersView />
        )}

        {activeTab === 'alerts' && currentUser.role === 'admin' && (
          <AlertasVencimientoView
            onManageUser={() => setActiveTab('users')}
          />
        )}

        {activeTab === 'reports' && currentUser.role === 'admin' && (
          <ReportesCuotasView />
        )}

        {/* Papelera: SOLO PARA EL ADMINISTRADOR */}
        {activeTab === 'trash' && currentUser.role === 'admin' && (
          <PapeleraView />
        )}

        {activeTab === 'backups' && currentUser.role === 'admin' && (
          <RespaldosView />
        )}

        {activeTab === 'audit' && currentUser.role === 'admin' && (
          <AuditoriaView />
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
