import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FirewallRules } from './components/FirewallRules';
import { RuleEditor } from './components/RuleEditor';
import { ConceptGuide } from './components/ConceptGuide';
import { ConnectionSetup } from './components/ConnectionSetup';
import { LoginPage } from './components/LoginPage';
import { UserManagement } from './components/UserManagement';
import { useAppStore } from './store';
import { useAuthStore } from './store/authStore';

const App: React.FC = () => {
  const { viewMode } = useAppStore();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141824] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return <Dashboard />;
      case 'rules':
        return <FirewallRules />;
      case 'guide':
        return <ConceptGuide />;
      case 'setup':
        return <ConnectionSetup />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#141824]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
      <RuleEditor />
    </div>
  );
};

export default App;
