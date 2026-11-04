import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FirewallRules } from './components/FirewallRules';
import { RuleEditor } from './components/RuleEditor';
import { ConceptGuide } from './components/ConceptGuide';
import { ConnectionSetup } from './components/ConnectionSetup';
import { useAppStore } from './store';

const App: React.FC = () => {
  const { viewMode } = useAppStore();

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
