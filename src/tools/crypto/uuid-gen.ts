import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function generateV4(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateV1(): string {
  // Simplified v1 — uses timestamp + random node
  const now = Date.now();
  const t = BigInt(now) * 10000n + 122192928000000000n; // 100ns intervals since Oct 1582
  const timeLow = (t & 0xffffffffn).toString(16).padStart(8, '0');
  const timeMid = ((t >> 32n) & 0xffffn).toString(16).padStart(4, '0');
  const timeHigh = ((t >> 48n) & 0x0fffn | 0x1000n).toString(16).padStart(4, '0');
  const clockSeq = (Math.floor(Math.random() * 0x3fff) | 0x8000).toString(16).padStart(4, '0');
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  return `${timeLow}-${timeMid}-${timeHigh}-${clockSeq}-${node}`;
}

function generateV5(namespace: string, name: string): string {
  // Namespace UUIDs
  const namespaces: Record<string, string> = {
    DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
  };

  const nsUuid = namespaces[namespace] || namespace;
  const nsBytes = nsUuid.replace(/-/g, '').match(/.{2}/g)!.map((h) => parseInt(h, 16));
  const nameBytes = new TextEncoder().encode(name);
  const combined = new Uint8Array(nsBytes.length + nameBytes.length);
  combined.set(nsBytes, 0);
  combined.set(nameBytes, nsBytes.length);

  // SHA-1 via Web Crypto
  return globalThis.crypto.subtle.digest('SHA-1', combined).then((hash) => {
    const bytes = new Uint8Array(hash);
    bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = Array.from(bytes.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }) as unknown as string;
}

const tool: Tool = {
  id: 'uuid-gen',
  name: 'UUID Generator',
  description: 'Generate UUIDs in version 1, 4, or 5 with batch mode',
  category: 'crypto',
  tags: ['uuid', 'guid', 'v4', 'v1', 'v5', 'unique', 'identifier', 'random', 'generator'],
  inputs: [],
  options: [
    {
      id: 'version',
      label: 'Version',
      type: 'select',
      default: 'v4',
      options: [
        { label: 'v1 (timestamp-based)', value: 'v1' },
        { label: 'v4 (random)', value: 'v4' },
        { label: 'v5 (namespace+name, SHA-1)', value: 'v5' },
      ],
    },
    {
      id: 'namespace',
      label: 'Namespace (v5)',
      type: 'select',
      default: 'DNS',
      options: [
        { label: 'DNS', value: 'DNS' },
        { label: 'URL', value: 'URL' },
        { label: 'OID', value: 'OID' },
        { label: 'X500', value: 'X500' },
        { label: 'Custom UUID', value: 'custom' },
      ],
      showWhen: { optionId: 'version', value: 'v5' },
    },
    {
      id: 'customNamespace',
      label: 'Custom Namespace UUID',
      type: 'text',
      default: '',
      placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      required: false,
      showWhen: { optionId: 'namespace', value: 'custom' },
    },
    {
      id: 'name',
      label: 'Name (v5)',
      type: 'text',
      default: '',
      placeholder: 'example.com',
      required: false,
      showWhen: { optionId: 'version', value: 'v5' },
    },
    {
      id: 'count',
      label: 'Count',
      type: 'number',
      default: 1,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      id: 'uppercase',
      label: 'Uppercase',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'hyphens',
      label: 'Include Hyphens',
      type: 'checkbox',
      default: true,
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(_inputs, options) {
    const version = options.version as string;
    const count = options.count as number;
    const uppercase = options.uppercase as boolean;
    const hyphens = options.hyphens as boolean;

    const uuids: string[] = [];

    for (let i = 0; i < count; i++) {
      let uuid: string;
      if (version === 'v1') {
        uuid = generateV1();
      } else if (version === 'v5') {
        const ns = options.namespace === 'custom'
          ? (options.customNamespace as string) || 'DNS'
          : (options.namespace as string) || 'DNS';
        const name = (options.name as string) || '';
        uuid = await (generateV5(ns, name) as unknown as Promise<string>);
      } else {
        uuid = generateV4();
      }

      if (!hyphens) uuid = uuid.replace(/-/g, '');
      if (uppercase) uuid = uuid.toUpperCase();
      uuids.push(uuid);
    }

    return { type: 'text', data: uuids.join('\n') };
  },
};

registry.register(tool);
export default tool;
