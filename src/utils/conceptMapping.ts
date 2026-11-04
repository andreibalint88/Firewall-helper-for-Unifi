import { MerakiRuleEquivalent } from '../types';

export const conceptMappings: MerakiRuleEquivalent[] = [
  {
    merakiName: 'L3 Firewall Rules',
    merakiDescription: 'Layer 3 rules that filter traffic based on IP addresses and protocols',
    unifiField: 'IPv4 Rules (Traffic Rules)',
    notes: 'UniFi calls these "Traffic Rules" or "Firewall Rules" under Settings > Security > Firewall. In Meraki, you configure these under Security Appliance > Firewall > L3 firewall rules.'
  },
  {
    merakiName: 'L7 Firewall Rules',
    merakiDescription: 'Layer 7 rules that filter traffic based on application type',
    unifiField: 'Traffic Rules (App-based)',
    notes: 'UniFi handles this through "Traffic Rules" with app categories. Meraki uses "L7 firewall rules" with predefined application signatures.'
  },
  {
    merakiName: 'Inbound Rules',
    merakiDescription: 'Rules for traffic coming from the internet to your network',
    unifiField: 'WAN In rules / Port Forwarding',
    notes: 'UniFi separates WAN inbound rules. Port forwarding in UniFi is under Settings > Profiles > Port Forwarding. In Meraki, inbound rules are part of L3 firewall rules with "Any" as source.'
  },
  {
    merakiName: 'Outbound Rules',
    merakiDescription: 'Rules for traffic leaving your network to the internet',
    unifiField: 'Internet (WAN) rules',
    notes: 'UniFi handles outbound filtering in the main firewall rule set. Match on source network and destination "Internet".'
  },
  {
    merakiName: 'Content Filtering',
    merakiDescription: 'Block or allow web content by category',
    unifiField: 'DNS Filtering / Threat Management',
    notes: 'UniFi uses "DNS Filtering" (under Security) or third-party DNS services. Meraki has built-in content filtering with categories.'
  },
  {
    merakiName: 'Network -> Network Rules',
    merakiDescription: 'Rules controlling traffic between VLANs/internal networks',
    unifiField: 'LAN Rules / Inter-network rules',
    notes: 'UniFi calls these "LAN Rules" or inter-network firewall rules. In Meraki, you use L3 rules with specific network sources and destinations.'
  },
  {
    merakiName: 'Allow / Deny / Block',
    merakiDescription: 'Action types for firewall rules',
    unifiField: 'Accept / Drop / Reject',
    notes: 'UniFi uses "Accept" (allow), "Drop" (silent block), and "Reject" (block with response). Meraki uses "Allow" and "Deny".'
  },
  {
    merakiName: 'Any / Specific IP',
    merakiDescription: 'Source/destination address specification',
    unifiField: 'Address Groups / IP Ranges / Networks',
    notes: 'UniFi uses "Firewall Groups" (Address Groups, Network Groups, Port Groups). Meraki uses inline IP definitions or named objects.'
  },
  {
    merakiName: 'Port / Port Range',
    merakiDescription: 'Destination port specification',
    unifiField: 'Port Groups / Specific Ports',
    notes: 'UniFi uses "Port Groups" or individual ports. Meraki allows port ranges like "80-443" or specific ports.'
  },
  {
    merakiName: 'Rule Order / Priority',
    merakiDescription: 'The order in which rules are evaluated (top to bottom)',
    unifiField: 'Rule Index / Drag to reorder',
    notes: 'Both platforms process rules top-to-bottom. UniFi lets you drag rules to reorder. Meraki uses a priority number.'
  },
  {
    merakiName: 'Syslog / Logging',
    merakiDescription: 'Log matched traffic to a syslog server',
    unifiField: 'Log toggle per rule',
    notes: 'UniFi has a per-rule logging toggle. Logs can be viewed in the UniFi controller or sent to external syslog. Meraki sends logs to the dashboard or external syslog.'
  },
  {
    merakiName: 'VPN Firewall Rules',
    merakiDescription: 'Rules that apply to VPN traffic',
    unifiField: 'VPN rules (Teleport / Site-to-Site)',
    notes: 'UniFi applies firewall rules based on the source/destination network. VPN traffic appears as traffic from the VPN network. Meraki has specific VPN firewall rules.'
  },
];

export const getMerakiEquivalent = (unifiConcept: string): MerakiRuleEquivalent | undefined => {
  return conceptMappings.find(m => 
    m.unifiField.toLowerCase().includes(unifiConcept.toLowerCase()) ||
    m.merakiName.toLowerCase().includes(unifiConcept.toLowerCase())
  );
};

export const actionMapping: Record<string, string> = {
  'accept': 'Allow',
  'drop': 'Deny (silent)',
  'reject': 'Deny (with RST/ICMP)',
};

export const protocolMapping: Record<string, string> = {
  'tcp': 'TCP',
  'udp': 'UDP',
  'tcp_udp': 'TCP/UDP',
  'all': 'Any Protocol',
  'icmp': 'ICMP',
};
