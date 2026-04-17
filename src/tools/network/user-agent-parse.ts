import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

interface UAInfo {
  browser: { name: string; version: string } | null;
  engine: { name: string; version: string } | null;
  os: { name: string; version: string } | null;
  device: { type: string; vendor: string | null; model: string | null };
  raw: string;
}

function parseUA(ua: string): UAInfo {
  const result: UAInfo = {
    browser: null,
    engine: null,
    os: null,
    device: { type: 'desktop', vendor: null, model: null },
    raw: ua,
  };

  // Browser detection (order matters — most specific first)
  const browserPatterns: Array<[RegExp, string]> = [
    [/Edg\/(\d+[\.\d]*)/, 'Edge'],
    [/OPR\/(\d+[\.\d]*)/, 'Opera'],
    [/Chrome\/(\d+[\.\d]*)/, 'Chrome'],
    [/Firefox\/(\d+[\.\d]*)/, 'Firefox'],
    [/Safari\/(\d+[\.\d]*)/, 'Safari'],
    [/MSIE (\d+[\.\d]*);/, 'Internet Explorer'],
    [/Trident\/.*rv:(\d+[\.\d]*)/, 'Internet Explorer'],
  ];

  // Chromium version for Safari detection
  const isChrome = /Chrome\/(\d+)/.test(ua);

  for (const [re, name] of browserPatterns) {
    if (name === 'Safari' && isChrome) continue; // Chrome UA contains Safari
    const m = ua.match(re);
    if (m) {
      result.browser = { name, version: m[1] };
      break;
    }
  }

  // Engine
  if (/Gecko\//.test(ua) && /rv:/.test(ua)) {
    const m = ua.match(/rv:([\d.]+)/);
    result.engine = { name: 'Gecko', version: m ? m[1] : '' };
  } else if (/AppleWebKit\/([\d.]+)/.test(ua)) {
    const m = ua.match(/AppleWebKit\/([\d.]+)/);
    result.engine = { name: 'WebKit', version: m ? m[1] : '' };
  } else if (/Trident\/([\d.]+)/.test(ua)) {
    const m = ua.match(/Trident\/([\d.]+)/);
    result.engine = { name: 'Trident', version: m ? m[1] : '' };
  }

  // OS
  const osPatterns: Array<[RegExp, string]> = [
    [/Windows NT ([\d.]+)/, 'Windows'],
    [/Mac OS X ([\d_]+)/, 'macOS'],
    [/Android ([\d.]+)/, 'Android'],
    [/iPhone OS ([\d_]+)/, 'iOS'],
    [/iPad.*OS ([\d_]+)/, 'iPadOS'],
    [/Linux/, 'Linux'],
    [/CrOS/, 'ChromeOS'],
  ];

  for (const [re, name] of osPatterns) {
    const m = ua.match(re);
    if (m) {
      const version = (m[1] || '').replace(/_/g, '.');
      // Map Windows NT versions
      if (name === 'Windows') {
        const winMap: Record<string, string> = {
          '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.2': 'XP', '5.1': 'XP',
        };
        result.os = { name: 'Windows', version: winMap[version] || version };
      } else {
        result.os = { name, version };
      }
      break;
    }
  }

  // Device type
  if (/Mobile/.test(ua)) {
    result.device.type = 'mobile';
  } else if (/Tablet|iPad/.test(ua)) {
    result.device.type = 'tablet';
  }

  // Vendor/model
  if (/iPhone/.test(ua)) {
    result.device.vendor = 'Apple';
    result.device.model = 'iPhone';
    result.device.type = 'mobile';
  } else if (/iPad/.test(ua)) {
    result.device.vendor = 'Apple';
    result.device.model = 'iPad';
    result.device.type = 'tablet';
  } else if (/Android/.test(ua)) {
    const m = ua.match(/;\s*([^;)]+)\s*(?:Build\/|;|\))/);
    if (m) result.device.model = m[1].trim();
    result.device.type = /Mobile/.test(ua) ? 'mobile' : 'tablet';
  } else if (/Macintosh/.test(ua)) {
    result.device.vendor = 'Apple';
  }

  return result;
}

const tool: Tool = {
  id: 'user-agent-parse',
  name: 'UA Parser',
  description: 'Parse User-Agent string — browser, version, OS, device type',
  category: 'network',
  tags: ['user-agent', 'ua', 'browser', 'parse', 'os', 'device', 'chrome', 'firefox', 'network'],
  inputs: [
    {
      id: 'ua',
      label: 'User-Agent String (blank = current browser)',
      type: 'text',
      placeholder: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
      required: false,
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs) {
    const ua = ((inputs.ua as string) ?? '').trim() ||
      (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    if (!ua) throw new Error('User-Agent string is required');

    const info = parseUA(ua);
    return { type: 'json', data: info };
  },
};

registry.register(tool);
export default tool;
