import React, { useState } from 'react';
import { conceptMappings } from '../utils/conceptMapping';
import { BookOpen, ArrowRight, Search, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

export const ConceptGuide: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const filteredMappings = conceptMappings.filter(m =>
    m.merakiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.unifiField.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Meraki ↔ UniFi Concept Guide</h1>
        <p className="text-gray-400">
          Understand how Meraki firewall concepts map to UniFi. This guide helps you translate your Meraki knowledge to UniFi.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search concepts (e.g., 'allow', 'port', 'logging')..."
            className="w-full bg-[#1e2436] border border-[#2a3040] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Key Differences Summary */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Key Differences: Meraki vs UniFi Firewalls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#141824]/80 rounded-lg p-4">
            <h3 className="text-cyan-300 text-sm font-medium mb-2">🏢 Where to Find Rules</h3>
            <p className="text-gray-300 text-sm">
              <strong>Meraki:</strong> Security Appliance → Firewall → L3 Rules<br/>
              <strong>UniFi:</strong> Settings → Security → Firewall (or Traffic Rules in newer UI)
            </p>
          </div>
          <div className="bg-[#141824]/80 rounded-lg p-4">
            <h3 className="text-cyan-300 text-sm font-medium mb-2">📋 Rule Structure</h3>
            <p className="text-gray-300 text-sm">
              <strong>Meraki:</strong> Single list with direction (LAN→WAN, WAN→LAN)<br/>
              <strong>UniFi:</strong> Separate sections for Internet/WAN, LAN, and rules are direction-agnostic (based on src/dst)
            </p>
          </div>
          <div className="bg-[#141824]/80 rounded-lg p-4">
            <h3 className="text-cyan-300 text-sm font-medium mb-2">🔀 Rule Actions</h3>
            <p className="text-gray-300 text-sm">
              <strong>Meraki:</strong> Allow, Deny<br/>
              <strong>UniFi:</strong> Accept, Drop (silent deny), Reject (deny with response)
            </p>
          </div>
          <div className="bg-[#141824]/80 rounded-lg p-4">
            <h3 className="text-cyan-300 text-sm font-medium mb-2">🌐 Default Behavior</h3>
            <p className="text-gray-300 text-sm">
              <strong>Meraki:</strong> Default deny inbound, allow outbound<br/>
              <strong>UniFi:</strong> Default allow all LAN→WAN, default deny WAN→LAN. Has implicit rules you can't see.
            </p>
          </div>
          <div className="bg-[#141824]/80 rounded-lg p-4">
            <h3 className="text-cyan-300 text-sm font-medium mb-2">📦 Objects/Groups</h3>
            <p className="text-gray-300 text-sm">
              <strong>Meraki:</strong> Named objects (inline definition)<br/>
              <strong>UniFi:</strong> Firewall Groups (Address Groups, Port Groups, Network Groups) - reusable objects
            </p>
          </div>
          <div className="bg-[#141824]/80 rounded-lg p-4">
            <h3 className="text-cyan-300 text-sm font-medium mb-2">🔒 Stateful Inspection</h3>
            <p className="text-gray-300 text-sm">
              <strong>Meraki:</strong> Automatic stateful inspection<br/>
              <strong>UniFi:</strong> Explicit state matching (new, established, related) - more granular control
            </p>
          </div>
        </div>
      </div>

      {/* Concept Mapping Table */}
      <div className="bg-[#1e2436] rounded-xl border border-[#2a3040] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a3040]">
          <h2 className="text-white font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Detailed Concept Mapping
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Click any row to see detailed explanation and translation notes
          </p>
        </div>

        <div className="divide-y divide-[#2a3040]">
          {filteredMappings.map((mapping, index) => (
            <div key={index} className="group">
              <button
                onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-[#252b3d] transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-white">{mapping.merakiName}</span>
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                    <span className="text-sm font-medium text-cyan-300">{mapping.unifiField}</span>
                  </div>
                  <p className="text-xs text-gray-400">{mapping.merakiDescription}</p>
                </div>
                <div className="flex-shrink-0">
                  {expandedItem === index ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedItem === index && (
                <div className="px-6 pb-4">
                  <div className="bg-[#141824] rounded-lg p-4 border border-[#2a3040]">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300">{mapping.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Reference Card */}
      <div className="mt-8 bg-[#1e2436] rounded-xl border border-[#2a3040] p-6">
        <h2 className="text-white font-bold text-lg mb-4">🚀 Quick Translation Cheat Sheet</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a3040]">
                <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">When you think in Meraki...</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium text-xs">...do this in UniFi</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-[#2a3040]/50">
                <td className="py-2.5 px-3">"I need to allow port 443 from internet"</td>
                <td className="py-2.5 px-3 text-cyan-300">Create a WAN In rule: Accept, TCP, Port 443, dest = your server</td>
              </tr>
              <tr className="border-b border-[#2a3040]/50">
                <td className="py-2.5 px-3">"Block this IP from accessing my network"</td>
                <td className="py-2.5 px-3 text-cyan-300">Create rule: Drop, All protocols, source = that IP, any destination</td>
              </tr>
              <tr className="border-b border-[#2a3040]/50">
                <td className="py-2.5 px-3">"Allow VLAN A to talk to VLAN B"</td>
                <td className="py-2.5 px-3 text-cyan-300">Create LAN rule: Accept, All, source = VLAN A subnet, dest = VLAN B subnet</td>
              </tr>
              <tr className="border-b border-[#2a3040]/50">
                <td className="py-2.5 px-3">"Block IoT devices from reaching the internet"</td>
                <td className="py-2.5 px-3 text-cyan-300">Create rule: Drop, All, source = IoT subnet, dest = 0.0.0.0/0 (or "Internet")</td>
              </tr>
              <tr className="border-b border-[#2a3040]/50">
                <td className="py-2.5 px-3">"Set up port forwarding for my web server"</td>
                <td className="py-2.5 px-3 text-cyan-300">Go to Settings → Profiles → Port Forwarding (separate from firewall rules!)</td>
              </tr>
              <tr className="border-b border-[#2a3040]/50">
                <td className="py-2.5 px-3">"I want to log all denied traffic"</td>
                <td className="py-2.5 px-3 text-cyan-300">Enable "Log" toggle on each Drop/Reject rule (no global log-all option)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">"Create a content filter"</td>
                <td className="py-2.5 px-3 text-cyan-300">Settings → Security → DNS Filtering (requires subscription for some features)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-medium mb-2">⚠️ Important Gotchas for Meraki Users</p>
            <ul className="space-y-1.5 text-gray-400 text-sm">
              <li>• UniFi has <strong className="text-gray-300">implicit allow rules</strong> at the end for LAN→Internet that you cannot see or edit</li>
              <li>• <strong className="text-gray-300">Port Forwarding</strong> is a separate feature in UniFi, not part of firewall rules (unlike Meraki where it's an L3 rule)</li>
              <li>• UniFi's <strong className="text-gray-300">"Traffic Rules"</strong> (newer UI) is different from "Firewall Rules" - Traffic Rules are simpler/higher-level</li>
              <li>• The <strong className="text-gray-300">rule order</strong> is critical - drag rules to reorder, just like Meraki's priority system</li>
              <li>• UniFi uses <strong className="text-gray-300">Firewall Groups</strong> as reusable objects - create them once, reference in multiple rules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
