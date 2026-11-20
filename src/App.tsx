import React, { useEffect } from 'react';
import { useAppStore } from './store';
import { useAuthStore } from './store/authStore';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FirewallRules } from './components/FirewallRules';
import { ConceptGuide } from './components/ConceptGuide';
import { ConnectionSetup } from './components/ConnectionSetup';
import { RuleEditor } from './components/RuleEditor';
import { UserManagement } from './components/UserManagement';

export default function App() {
  const { viewMode, showRuleEditor, setUseDemo } = useAppStore();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  // Enable demo mode by default for the static build
  useEffect(() => {
    setUseDemo(true);
  }, [setUseDemo]);

  // Try to check auth, but don't block the app if server is unavailable
  useEffect(() => {
    checkAuth().catch(() => {
      // Server not available - that's fine for demo mode
    });
  }, [checkAuth]);

  const renderView = () => {
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
    <div className="min-h-screen bg-[#141824] flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>
      {showRuleEditor && <RuleEditor />}
    </div>
  );
}
