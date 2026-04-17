import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { MAJOR_TIMEZONES } from './timezone-data';

function formatInZone(date: Date, tz: string): string {
  return date.toLocaleString('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
}

const tool: Tool = {
  id: 'timezone-convert',
  name: 'Timezone Convert',
  description: 'Convert time between timezones using major IANA zones, with optional world clock',
  category: 'math',
  tags: ['timezone', 'time', 'convert', 'zone', 'UTC', 'world', 'clock', 'international'],
  inputs: [
    {
      id: 'time',
      label: 'Date & Time',
      type: 'text',
      placeholder: 'e.g. 2024-01-15 14:30 or "now"',
    },
  ],
  options: [
    {
      id: 'sourceZone',
      label: 'Source Timezone',
      type: 'select',
      default: 'UTC',
      options: MAJOR_TIMEZONES.map(t => ({ label: t.label, value: t.id })),
    },
    {
      id: 'targetZone',
      label: 'Target Timezone',
      type: 'select',
      default: 'America/New_York',
      options: MAJOR_TIMEZONES.map(t => ({ label: t.label, value: t.id })),
    },
    {
      id: 'worldClock',
      label: 'Show World Clock (major cities)',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'text' },
  apiSupported: true,

  async run(inputs, options) {
    const rawTime = (inputs.time as string).trim();
    const sourceZone = options.sourceZone as string;
    const targetZone = options.targetZone as string;
    const worldClock = options.worldClock as boolean;

    let date: Date;
    if (!rawTime || rawTime.toLowerCase() === 'now') {
      date = new Date();
    } else {
      // Parse the time string; if no timezone info, treat as source timezone
      // We create the date as if in UTC and then adjust
      const parsed = new Date(rawTime);
      if (isNaN(parsed.getTime())) throw new Error(`Invalid date/time: "${rawTime}"`);

      // Get the offset of source timezone at parsed time
      const sourceOffset = new Date(parsed.toLocaleString('en-US', { timeZone: sourceZone })).getTime() - parsed.getTime();
      date = new Date(parsed.getTime() - sourceOffset);
    }

    const sourceFormatted = formatInZone(date, sourceZone);
    const targetFormatted = formatInZone(date, targetZone);

    const lines = [
      `Source (${sourceZone}):`,
      `  ${sourceFormatted}`,
      ``,
      `Target (${targetZone}):`,
      `  ${targetFormatted}`,
      ``,
      `UTC:`,
      `  ${date.toISOString()}`,
    ];

    if (worldClock) {
      lines.push('', 'World Clock:');
      const worldZones = [
        'America/Los_Angeles', 'America/New_York', 'America/Sao_Paulo',
        'Europe/London', 'Europe/Paris', 'Europe/Moscow',
        'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
        'Australia/Sydney', 'Pacific/Auckland',
      ];
      for (const tz of worldZones) {
        const tzLabel = MAJOR_TIMEZONES.find(t => t.id === tz)?.label ?? tz;
        lines.push(`  ${tzLabel.padEnd(30)} ${formatInZone(date, tz)}`);
      }
    }

    return { type: 'text', data: lines.join('\n') };
  },
};

registry.register(tool);
export default tool;
