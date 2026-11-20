import { UniFiConnection, FirewallRule, FirewallGroup, NetworkConfig } from '../types';

// Backend API URL - the proxy server that talks to UniFi
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

class UniFiApi {
  private sessionId: string = '';
  private connected: boolean = false;

  isConnected(): boolean {
    return this.connected;
  }

  async connect(config: UniFiConnection): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/unifi/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controllerUrl: config.controllerUrl,
          username: config.username,
          password: config.password,
          site: config.site || 'default',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || 'Connection failed');
      }

      const data = await response.json();
      this.sessionId = data.sessionId;
      this.connected = true;
      return true;
    } catch (error: any) {
      console.error('Connect error:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.sessionId) {
      try {
        await fetch(`${API_URL}/api/unifi/disconnect`, {
          method: 'POST',
          headers: { 'sessionId': this.sessionId },
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    this.sessionId = '';
    this.connected = false;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.sessionId) {
      throw new Error('Not connected to UniFi controller');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'sessionId': this.sessionId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.details || data.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  async getFirewallRules(): Promise<FirewallRule[]> {
    const data = await this.request('/api/unifi/firewall-rules');
    return this.normalizeRules(data.rules || []);
  }

  async getFirewallGroups(): Promise<FirewallGroup[]> {
    const data = await this.request('/api/unifi/firewall-groups');
    return data.groups || [];
  }

  async getNetworkConfigs(): Promise<NetworkConfig[]> {
    const data = await this.request('/api/unifi/networks');
    return data.networks || [];
  }

  async updateFirewallRule(ruleId: string, updates: Partial<FirewallRule>): Promise<void> {
    await this.request(`/api/unifi/firewall-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async createFirewallRule(rule: Partial<FirewallRule>): Promise<void> {
    await this.request('/api/unifi/firewall-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  async deleteFirewallRule(ruleId: string): Promise<void> {
    await this.request(`/api/unifi/firewall-rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // Normalize UniFi API response to our internal format
  private normalizeRules(rules: any[]): FirewallRule[] {
    return rules.map((rule, index) => ({
      id: rule._id || rule.id || `rule-${index}`,
      _id: rule._id,
      name: rule.name || 'Unnamed Rule',
      enabled: rule.enabled !== false,
      action: this.normalizeAction(rule.action),
      protocol: this.normalizeProtocol(rule.protocol),
      ruleIndex: index,
      logging: rule.logging || false,
      state: rule.state || '',
      srcFirewallGroupIds: rule.src_firewallgroup_ids || rule.srcFirewallGroupIds || [],
      dstFirewallGroupIds: rule.dst_firewallgroup_ids || rule.dstFirewallGroupIds || [],
      srcAddresses: rule.src_addresses || rule.srcAddresses || [],
      dstAddresses: rule.dst_addresses || rule.dstAddresses || [],
      srcPorts: rule.src_ports || rule.srcPorts || [],
      dstPorts: rule.dst_ports || rule.dstPorts || [],
      srcNetworkconfIds: rule.src_networkconf_ids || rule.srcNetworkconfIds || [],
      dstNetworkconfIds: rule.dst_networkconf_ids || rule.dstNetworkconfIds || [],
      ipType: rule.ip_type || rule.ipType || 'ipv4',
      matchingTarget: rule.matching_target || rule.matchingTarget || '',
    }));
  }

  private normalizeAction(action: string): 'accept' | 'drop' | 'reject' {
    const normalized = (action || '').toLowerCase();
    if (normalized === 'accept' || normalized === 'allow') return 'accept';
    if (normalized === 'reject') return 'reject';
    return 'drop';
  }

  private normalizeProtocol(protocol: string): 'tcp' | 'udp' | 'tcp_udp' | 'all' | 'icmp' {
    const normalized = (protocol || '').toLowerCase();
    if (normalized === 'tcp') return 'tcp';
    if (normalized === 'udp') return 'udp';
    if (normalized === 'tcp_udp' || normalized === 'tcp-udp') return 'tcp_udp';
    if (normalized === 'icmp') return 'icmp';
    return 'all';
  }
}

export const unifiApi = new UniFiApi();

// Demo data for when not connected to a controller
export const demoFirewallRules: FirewallRule[] = [
  {
    id: 'demo-1',
    name: 'Allow DNS Traffic',
    enabled: true,
    action: 'accept',
    protocol: 'udp',
    ruleIndex: 0,
    logging: false,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.1.0/24'],
    dstAddresses: ['0.0.0.0/0'],
    srcPorts: [],
    dstPorts: ['53'],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'internet',
    merakiEquivalent: 'L3 Rule: Allow DNS',
  },
  {
    id: 'demo-2',
    name: 'Block IoT to Internal',
    enabled: true,
    action: 'drop',
    protocol: 'all',
    ruleIndex: 1,
    logging: true,
    state: 'new',
    srcFirewallGroupIds: ['iot-group-id'],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.50.0/24'],
    dstAddresses: ['192.168.1.0/24'],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'lan',
    merakiEquivalent: 'L3 Rule: Deny IoT → LAN',
  },
  {
    id: 'demo-3',
    name: 'Allow HTTPS Outbound',
    enabled: true,
    action: 'accept',
    protocol: 'tcp',
    ruleIndex: 2,
    logging: false,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.1.0/24'],
    dstAddresses: ['0.0.0.0/0'],
    srcPorts: [],
    dstPorts: ['443'],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'internet',
    merakiEquivalent: 'L3 Rule: Allow HTTPS',
  },
  {
    id: 'demo-4',
    name: 'Block Known Malware IPs',
    enabled: true,
    action: 'drop',
    protocol: 'all',
    ruleIndex: 3,
    logging: true,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: ['malware-blocklist'],
    srcAddresses: [],
    dstAddresses: [],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4_ipv6',
    matchingTarget: 'internet',
    merakiEquivalent: 'L3 Rule: Deny Malware List',
  },
  {
    id: 'demo-5',
    name: 'Allow ICMP (Ping)',
    enabled: true,
    action: 'accept',
    protocol: 'icmp',
    ruleIndex: 4,
    logging: false,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.0.0/16'],
    dstAddresses: ['192.168.0.0/16'],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'lan',
    merakiEquivalent: 'L3 Rule: Allow ICMP',
  },
  {
    id: 'demo-6',
    name: 'Block Guest to Servers',
    enabled: true,
    action: 'drop',
    protocol: 'all',
    ruleIndex: 5,
    logging: true,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.100.0/24'],
    dstAddresses: ['10.0.0.0/8'],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'lan',
    merakiEquivalent: 'L3 Rule: Deny Guest → Servers',
  },
  {
    id: 'demo-7',
    name: 'Allow Established Connections',
    enabled: true,
    action: 'accept',
    protocol: 'all',
    ruleIndex: 6,
    logging: false,
    state: 'established',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: [],
    dstAddresses: [],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4_ipv6',
    matchingTarget: '',
    merakiEquivalent: 'Stateful Inspection (automatic in Meraki)',
  },
  {
    id: 'demo-8',
    name: 'Legacy FTP Rule (Disabled)',
    enabled: false,
    action: 'accept',
    protocol: 'tcp',
    ruleIndex: 7,
    logging: false,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.1.0/24'],
    dstAddresses: ['0.0.0.0/0'],
    srcPorts: [],
    dstPorts: ['20', '21'],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'internet',
    merakiEquivalent: 'L3 Rule: Allow FTP (legacy)',
  },
];

export const demoFirewallGroups: FirewallGroup[] = [
  {
    _id: 'iot-group-id',
    name: 'IoT Devices',
    group_type: 'address-group',
    group_members: ['192.168.50.10', '192.168.50.11', '192.168.50.12'],
  },
  {
    _id: 'malware-blocklist',
    name: 'Malware Blocklist',
    group_type: 'address-group',
    group_members: ['198.51.100.0/24', '203.0.113.0/24'],
  },
  {
    _id: 'server-ports',
    name: 'Server Ports',
    group_type: 'port-group',
    group_members: ['80', '443', '8080', '8443'],
  },
];

export const demoNetworks: NetworkConfig[] = [
  {
    _id: 'net-1',
    name: 'LAN',
    subnet: '192.168.1.0/24',
    purpose: 'corporate',
  },
  {
    _id: 'net-2',
    name: 'Guest',
    subnet: '192.168.100.0/24',
    purpose: 'guest',
  },
  {
    _id: 'net-3',
    name: 'IoT',
    subnet: '192.168.50.0/24',
    purpose: 'corporate',
  },
  {
    _id: 'net-4',
    name: 'Servers',
    subnet: '10.0.0.0/24',
    purpose: 'corporate',
  },
];
