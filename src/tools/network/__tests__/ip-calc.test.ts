import { describe, it, expect } from 'vitest';
import tool from '../ip-calc';

describe('ip-calc', () => {
  it('correctly calculates 192.168.1.0/24', async () => {
    const result = await tool.run({ cidr: '192.168.1.0/24' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.networkAddress).toBe('192.168.1.0');
    expect(data.broadcastAddress).toBe('192.168.1.255');
    expect(data.subnetMask).toBe('255.255.255.0');
    expect(data.wildcardMask).toBe('0.0.0.255');
    expect(data.firstUsableHost).toBe('192.168.1.1');
    expect(data.lastUsableHost).toBe('192.168.1.254');
    expect(data.hostCount).toBe(254);
    expect(data.totalAddresses).toBe(256);
  });

  it('correctly calculates 10.0.0.0/8', async () => {
    const result = await tool.run({ cidr: '10.0.0.0/8' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.networkAddress).toBe('10.0.0.0');
    expect(data.broadcastAddress).toBe('10.255.255.255');
    expect(data.subnetMask).toBe('255.0.0.0');
    expect(data.hostCount).toBe(16777214);
  });

  it('correctly calculates 172.16.0.0/16', async () => {
    const result = await tool.run({ cidr: '172.16.0.0/16' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.networkAddress).toBe('172.16.0.0');
    expect(data.broadcastAddress).toBe('172.16.255.255');
    expect(data.hostCount).toBe(65534);
  });

  it('correctly calculates /32 (single host)', async () => {
    const result = await tool.run({ cidr: '192.168.1.1/32' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.totalAddresses).toBe(1);
  });

  it('correctly calculates /0 (entire internet)', async () => {
    const result = await tool.run({ cidr: '0.0.0.0/0' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.networkAddress).toBe('0.0.0.0');
    expect(data.broadcastAddress).toBe('255.255.255.255');
    expect(data.totalAddresses).toBe(4294967296);
  });

  it('throws on missing prefix', async () => {
    await expect(tool.run({ cidr: '192.168.1.0' }, {})).rejects.toThrow();
  });

  it('throws on invalid prefix length', async () => {
    await expect(tool.run({ cidr: '192.168.1.0/33' }, {})).rejects.toThrow();
  });

  it('includes binary representation', async () => {
    const result = await tool.run({ cidr: '192.168.1.0/24' }, {});
    const data = result.data as Record<string, unknown>;
    expect(data.binary).toBeDefined();
    const binary = data.binary as Record<string, string>;
    expect(binary.subnetMask).toBe('11111111.11111111.11111111.00000000');
  });
});
