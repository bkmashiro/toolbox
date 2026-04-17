import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IP address: ${ip}`);
  }
  return (parts[0] << 24 | parts[1] << 16 | parts[2] << 8 | parts[3]) >>> 0;
}

function intToIp(n: number): string {
  return [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
  ].join('.');
}

function intToBinary(n: number): string {
  return [
    ((n >>> 24) & 255).toString(2).padStart(8, '0'),
    ((n >>> 16) & 255).toString(2).padStart(8, '0'),
    ((n >>> 8) & 255).toString(2).padStart(8, '0'),
    (n & 255).toString(2).padStart(8, '0'),
  ].join('.');
}

const tool: Tool = {
  id: 'ip-calc',
  name: 'IP Calculator',
  description: 'CIDR/subnet calculator — network address, broadcast, host range, wildcard mask',
  category: 'network',
  tags: ['ip', 'subnet', 'cidr', 'network', 'broadcast', 'mask', 'calculator', 'ipv4'],
  inputs: [
    {
      id: 'cidr',
      label: 'CIDR Notation',
      type: 'text',
      placeholder: '192.168.1.0/24',
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs) {
    const cidr = ((inputs.cidr as string) ?? '').trim();
    if (!cidr) throw new Error('CIDR notation required');

    const slashIdx = cidr.indexOf('/');
    if (slashIdx === -1) throw new Error('Invalid CIDR — include prefix length (e.g. /24)');

    const ipStr = cidr.slice(0, slashIdx);
    const prefix = parseInt(cidr.slice(slashIdx + 1), 10);

    if (isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error('Prefix must be 0-32');

    const ipInt = ipToInt(ipStr);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const wildcard = (~mask) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const firstUsable = prefix < 31 ? network + 1 : network;
    const lastUsable = prefix < 31 ? broadcast - 1 : broadcast;
    const hostCount = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2;

    return {
      type: 'json',
      data: {
        inputIP: ipStr,
        prefix,
        networkAddress: intToIp(network),
        broadcastAddress: intToIp(broadcast),
        subnetMask: intToIp(mask),
        wildcardMask: intToIp(wildcard),
        firstUsableHost: intToIp(firstUsable),
        lastUsableHost: intToIp(lastUsable),
        hostCount: hostCount < 0 ? 0 : hostCount,
        totalAddresses: Math.pow(2, 32 - prefix),
        ipClass: prefix <= 8 ? 'A' : prefix <= 16 ? 'B' : prefix <= 24 ? 'C' : 'D/E',
        binary: {
          ip: intToBinary(ipInt),
          networkAddress: intToBinary(network),
          subnetMask: intToBinary(mask),
        },
        cidr: `${intToIp(network)}/${prefix}`,
      },
    };
  },
};

registry.register(tool);
export default tool;
