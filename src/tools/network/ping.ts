import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'ping',
  name: 'Web Ping',
  description: 'Measure latency to a URL via fetch timing — min, avg, max',
  category: 'network',
  tags: ['ping', 'latency', 'timing', 'network', 'speed', 'http', 'measure'],
  inputs: [
    {
      id: 'url',
      label: 'URL to Ping',
      type: 'text',
      placeholder: 'https://example.com',
    },
  ],
  options: [
    {
      id: 'count',
      label: 'Number of Requests',
      type: 'range',
      default: 5,
      min: 1,
      max: 20,
      step: 1,
    },
  ],
  output: { type: 'json' },
  apiSupported: false,
  async run(inputs, options, onProgress) {
    const url = ((inputs.url as string) ?? '').trim();
    if (!url) throw new Error('URL is required');

    const count = options.count as number;
    const times: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < count; i++) {
      onProgress?.(Math.round((i / count) * 90), `Ping ${i + 1}/${count}...`);
      try {
        const start = performance.now();
        await fetch(url, {
          method: 'HEAD',
          cache: 'no-store',
          mode: 'no-cors',
        });
        const elapsed = performance.now() - start;
        times.push(Math.round(elapsed));
      } catch (e) {
        errors.push(`Request ${i + 1}: ${(e as Error).message}`);
      }
      // Small delay between requests
      if (i < count - 1) await new Promise((r) => setTimeout(r, 200));
    }

    onProgress?.(100, 'Done');

    if (!times.length) throw new Error(`All ${count} requests failed: ${errors[0]}`);

    const min = Math.min(...times);
    const max = Math.max(...times);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);

    return {
      type: 'json',
      data: {
        url,
        requests: { sent: count, received: times.length, failed: errors.length },
        latency: { min: `${min}ms`, avg: `${avg}ms`, max: `${max}ms` },
        individual: times.map((t, i) => ({ seq: i + 1, ms: t })),
        errors: errors.length ? errors : undefined,
        note: 'Times include DNS resolution, TCP connection, and server response. No-CORS mode used — actual response data not available.',
      },
    };
  },
};

registry.register(tool);
export default tool;
