import React from 'react';
import { useAppStore } from '../store';
import { 
  Shield, LayoutDashboard, List, BookOpen, Settings, 
  Wifi, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { viewMode, setViewMode, connection, useDemo } = useAppStore();

  const navItems = [
    { id: 'dashboard' as const, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'rules' as const, icon: List, label: 'Firewall Rules' },
    { id: 'guide' as const, icon: BookOpen, label: 'Concept Guide' },
    { id: 'setup' as const, icon: Settings, label: 'Connection' },
  ];

  return (
    <div className="w-64 bg-[#1a1f2e] min-h-screen flex flex-col border-r border-[#2a3040]">
      {/* Logo */}
      <div className="p-5 border-b border-[#2a3040]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">UniFi Firewall</h1>
            <p className="text-gray-400 text-xs">Meraki-Style Manager</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="p-4 border-b border-[#2a3040]">
        <div className="flex items-center gap-2">
          {connection.isConnected || useDemo ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs text-gray-300">
            {useDemo ? 'Demo Mode' : connection.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {connection.isConnected && (
          <p className="text-xs text-gray-500 mt-1 ml-6 truncate">
            {connection.controllerUrl}
          </p>
        )}
        {useDemo && (
          <p className="text-xs text-amber-400 mt-1 ml-6 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Using sample data
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = viewMode === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setViewMode(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-[#252b3d] hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#2a3040]">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Wifi className="w-3 h-3" />
          <span>UniFi → Meraki Bridge v1.0</span>
        </div>
      </div>
    </div>
  );
};
