import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { X, Save, Info, AlertTriangle } from 'lucide-react';
import { FirewallRule } from '../types';
import { actionMapping, protocolMapping } from '../utils/conceptMapping';

export const RuleEditor: React.FC = () => {
  const { 
    selectedRule, showRuleEditor, setShowRuleEditor, 
    updateRule, createRule, setSelectedRule 
  } = useAppStore();

  const [formData, setFormData] = useState<Partial<FirewallRule>>({
    name: '',
    enabled: true,
    action: 'accept',
    protocol: 'all',
    logging: false,
    state: '',
    srcAddresses: [''],
    dstAddresses: [''],
    srcPorts: [''],
    dstPorts: [''],
    ipType: 'ipv4',
    matchingTarget: '',
  });

  useEffect(() => {
    if (selectedRule) {
      setFormData({
        name: selectedRule.name,
        enabled: selectedRule.enabled,
        action: selectedRule.action,
        protocol: selectedRule.protocol,
        logging: selectedRule.logging,
        state: selectedRule.state,
        srcAddresses: selectedRule.srcAddresses.length > 0 ? selectedRule.srcAddresses : [''],
        dstAddresses: selectedRule.dstAddresses.length > 0 ? selectedRule.dstAddresses : [''],
        srcPorts: selectedRule.srcPorts.length > 0 ? selectedRule.srcPorts : [''],
        dstPorts: selectedRule.dstPorts.length > 0 ? selectedRule.dstPorts : [''],
        ipType: selectedRule.ipType,
        matchingTarget: selectedRule.matchingTarget,
      });
    } else {
      setFormData({
        name: '',
        enabled: true,
        action: 'accept',
        protocol: 'all',
        logging: false,
        state: '',
        srcAddresses: [''],
        dstAddresses: [''],
        srcPorts: [''],
        dstPorts: [''],
        ipType: 'ipv4',
        matchingTarget: '',
      });
    }
  }, [selectedRule, showRuleEditor]);

  const handleClose = () => {
    setShowRuleEditor(false);
    setSelectedRule(null);
  };

  const handleSave = async () => {
    // Clean up empty strings from arrays
    const cleanData = {
      ...formData,
      srcAddresses: (formData.srcAddresses || []).filter(a => a.trim() !== ''),
      dstAddresses: (formData.dstAddresses || []).filter(a => a.trim() !== ''),
      srcPorts: (formData.srcPorts || []).filter(p => p.trim() !== ''),
      dstPorts: (formData.dstPorts || []).filter(p => p.trim() !== ''),
    };

    if (selectedRule) {
      await updateRule(selectedRule.id, cleanData);
    } else {
      await createRule(cleanData);
    }
    handleClose();
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    const arr = (formData as any)[field] || [''];
    const newArr = [...arr];
    newArr[index] = value;
    setFormData({ ...formData, [field]: newArr });
  };

  const addArrayItem = (field: string) => {
    const arr = (formData as any)[field] || [];
    setFormData({ ...formData, [field]: [...arr, ''] });
  };

  const removeArrayItem = (field: string, index: number) => {
    const arr: string[] = (formData as any)[field] || [];
    if (arr.length <= 1) {
      setFormData({ ...formData, [field]: [''] });
    } else {
      setFormData({ ...formData, [field]: arr.filter((_: string, i: number) => i !== index) });
    }
  };

  if (!showRuleEditor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1f2e] border-b border-[#2a3040] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-white">
              {selectedRule ? 'Edit Firewall Rule' : 'Create Firewall Rule'}
            </h2>
            <p className="text-sm text-gray-400">
              {selectedRule ? 'Modify the rule below' : 'Configure a new rule (same as Meraki L3 rule)'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#252b3d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Rule Name
                <span className="text-xs text-gray-500 ml-2">(Meraki: "Comment")</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Allow DNS Traffic"
                className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                IP Version
              </label>
              <select
                value={formData.ipType || 'ipv4'}
                onChange={(e) => setFormData({ ...formData, ipType: e.target.value as any })}
                className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="ipv4">IPv4</option>
                <option value="ipv6">IPv6</option>
                <option value="ipv4_ipv6">IPv4 + IPv6</option>
              </select>
            </div>
          </div>

          {/* Action & Protocol */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Action
                <span className="text-xs text-gray-500 ml-2">(Meraki: Allow/Deny)</span>
              </label>
              <select
                value={formData.action || 'accept'}
                onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="accept">Accept (= Allow)</option>
                <option value="drop">Drop (= Deny, silent)</option>
                <option value="reject">Reject (= Deny, with response)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Protocol
                <span className="text-xs text-gray-500 ml-2">(Meraki: "Protocol")</span>
              </label>
              <select
                value={formData.protocol || 'all'}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value as any })}
                className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Protocols</option>
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="tcp_udp">TCP + UDP</option>
                <option value="icmp">ICMP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Connection State
                <span className="text-xs text-gray-500 ml-2">(Meraki: N/A)</span>
              </label>
              <select
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value as FirewallRule['state'] })}
                className="w-full bg-[#141824] border border-[#2a3040] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Any State</option>
                <option value="new">New</option>
                <option value="established">Established</option>
                <option value="related">Related</option>
                <option value="invalid">Invalid</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                UniFi-specific: stateful packet inspection
              </p>
            </div>
          </div>

          {/* Source */}
          <div className="bg-[#141824] rounded-xl p-4 border border-[#2a3040]">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              Source
              <span className="text-xs text-gray-500">(Meraki: "Source" field)</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Source IP Addresses / Subnets</label>
                {(formData.srcAddresses || ['']).map((addr, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={addr}
                      onChange={(e) => updateArrayField('srcAddresses', i, e.target.value)}
                      placeholder="e.g., 192.168.1.0/24 or 10.0.0.5"
                      className="flex-1 bg-[#1a1f2e] border border-[#2a3040] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeArrayItem('srcAddresses', i)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('srcAddresses')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                >
                  + Add address
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Source Ports (leave empty for any)</label>
                {(formData.srcPorts || ['']).map((port, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={port}
                      onChange={(e) => updateArrayField('srcPorts', i, e.target.value)}
                      placeholder="e.g., 80 or 1024-65535"
                      className="flex-1 bg-[#1a1f2e] border border-[#2a3040] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeArrayItem('srcPorts', i)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('srcPorts')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                >
                  + Add port
                </button>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="bg-[#141824] rounded-xl p-4 border border-[#2a3040]">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              Destination
              <span className="text-xs text-gray-500">(Meraki: "Destination" field)</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Destination IP Addresses / Subnets</label>
                {(formData.dstAddresses || ['']).map((addr, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={addr}
                      onChange={(e) => updateArrayField('dstAddresses', i, e.target.value)}
                      placeholder="e.g., 0.0.0.0/0 for any, or specific IP"
                      className="flex-1 bg-[#1a1f2e] border border-[#2a3040] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeArrayItem('dstAddresses', i)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('dstAddresses')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                >
                  + Add address
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Destination Ports (leave empty for any)</label>
                {(formData.dstPorts || ['']).map((port, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={port}
                      onChange={(e) => updateArrayField('dstPorts', i, e.target.value)}
                      placeholder="e.g., 443 or 8000-9000"
                      className="flex-1 bg-[#1a1f2e] border border-[#2a3040] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => removeArrayItem('dstPorts', i)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('dstPorts')}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                >
                  + Add port
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled ?? true}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded bg-[#141824] border-[#2a3040] text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Enabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.logging ?? false}
                onChange={(e) => setFormData({ ...formData, logging: e.target.checked })}
                className="w-4 h-4 rounded bg-[#141824] border-[#2a3040] text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">
                Log matched traffic
                <span className="text-xs text-gray-500 ml-1">(Meraki: "Log" checkbox)</span>
              </span>
            </label>
          </div>

          {/* Preview / Meraki Translation */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm font-medium mb-1">Meraki Equivalent Preview</p>
                <p className="text-gray-300 text-sm">
                  In Meraki, this would be: <strong>{formData.action === 'accept' ? 'Allow' : 'Deny'}</strong>
                  {' '}{(formData.protocol && formData.protocol !== 'all') ? formData.protocol.toUpperCase() : 'any protocol'}
                  {' '}from{' '}
                  <strong>
                    {(formData.srcAddresses || []).filter(a => a.trim()).join(', ') || 'Any'}
                  </strong>
                  {(formData.srcPorts || []).filter(p => p.trim()).length > 0 
                    ? ` (port ${(formData.srcPorts || []).filter(p => p.trim()).join(', ')})` 
                    : ''}
                  {' '}to{' '}
                  <strong>
                    {(formData.dstAddresses || []).filter(a => a.trim()).join(', ') || 'Any'}
                  </strong>
                  {(formData.dstPorts || []).filter(p => p.trim()).length > 0 
                    ? ` (port ${(formData.dstPorts || []).filter(p => p.trim()).join(', ')})` 
                    : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for Drop vs Reject */}
          {formData.action === 'drop' && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-300 text-sm font-medium mb-1">Drop vs Reject</p>
                  <p className="text-gray-400 text-sm">
                    <strong>Drop</strong> silently discards packets (like Meraki "Deny"). 
                    <strong> Reject</strong> sends back a TCP RST or ICMP unreachable (tells sender the connection was refused).
                    In Meraki, "Deny" behaves like UniFi's "Drop".
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1a1f2e] border-t border-[#2a3040] px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.name?.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {selectedRule ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );
};
