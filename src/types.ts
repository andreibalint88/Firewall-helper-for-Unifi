export interface UniFiConnection {
  controllerUrl: string;
  username: string;
  password: string;
  site: string;
  isConnected: boolean;
  csrfToken?: string;
  cookies?: string;
}

export interface FirewallRule {
  id: string;
  _id?: string;
  name: string;
  enabled: boolean;
  action: 'accept' | 'drop' | 'reject';
  protocol: 'tcp' | 'udp' | 'tcp_udp' | 'all' | 'icmp';
  ruleIndex: number;
  logging: boolean;
  state: 'new' | 'established' | 'related' | 'invalid' | '';
  srcFirewallGroupIds: string[];
  dstFirewallGroupIds: string[];
  srcAddresses: string[];
  dstAddresses: string[];
  srcPorts: string[];
  dstPorts: string[];
  srcNetworkconfIds: string[];
  dstNetworkconfIds: string[];
  ipType: 'ipv4' | 'ipv6' | 'ipv4_ipv6';
  matchingTarget: string;
  // Meraki equivalent
  merakiEquivalent?: string;
}

export interface FirewallGroup {
  _id: string;
  name: string;
  group_type: 'address-group' | 'port-group' | 'network-group';
  group_members: string[];
}

export interface NetworkConfig {
  _id: string;
  name: string;
  subnet: string;
  purpose: string;
}

export interface MerakiRuleEquivalent {
  merakiName: string;
  merakiDescription: string;
  unifiField: string;
  notes: string;
}

export type ViewMode = 'dashboard' | 'rules' | 'editor' | 'guide' | 'setup';
