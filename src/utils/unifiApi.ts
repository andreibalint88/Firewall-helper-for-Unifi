import { UniFiConnection, FirewallRule, FirewallGroup, NetworkConfig } from '../types';

// UniFi OS API helper
// Note: Due to browser CORS restrictions, this tool works best when:
// 1. The UniFi controller has CORS enabled (UDM Pro with custom config)
// 2. You're running this tool on the same network/domain
// 3. Using a CORS proxy for development

class UniFiApi {
  private baseUrl: string = '';
  private csrfToken: string = '';
  private cookies: string = '';
  private site: string = 'default';

  setConnection(config: UniFiConnection) {
    this.baseUrl = config.controllerUrl.replace(/\/$/, '');
    this.site = config.site || 'default';
  }

  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      // Try UniFi OS style authentication (UDM Pro, Cloud Key Gen2+)
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (response.ok) {
        this.csrfToken = response.headers.get('x-csrf-token') || '';
        const data = await response.json();
        return data.rc === 'ok' || data.meta?.rc === 'ok' || response.ok;
      }

      // Try legacy authentication (Cloud Key Gen1, older controllers)
      const legacyResponse = await fetch(`${this.baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (legacyResponse.ok) {
        const data = await legacyResponse.json();
        return data.meta?.rc === 'ok' || legacyResponse.ok;
      }

      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }
    return headers;
  }

  async getFirewallRules(): Promise<FirewallRule[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/proxy/network/api/s/${this.site}/rest/firewallrule`,
        {
          method: 'GET',
          headers: this.getHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to fetch firewall rules');
      const data = await response.json();
      return (data.data || []).map((rule: any, index: number) => ({
        id: rule._id || `rule-${index}`,
        _id: rule._id,
        name: rule.name || `Rule ${index + 1}`,
        enabled: rule.enabled !== false,
        action: rule.action || 'accept',
        protocol: rule.protocol || 'all',
        ruleIndex: rule.rule_index || index,
        logging: rule.log === true,
        state: rule.state || '',
        srcFirewallGroupIds: rule.src_firewall_group_ids || [],
        dstFirewallGroupIds: rule.dst_firewall_group_ids || [],
        srcAddresses: rule.src_addresses || [],
        dstAddresses: rule.dst_addresses || [],
        srcPorts: rule.src_ports || [],
        dstPorts: rule.dst_ports || [],
        srcNetworkconfIds: rule.src_networkconf_ids || [],
        dstNetworkconfIds: rule.dst_networkconf_ids || [],
        ipType: rule.ip_type || 'ipv4',
        matchingTarget: rule.matching_target || '',
      }));
    } catch (error) {
      console.error('Error fetching firewall rules:', error);
      throw error;
    }
  }

  async getFirewallGroups(): Promise<FirewallGroup[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/proxy/network/api/s/${this.site}/rest/firewallgroup`,
        {
          method: 'GET',
          headers: this.getHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to fetch firewall groups');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching firewall groups:', error);
      throw error;
    }
  }

  async getNetworkConfigs(): Promise<NetworkConfig[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/proxy/network/api/s/${this.site}/rest/networkconf`,
        {
          method: 'GET',
          headers: this.getHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to fetch network configs');
      const data = await response.json();
      return (data.data || []).map((net: any) => ({
        _id: net._id,
        name: net.name,
        subnet: net.subnet || '',
        purpose: net.purpose || '',
      }));
    } catch (error) {
      console.error('Error fetching network configs:', error);
      throw error;
    }
  }

  async updateFirewallRule(ruleId: string, updates: Partial<FirewallRule>): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/proxy/network/api/s/${this.site}/rest/firewallrule/${ruleId}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          credentials: 'include',
          body: JSON.stringify(updates),
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Error updating firewall rule:', error);
      throw error;
    }
  }

  async createFirewallRule(rule: Partial<FirewallRule>): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/proxy/network/api/s/${this.site}/rest/firewallrule`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          credentials: 'include',
          body: JSON.stringify(rule),
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Error creating firewall rule:', error);
      throw error;
    }
  }

  async deleteFirewallRule(ruleId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/proxy/network/api/s/${this.site}/rest/firewallrule/${ruleId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
          credentials: 'include',
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Error deleting firewall rule:', error);
      throw error;
    }
  }
}

export const unifiApi = new UniFiApi();

// Demo data for when not connected to a real controller
export const demoFirewallRules: FirewallRule[] = [
  {
    id: 'demo-1',
    name: 'Allow DNS',
    enabled: true,
    action: 'accept',
    protocol: 'tcp_udp',
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
    matchingTarget: 'dst',
  },
  {
    id: 'demo-2',
    name: 'Block IoT to LAN',
    enabled: true,
    action: 'drop',
    protocol: 'all',
    ruleIndex: 1,
    logging: true,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.50.0/24'],
    dstAddresses: ['192.168.1.0/24'],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'dst',
  },
  {
    id: 'demo-3',
    name: 'Allow Established',
    enabled: true,
    action: 'accept',
    protocol: 'all',
    ruleIndex: 2,
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
    ipType: 'ipv4',
    matchingTarget: '',
  },
  {
    id: 'demo-4',
    name: 'Allow Guest HTTP/S',
    enabled: true,
    action: 'accept',
    protocol: 'tcp',
    ruleIndex: 3,
    logging: false,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.10.0/24'],
    dstAddresses: ['0.0.0.0/0'],
    srcPorts: [],
    dstPorts: ['80', '443'],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'dst',
  },
  {
    id: 'demo-5',
    name: 'Block Guest to Private',
    enabled: true,
    action: 'drop',
    protocol: 'all',
    ruleIndex: 4,
    logging: true,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.10.0/24'],
    dstAddresses: ['192.168.1.0/24', '192.168.20.0/24'],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'dst',
  },
  {
    id: 'demo-6',
    name: 'Allow VPN Internal',
    enabled: true,
    action: 'accept',
    protocol: 'all',
    ruleIndex: 5,
    logging: false,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['10.0.0.0/24'],
    dstAddresses: ['192.168.1.0/24', '192.168.20.0/24'],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'dst',
  },
  {
    id: 'demo-7',
    name: 'Block China GeoIP',
    enabled: false,
    action: 'drop',
    protocol: 'all',
    ruleIndex: 6,
    logging: true,
    state: 'new',
    srcFirewallGroupIds: ['geoip-cn'],
    dstFirewallGroupIds: [],
    srcAddresses: [],
    dstAddresses: [],
    srcPorts: [],
    dstPorts: [],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'src',
  },
  {
    id: 'demo-8',
    name: 'Allow Server SSH',
    enabled: true,
    action: 'accept',
    protocol: 'tcp',
    ruleIndex: 7,
    logging: true,
    state: 'new',
    srcFirewallGroupIds: [],
    dstFirewallGroupIds: [],
    srcAddresses: ['192.168.1.0/24'],
    dstAddresses: ['192.168.20.10'],
    srcPorts: [],
    dstPorts: ['22'],
    srcNetworkconfIds: [],
    dstNetworkconfIds: [],
    ipType: 'ipv4',
    matchingTarget: 'dst',
  },
];

export const demoFirewallGroups: FirewallGroup[] = [
  { _id: 'geoip-cn', name: 'China GeoIP', group_type: 'address-group', group_members: ['CN'] },
  { _id: 'servers', name: 'Servers', group_type: 'address-group', group_members: ['192.168.20.10', '192.168.20.11'] },
  { _id: 'web-ports', name: 'Web Ports', group_type: 'port-group', group_members: ['80', '443', '8080'] },
  { _id: 'iot-network', name: 'IoT Network', group_type: 'network-group', group_members: ['192.168.50.0/24'] },
];

export const demoNetworks: NetworkConfig[] = [
  { _id: 'net-1', name: 'Default', subnet: '192.168.1.0/24', purpose: 'corporate' },
  { _id: 'net-2', name: 'Servers', subnet: '192.168.20.0/24', purpose: 'corporate' },
  { _id: 'net-3', name: 'Guest', subnet: '192.168.10.0/24', purpose: 'guest' },
  { _id: 'net-4', name: 'IoT', subnet: '192.168.50.0/24', purpose: 'corporate' },
  { _id: 'net-5', name: 'VPN', subnet: '10.0.0.0/24', purpose: 'vpn' },
];
