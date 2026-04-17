import { describe, it, expect } from 'vitest';
import tool from '../uuid-gen';

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('uuid-gen', () => {
  it('generates valid v4 UUID format', async () => {
    const result = await tool.run({}, { version: 'v4', count: 1, uppercase: false, hyphens: true });
    const uuid = (result.data as string).trim();
    expect(uuid).toMatch(UUID_V4_RE);
  });

  it('generates multiple UUIDs', async () => {
    const result = await tool.run({}, { version: 'v4', count: 5, uppercase: false, hyphens: true });
    const uuids = (result.data as string).trim().split('\n');
    expect(uuids).toHaveLength(5);
    uuids.forEach((uuid) => expect(uuid).toMatch(UUID_V4_RE));
  });

  it('generates unique UUIDs', async () => {
    const result = await tool.run({}, { version: 'v4', count: 10, uppercase: false, hyphens: true });
    const uuids = (result.data as string).trim().split('\n');
    const unique = new Set(uuids);
    expect(unique.size).toBe(10);
  });

  it('generates uppercase when requested', async () => {
    const result = await tool.run({}, { version: 'v4', count: 1, uppercase: true, hyphens: true });
    const uuid = (result.data as string).trim();
    expect(uuid).toBe(uuid.toUpperCase());
  });

  it('removes hyphens when requested', async () => {
    const result = await tool.run({}, { version: 'v4', count: 1, uppercase: false, hyphens: false });
    const uuid = (result.data as string).trim();
    expect(uuid).toHaveLength(32);
    expect(uuid).not.toContain('-');
  });

  it('v5 is deterministic for same namespace and name', async () => {
    const opts = { version: 'v5', namespace: 'DNS', name: 'example.com', count: 1, uppercase: false, hyphens: true };
    const r1 = await tool.run({}, opts);
    const r2 = await tool.run({}, opts);
    expect((r1.data as string).trim()).toBe((r2.data as string).trim());
  });

  it('v5 differs for different names', async () => {
    const opts1 = { version: 'v5', namespace: 'DNS', name: 'example.com', count: 1, uppercase: false, hyphens: true };
    const opts2 = { version: 'v5', namespace: 'DNS', name: 'other.com', count: 1, uppercase: false, hyphens: true };
    const r1 = await tool.run({}, opts1);
    const r2 = await tool.run({}, opts2);
    expect((r1.data as string).trim()).not.toBe((r2.data as string).trim());
  });

  it('v1 generates timestamp-based UUID', async () => {
    const result = await tool.run({}, { version: 'v1', count: 1, uppercase: false, hyphens: true });
    const uuid = (result.data as string).trim();
    // v1 UUID should have version 1 in position 14 of the UUID (3rd group starts with 1)
    const parts = uuid.split('-');
    expect(parts[2]).toMatch(/^1/);
  });
});
