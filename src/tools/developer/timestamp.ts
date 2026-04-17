import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function formatRelative(ms: number): string {
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const past = diff < 0;
  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  let rel = '';
  if (years > 0) rel = `${years} year${years > 1 ? 's' : ''}`;
  else if (days > 0) rel = `${days} day${days > 1 ? 's' : ''}`;
  else if (hours > 0) rel = `${hours} hour${hours > 1 ? 's' : ''}`;
  else if (minutes > 0) rel = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  else rel = `${seconds} second${seconds !== 1 ? 's' : ''}`;

  return past ? `${rel} ago` : `in ${rel}`;
}

// Common IANA timezones
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
  'Asia/Seoul', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland',
];

const tool: Tool = {
  id: 'timestamp',
  name: 'Timestamp',
  description: 'Convert Unix timestamps to human dates and vice versa',
  category: 'developer',
  tags: ['timestamp', 'unix', 'date', 'time', 'convert', 'epoch', 'iso8601', 'developer'],
  inputs: [
    {
      id: 'value',
      label: 'Timestamp or Date (leave blank for current time)',
      type: 'text',
      placeholder: '1713340800 or 2024-04-17T12:00:00Z or "now"',
      required: false,
    },
  ],
  options: [
    {
      id: 'timezone',
      label: 'Timezone',
      type: 'select',
      default: 'UTC',
      options: TIMEZONES.map((tz) => ({ label: tz, value: tz })),
    },
  ],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs, options) {
    const value = ((inputs.value as string) ?? '').trim();
    const timezone = (options.timezone as string) || 'UTC';

    let ms: number;
    let inputType: string;

    if (!value || value === 'now') {
      ms = Date.now();
      inputType = 'current';
    } else if (/^\d+$/.test(value)) {
      // Plain integer: detect seconds vs ms
      const num = parseInt(value, 10);
      if (num < 9999999999) {
        ms = num * 1000;
        inputType = 'unix-seconds';
      } else {
        ms = num;
        inputType = 'unix-milliseconds';
      }
    } else {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) throw new Error(`Cannot parse date: "${value}"`);
      ms = parsed.getTime();
      inputType = 'date-string';
    }

    const date = new Date(ms);
    const unixSeconds = Math.floor(ms / 1000);

    const localFormatted = date.toLocaleString('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'long',
    });

    return {
      type: 'json',
      data: {
        input: value || '(current time)',
        inputType,
        unixSeconds,
        unixMilliseconds: ms,
        iso8601: date.toISOString(),
        rfc2822: date.toUTCString(),
        local: localFormatted,
        timezone,
        relative: formatRelative(ms),
        utcParts: {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
          day: date.getUTCDate(),
          hour: date.getUTCHours(),
          minute: date.getUTCMinutes(),
          second: date.getUTCSeconds(),
          weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getUTCDay()],
        },
      },
    };
  },
};

registry.register(tool);
export default tool;
