import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  Plus, Edit3, Trash2, GripVertical, ToggleLeft, ToggleRight, 
  AlertTriangle, Info, ChevronDown, ChevronUp, ArrowUpDown
} from 'lucide-react';
import { actionMapping, protocolMapping } from '../utils/conceptMapping';
import { FirewallRule } from '../types';

export const FirewallRules: React.FC = () => {
  const { 
    firewallRules, toggleRuleEnabled, deleteRule, 
    setSelectedRule, setShowRuleEditor, setViewMode,
    reorderRules
  } = useAppStore();
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleEdit = (rule: FirewallRule) => {
    setSelectedRule(rule);
    setShowRuleEditor(true);
  };

  const handleDelete = async (ruleId: string) => {
    await deleteRule(ruleId);
    setConfirmDelete(null);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorderRules(dragIndex, index);
      setDragIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Firewall Rules</h1>
          <p className="text-gray-400 text-sm">
            Manage rules in Meraki-style format • Drag to reorder (rules process top-to-bottom)
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedRule(null);
            setShowRuleEditor(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Meraki Info Banner */}
      <div className="mb-6 p-4 bg-[#1e2436] border border-[#2a3040] rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium mb-1">How this maps to Meraki</p>
            <p className="text-gray-400 text-sm">
              In Meraki, these would appear under <strong className="text-gray-300">Security Appliance → Firewall → L3 Firewall Rules</strong>. 
              Each rule here is evaluated top-to-bottom (first match wins). 
              UniFi's <span className="text-cyan-300">Accept</span> = Meraki's <span className="text-green-300">Allow</span>, 
              UniFi's <span className="text-cyan-300">Drop</span> = Meraki's <span className="text-red-300">Deny</span> (silent).
            </p>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {firewallRules.map((rule, index) => (
          <div
            key={rule.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`bg-[#1e2436] border rounded-xl transition-all ${
              dragIndex === index 
                ? 'border-blue-500 opacity-50' 
                : 'border-[#2a3040] hover:border-[#3a4060]'
            } ${!rule.enabled ? 'opacity-60' : ''}`}
          >
            {/* Rule Header */}
            <div className="flex items-center gap-3 p-4">
              {/* Drag Handle */}
              <div className="cursor-grab text-gray-500 hover:text-gray-300">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Rule Index */}
              <div className="w-8 h-8 bg-[#141824] rounded-lg flex items-center justify-center">
                <span className="text-xs font-mono text-gray-400">{index + 1}</span>
              </div>

              {/* Rule Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-medium ${rule.enabled ? 'text-white' : 'text-gray-500'}`}>
                    {rule.name}
                  </h3>
                  {!rule.enabled && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                      Disabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    rule.action === 'accept' ? 'bg-green-500/20 text-green-300' :
                    rule.action === 'drop' ? 'bg-red-500/20 text-red-300' :
                    'bg-orange-500/20 text-orange-300'
                  }`}>
                    {actionMapping[rule.action]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {protocolMapping[rule.protocol]}
                  </span>
                  {rule.logging && (
                    <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">
                      📝 Logging
                    </span>
                  )}
                  {rule.state && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                      State: {rule.state}
                    </span>
                  )}
                </div>
              </div>

              {/* Meraki Equivalent Badge */}
              <div className="hidden lg:block text-right">
                <span className="text-xs text-gray-500">Meraki: </span>
                <span className="text-xs text-gray-400">
                  {rule.action === 'accept' ? '✅ Allow' : '🚫 Deny'}
                  {rule.protocol !== 'all' ? ` (${rule.protocol.toUpperCase()})` : ''}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleRuleEnabled(rule.id)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-5 h-5 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(rule)}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                  title="Edit rule"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(rule.id)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {expandedRule === rule.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedRule === rule.id && (
              <div className="px-4 pb-4 pt-0 border-t border-[#2a3040]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Source */}
                  <div className="bg-[#141824] rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      Source (Meraki: "Source")
                    </h4>
                    <div className="space-y-1">
                      {rule.srcAddresses.length > 0 && (
                        <p className="text-sm text-white">
                          <span className="text-gray-400">IPs: </span>
                          {rule.srcAddresses.join(', ')}
                        </p>
                      )}
                      {rule.srcPorts.length > 0 && (
                        <p className="text-sm text-white">
                          <span className="text-gray-400">Ports: </span>
                          {rule.srcPorts.join(', ')}
                        </p>
                      )}
                      {rule.srcAddresses.length === 0 && rule.srcPorts.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Any (= Meraki "Any")</p>
                      )}
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="bg-[#141824] rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                      Destination (Meraki: "Destination")
                    </h4>
                    <div className="space-y-1">
                      {rule.dstAddresses.length > 0 && (
                        <p className="text-sm text-white">
                          <span className="text-gray-400">IPs: </span>
                          {rule.dstAddresses.join(', ')}
                        </p>
                      )}
                      {rule.dstPorts.length > 0 && (
                        <p className="text-sm text-white">
                          <span className="text-gray-400">Ports: </span>
                          {rule.dstPorts.join(', ')}
                        </p>
                      )}
                      {rule.dstAddresses.length === 0 && rule.dstPorts.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Any (= Meraki "Any")</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-300">
                    💡 <strong>Meraki Translation:</strong> This rule would be written in Meraki as: 
                    {' '}{rule.action === 'accept' ? 'Allow' : 'Deny'} 
                    {' '}{rule.protocol !== 'all' ? rule.protocol.toUpperCase() + ' ' : ''}
                    traffic from {rule.srcAddresses.length > 0 ? rule.srcAddresses.join(', ') : 'Any'}
                    {rule.srcPorts.length > 0 ? ` (ports: ${rule.srcPorts.join(', ')})` : ''}
                    {' '}to {rule.dstAddresses.length > 0 ? rule.dstAddresses.join(', ') : 'Any'}
                    {rule.dstPorts.length > 0 ? ` (ports: ${rule.dstPorts.join(', ')})` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Delete Confirmation */}
            {confirmDelete === rule.id && (
              <div className="px-4 pb-4 border-t border-red-500/30">
                <div className="flex items-center justify-between mt-3 p-3 bg-red-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-300">Delete "{rule.name}"?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {firewallRules.length === 0 && (
        <div className="text-center py-12">
          <ArrowUpDown className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No Firewall Rules</h3>
          <p className="text-gray-400 text-sm mb-4">
            Create your first firewall rule or connect to a UniFi controller.
          </p>
          <button
            onClick={() => {
              setSelectedRule(null);
              setShowRuleEditor(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create First Rule
          </button>
        </div>
      )}

      {/* Bottom Info */}
      <div className="mt-6 p-4 bg-[#1e2436] border border-[#2a3040] rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-medium mb-1">Rule Order Matters</p>
            <p className="text-gray-400 text-sm">
              Just like Meraki, UniFi processes rules from top to bottom. The first matching rule wins. 
              Drag rules to reorder them. In Meraki, this is controlled by the "Order" column. 
              Note: UniFi has implicit "allow all" at the end for LAN→WAN, but explicit "deny all" for WAN→LAN.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
