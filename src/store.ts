import { create } from 'zustand';
import { UniFiConnection, FirewallRule, FirewallGroup, NetworkConfig, ViewMode } from './types';
import { unifiApi, demoFirewallRules, demoFirewallGroups, demoNetworks } from './utils/unifiApi';

interface AppState {
  // Connection
  connection: UniFiConnection;
  setConnection: (conn: Partial<UniFiConnection>) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  useDemo: boolean;
  setUseDemo: (val: boolean) => void;

  // Data
  firewallRules: FirewallRule[];
  firewallGroups: FirewallGroup[];
  networks: NetworkConfig[];
  loading: boolean;
  error: string | null;

  // UI
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedRule: FirewallRule | null;
  setSelectedRule: (rule: FirewallRule | null) => void;
  showRuleEditor: boolean;
  setShowRuleEditor: (show: boolean) => void;
  showConceptTooltip: string | null;
  setShowConceptTooltip: (id: string | null) => void;

  // Actions
  fetchData: () => Promise<void>;
  updateRule: (ruleId: string, updates: Partial<FirewallRule>) => Promise<boolean>;
  deleteRule: (ruleId: string) => Promise<boolean>;
  createRule: (rule: Partial<FirewallRule>) => Promise<boolean>;
  toggleRuleEnabled: (ruleId: string) => Promise<void>;
  reorderRules: (fromIndex: number, toIndex: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Connection defaults
  connection: {
    controllerUrl: 'https://192.168.1.1',
    username: 'admin',
    password: '',
    site: 'default',
    isConnected: false,
  },
  setConnection: (conn) => set((state) => ({
    connection: { ...state.connection, ...conn }
  })),

  connect: async () => {
    const { connection } = get();
    unifiApi.setConnection(connection);
    const success = await unifiApi.authenticate(connection.username, connection.password);
    if (success) {
      set((state) => ({
        connection: { ...state.connection, isConnected: true }
      }));
      await get().fetchData();
    }
    return success;
  },

  disconnect: () => {
    set((state) => ({
      connection: { ...state.connection, isConnected: false },
      firewallRules: [],
      firewallGroups: [],
      networks: [],
    }));
  },

  useDemo: true,
  setUseDemo: (val) => set({ useDemo: val }),

  // Data defaults
  firewallRules: demoFirewallRules,
  firewallGroups: demoFirewallGroups,
  networks: demoNetworks,
  loading: false,
  error: null,

  // UI defaults
  viewMode: 'dashboard',
  setViewMode: (mode) => set({ viewMode: mode }),
  selectedRule: null,
  setSelectedRule: (rule) => set({ selectedRule: rule }),
  showRuleEditor: false,
  setShowRuleEditor: (show) => set({ showRuleEditor: show }),
  showConceptTooltip: null,
  setShowConceptTooltip: (id) => set({ showConceptTooltip: id }),

  // Actions
  fetchData: async () => {
    const { useDemo } = get();
    if (useDemo) {
      set({
        firewallRules: demoFirewallRules,
        firewallGroups: demoFirewallGroups,
        networks: demoNetworks,
      });
      return;
    }

    set({ loading: true, error: null });
    try {
      const [rules, groups, networks] = await Promise.all([
        unifiApi.getFirewallRules(),
        unifiApi.getFirewallGroups(),
        unifiApi.getNetworkConfigs(),
      ]);
      set({ firewallRules: rules, firewallGroups: groups, networks, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch data', loading: false });
    }
  },

  updateRule: async (ruleId, updates) => {
    const { useDemo, firewallRules } = get();
    if (useDemo) {
      set({
        firewallRules: firewallRules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
      });
      return true;
    }
    try {
      await unifiApi.updateFirewallRule(ruleId, updates);
      await get().fetchData();
      return true;
    } catch {
      return false;
    }
  },

  deleteRule: async (ruleId) => {
    const { useDemo, firewallRules } = get();
    if (useDemo) {
      set({ firewallRules: firewallRules.filter(r => r.id !== ruleId) });
      return true;
    }
    try {
      await unifiApi.deleteFirewallRule(ruleId);
      await get().fetchData();
      return true;
    } catch {
      return false;
    }
  },

  createRule: async (rule) => {
    const { useDemo, firewallRules } = get();
    if (useDemo) {
      const newRule: FirewallRule = {
        id: `demo-${Date.now()}`,
        name: rule.name || 'New Rule',
        enabled: rule.enabled ?? true,
        action: rule.action || 'accept',
        protocol: rule.protocol || 'all',
        ruleIndex: firewallRules.length,
        logging: rule.logging || false,
        state: rule.state || '',
        srcFirewallGroupIds: rule.srcFirewallGroupIds || [],
        dstFirewallGroupIds: rule.dstFirewallGroupIds || [],
        srcAddresses: rule.srcAddresses || [],
        dstAddresses: rule.dstAddresses || [],
        srcPorts: rule.srcPorts || [],
        dstPorts: rule.dstPorts || [],
        srcNetworkconfIds: rule.srcNetworkconfIds || [],
        dstNetworkconfIds: rule.dstNetworkconfIds || [],
        ipType: rule.ipType || 'ipv4',
        matchingTarget: rule.matchingTarget || '',
      };
      set({ firewallRules: [...firewallRules, newRule] });
      return true;
    }
    try {
      await unifiApi.createFirewallRule(rule);
      await get().fetchData();
      return true;
    } catch {
      return false;
    }
  },

  toggleRuleEnabled: async (ruleId) => {
    const { firewallRules, updateRule } = get();
    const rule = firewallRules.find(r => r.id === ruleId);
    if (rule) {
      await updateRule(ruleId, { enabled: !rule.enabled });
    }
  },

  reorderRules: (fromIndex, toIndex) => {
    const { firewallRules } = get();
    const newRules = [...firewallRules];
    const [moved] = newRules.splice(fromIndex, 1);
    newRules.splice(toIndex, 0, moved);
    set({
      firewallRules: newRules.map((r, i) => ({ ...r, ruleIndex: i }))
    });
  },
}));
