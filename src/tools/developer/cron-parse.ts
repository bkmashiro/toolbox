import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'cron-parse',
  name: 'CRON Parser',
  description: 'Parse CRON expressions — human description and next 10 run times',
  category: 'developer',
  tags: ['cron', 'schedule', 'parse', 'crontab', 'recurring', 'task', 'time', 'developer'],
  inputs: [
    {
      id: 'expression',
      label: 'CRON Expression',
      type: 'text',
      placeholder: '0 9 * * 1 (every Monday at 9am)',
    },
  ],
  options: [
    {
      id: 'timezone',
      label: 'Timezone',
      type: 'text',
      default: 'UTC',
      placeholder: 'UTC or America/New_York...',
    },
  ],
  output: { type: 'json' },
  apiSupported: true,
  async run(inputs, options) {
    const expression = ((inputs.expression as string) ?? '').trim();
    if (!expression) throw new Error('CRON expression is required');

    const { parseExpression } = await import('cron-parser');
    const timezone = (options.timezone as string) || 'UTC';

    let interval;
    try {
      interval = parseExpression(expression, { tz: timezone });
    } catch (e) {
      throw new Error(`Invalid CRON expression: ${(e as Error).message}`);
    }

    const nextRuns: string[] = [];
    for (let i = 0; i < 10; i++) {
      nextRuns.push(interval.next().toISOString());
    }

    // Human-readable description
    const parts = expression.trim().split(/\s+/);
    let description = 'Runs ';
    if (parts.length >= 5) {
      const [min, hour, dom, month, dow] = parts;

      if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
        description += 'every minute';
      } else if (dom === '*' && month === '*' && dow === '*') {
        if (min === '0' && hour !== '*') description += `at ${hour}:00 every day`;
        else if (min !== '*') description += `at ${hour}:${min.padStart(2, '0')} every day`;
        else description += 'every hour';
      } else if (dom === '*' && month === '*' && dow !== '*') {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = parseInt(dow, 10) < 7 ? days[parseInt(dow, 10)] : dow;
        if (min === '0' && hour !== '*') description += `at ${hour}:00 every ${dayName}`;
        else if (min !== '*' && hour !== '*') description += `at ${hour}:${min.padStart(2, '0')} every ${dayName}`;
        else description += `every ${dayName}`;
      } else if (dom !== '*' && month === '*' && dow === '*') {
        if (min !== '*' && hour !== '*') description += `at ${hour}:${min.padStart(2, '0')} on day ${dom} of each month`;
        else description += `on day ${dom} of each month`;
      } else {
        description += `at ${hour}:${min.padStart(2, '0')} on schedule ${expression}`;
      }
    } else {
      description += `on schedule: ${expression}`;
    }

    return {
      type: 'json',
      data: {
        expression,
        timezone,
        description,
        nextRuns,
        fields: {
          minute: parts[0],
          hour: parts[1],
          dayOfMonth: parts[2],
          month: parts[3],
          dayOfWeek: parts[4],
        },
      },
    };
  },
};

registry.register(tool);
export default tool;
