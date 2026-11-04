import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  Server, Globe, Key, Lock, AlertTriangle, CheckCircle2, 
  ArrowRight, Info, Shield
} from 'lucide-react';

export const ConnectionSetup: React.FC = () => {
  const { connection, setConnection, connect, disconnect, useDemo, setUseDemo, loading } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [connectError, setConnectError] = useState('');

  const handleConnect = async () => {
    setConnectError('');
    const success = await connect();
    if (!success) {
      setConnectError('Failed to connect. Check your credentials and ensure CORS is enabled on your controller.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Connection Setup</h1>
        <p className="text-gray-400">
          Connect to your UniFi Network Controller to manage firewall rules with a familiar Meraki-style interface.
        </p>
      </div>

      {/* Demo Mode Toggle */}
      <div className="bg-[#1e2436] rounded-xl border border-[#2a3040] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Demo Mode</h3>
              <p className="text-gray-400 text-sm">Explore the interface with sample firewall rules</p>
            </div>
          </div>
          <button
            onClick={() => setUseDemo(!useDemo)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              useDemo ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              useDemo ? 'translate-x-6.5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Connection Form */}
      <div className="bg-[#1e2436] rounded-xl border border-[#2a3040] p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">UniFi Controller Connection</h3>
            <p className="text-gray-400 text-sm">Enter your UniFi Network Controller details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Controller URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              <Globe className="w-3.5 h-3.5 inline mr-1.5" />
              Controller URL
            </label>
            <input
              type="url"
              value={connection.controllerUrl}
              onChange={(e) => setConnection({ controllerUrl: e.target.value })}
              placeholder="https://192.168.1.1 or https://unifi.yourdomain.com"
              className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Include the protocol (https://). For UDM Pro, use the device IP or hostname.
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              <Key className="w-3.5 h-3.5 inline mr-1.5" />
              Username
            </label>
            <input
              type="text"
              value={connection.username}
              onChange={(e) => setConnection({ username: e.target.value })}
              placeholder="admin"
              className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              <Lock className="w-3.5 h-3.5 inline mr-1.5" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={connection.password}
                onChange={(e) => setConnection({ password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Site */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Site Name
            </label>
            <input
              type="text"
              value={connection.site}
              onChange={(e) => setConnection({ site: e.target.value })}
              placeholder="default"
              className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Usually "default" unless you have multiple sites.</p>
          </div>
        </div>

        {/* Connect Button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleConnect}
            disabled={loading || !connection.controllerUrl || !connection.password}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {connection.isConnected ? 'Reconnect' : 'Connect'}
          </button>

          {connection.isConnected && (
            <button
              onClick={disconnect}
              className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
            >
              Disconnect
            </button>
          )}

          {connection.isConnected && (
            <span className="flex items-center gap-1.5 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Connected
            </span>
          )}
        </div>

        {connectError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{connectError}</p>
          </div>
        )}
      </div>

      {/* CORS Info */}
      <div className="bg-[#1e2436] rounded-xl border border-[#2a3040] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Info className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Important: CORS Configuration</h3>
            <p className="text-gray-400 text-sm">Browser security restrictions may prevent direct connections</p>
          </div>
        </div>

        <div className="bg-[#141824] rounded-lg p-4 border border-[#2a3040]">
          <p className="text-gray-300 text-sm mb-3">
            UniFi controllers don't allow cross-origin requests by default. To connect directly from this tool, you need one of:
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">1.</span>
              <span>Enable CORS on your UDM Pro by SSHing in and adding headers to the nginx config</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Use a reverse proxy (nginx/Caddy) with CORS headers enabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Run this tool locally on the same network with a browser extension to disable CORS</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">4.</span>
              <span>Use Demo Mode to explore the interface and understand the Meraki ↔ UniFi mapping</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>Tip:</strong> Even in Demo Mode, you can learn how each UniFi firewall concept maps to Meraki. 
            Use the Concept Guide to understand the differences.
          </p>
        </div>
      </div>
    </div>
  );
};
