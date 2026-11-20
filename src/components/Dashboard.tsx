import React from 'react';
import { useAppStore } from '../store';
import { 
  Shield, ShieldAlert, ShieldCheck, ShieldOff, TrendingUp, 
  AlertTriangle, Network, Globe, Lock
} from 'lucide-react';
import { actionMapping, protocolMapping } from '../utils/conceptMapping';

export const Dashboard: React.FC = () => {
  const { firewallRules, networks, firewallGroups, setViewMode } = useAppStore();

  const enabledRules = firewallRules.filter(r => r.enabled);
  const disabledRules = firewallRules.filter(r => !r.enabled);
  const allowRules = firewallRules.filter(r => r.action === 'accept' && r.enabled);
  const denyRules = firewallRules.filter(r => (r.action === 'drop' || r.action === 'reject') && r.enabled);
  const loggedRules = firewallRules.filter(r => r.logging && r.enabled);

  const stats = [
    {
      label: 'Total Rules',
      value: firewallRules.length,
      icon: Shield,
      color: 'blue',
      merakiNote: 'Like "L3 Firewall Rules" count in Meraki',
    },
    {
      label: 'Active Rules',
      value: enabledRules.length,
      icon: ShieldCheck,
      color: 'green',
      merakiNote: 'Enabled rules (Meraki: checked checkbox)',
    },
    {
      label: 'Allow Rules',
      value: allowRules.length,
      icon: ShieldAlert,
      color: 'cyan',
      merakiNote: 'Equivalent to Meraki "Allow" action',
    },
    {
      label: 'Deny Rules',
      value: denyRules.length,
      icon: ShieldOff,
      color: 'red',
      merakiNote: 'Equivalent to Meraki "Deny" action',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Firewall Dashboard</h1>
        <p className="text-gray-400">
          Overview of your UniFi firewall rules, presented in a Meraki-style format.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <div
              key={stat.label}
              className={`bg-[#1e2436] rounded-xl border border-[#2a3040] p-5 hover:border-[#3a4060] transition-colors`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <span className={`text-2xl font-bold ${colors.text}`}>{stat.value}</span>
              </div>
              <p className="text-white font-medium text-sm">{stat.label}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.merakiNote}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Networks */}
        <div className="bg-[#1e2436] rounded-xl border border-[#2a3040] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">Networks (VLANs)</h3>
            <span className="text-xs text-gray-500 ml-auto">= Meraki "Subnets"</span>
          </div>
          <div className="space-y-2">
            {networks.map((net) => (
              <div key={net._id} className="flex items-center justify-between py-2 px-3 bg-[#141824] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    net.purpose === 'guest' ? 'bg-amber-400' :
                    net.purpose === 'vpn' ? 'bg-purple-400' :
                    'bg-blue-400'
                  }`} />
                  <span className="text-sm text-white">{net.name}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{net.subnet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Firewall Groups */}
        <div className="bg-[#1e2436] rounded-xl border border-[#2a3040] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-medium">Firewall Groups</h3>
            <span className="text-xs text-gray-500 ml-auto">= Meraki "Named Objects"</span>
          </div>
          <div className="space-y-2">
            {firewallGroups.map((group) => (
              <div key={group._id} className="flex items-center justify-between py-2 px-3 bg-[#141824] rounded-lg">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    group.group_type === 'address-group' ? 'bg-blue-500/20 text-blue-300' :
                    group.group_type === 'port-group' ? 'bg-green-500/20 text-green-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {group.group_type.replace('-group', '')}
                  </span>
                  <span className="text-sm text-white">{group.name}</span>
                </div>
                <span className="text-xs text-gray-400">{group.group_members.length} members</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rule Summary Table */}
      <div className="bg-[#1e2436] rounded-xl border border-[#2a3040] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-medium">Rule Summary</h3>
          </div>
          <button
            onClick={() => setViewMode('rules')}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All Rules →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3040]">
                <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">#</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Rule Name</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Action</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Protocol</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Meraki Equivalent</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {firewallRules.slice(0, 5).map((rule, i) => (
                <tr key={rule.id} className="border-b border-[#2a3040]/50 hover:bg-[#252b3d] transition-colors">
                  <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="py-2.5 px-3 text-white font-medium">{rule.name}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      rule.action === 'accept' ? 'bg-green-500/20 text-green-300' :
                      rule.action === 'drop' ? 'bg-red-500/20 text-red-300' :
                      'bg-orange-500/20 text-orange-300'
                    }`}>
                      {actionMapping[rule.action] || rule.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">{protocolMapping[rule.protocol] || rule.protocol}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs text-gray-400 italic">
                      {rule.action === 'accept' ? 'Allow rule' : 'Deny rule'} 
                      {rule.protocol !== 'all' ? ` (${rule.protocol.toUpperCase()})` : ''}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {rule.enabled ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                        Disabled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {firewallRules.length > 5 && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Showing 5 of {firewallRules.length} rules
          </p>
        )}
      </div>

      {/* Meraki Comparison Tip */}
      <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-300 text-sm font-medium mb-1">Meraki Comparison</p>
            <p className="text-gray-400 text-sm">
              In Meraki, you'd see these same rules under <strong className="text-gray-300">Security Appliance → Firewall → L3 Firewall Rules</strong>. 
              The main differences: UniFi uses "Accept/Drop/Reject" instead of "Allow/Deny", 
              and UniFi separates WAN rules from LAN rules while Meraki combines them with direction indicators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
