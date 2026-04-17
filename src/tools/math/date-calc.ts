import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function parseDate(s: string): Date {
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: "${s}"`);
  return d;
}

function diffDates(a: Date, b: Date): { days: number; weeks: number; months: number; years: number } {
  const msPerDay = 86400000;
  const days = Math.round((b.getTime() - a.getTime()) / msPerDay);
  const weeks = days / 7;

  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  const dayDiff = b.getDate() - a.getDate();
  if (dayDiff < 0) months--;
  const years = months / 12;

  return { days, weeks, months, years };
}

function addToDate(date: Date, amount: number, unit: string): Date {
  const d = new Date(date);
  switch (unit) {
    case 'days':   d.setDate(d.getDate() + amount); break;
    case 'weeks':  d.setDate(d.getDate() + amount * 7); break;
    case 'months': d.setMonth(d.getMonth() + amount); break;
    case 'years':  d.setFullYear(d.getFullYear() + amount); break;
    default: throw new Error(`Unknown unit: ${unit}`);
  }
  return d;
}

const tool: Tool = {
  id: 'date-calc',
  name: 'Date Calculator',
  description: 'Calculate difference between two dates or add/subtract time units from a date',
  category: 'math',
  tags: ['date', 'calculator', 'difference', 'add', 'subtract', 'days', 'weeks', 'months', 'years', 'time'],
  inputs: [
    {
      id: 'dateA',
      label: 'Date A (start date)',
      type: 'text',
      placeholder: 'e.g. 2024-01-01 or January 1, 2024',
    },
    {
      id: 'dateB',
      label: 'Date B (end date, for difference mode)',
      type: 'text',
      placeholder: 'e.g. 2024-12-31',
      required: false,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'difference',
      options: [
        { label: 'Difference (A → B)', value: 'difference' },
        { label: 'Add to Date A', value: 'add' },
        { label: 'Subtract from Date A', value: 'subtract' },
      ],
    },
    {
      id: 'amount',
      label: 'Amount (for add/subtract)',
      type: 'number',
      default: 30,
      min: 0,
      step: 1,
      showWhen: { optionId: 'mode', value: 'add' },
    },
    {
      id: 'unit',
      label: 'Unit (for add/subtract)',
      type: 'select',
      default: 'days',
      options: [
        { label: 'Days', value: 'days' },
        { label: 'Weeks', value: 'weeks' },
        { label: 'Months', value: 'months' },
        { label: 'Years', value: 'years' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: true,

  async run(inputs, options) {
    const rawA = (inputs.dateA as string).trim();
    if (!rawA) throw new Error('Date A is required');
    const dateA = parseDate(rawA);
    const mode = options.mode as string;

    const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (mode === 'difference') {
      const rawB = (inputs.dateB as string)?.trim();
      if (!rawB) throw new Error('Date B is required for difference mode');
      const dateB = parseDate(rawB);

      const diff = diffDates(dateA, dateB);
      const sign = diff.days < 0 ? 'before' : 'after';
      const absDays = Math.abs(diff.days);
      const absWeeks = Math.abs(diff.weeks);
      const absMonths = Math.abs(Math.floor(diff.months));
      const absYears = Math.abs(diff.years);

      const lines = [
        `From: ${fmt(dateA)}`,
        `To:   ${fmt(dateB)}`,
        ``,
        `Difference:`,
        `  ${absDays} days (${sign})`,
        `  ${absWeeks.toFixed(2)} weeks`,
        `  ${absMonths} months (approx)`,
        `  ${absYears.toFixed(4)} years (approx)`,
      ];
      return { type: 'text', data: lines.join('\n') };
    } else {
      const amount = (mode === 'subtract' ? -1 : 1) * (options.amount as number);
      const unit = options.unit as string;
      const result = addToDate(dateA, amount, unit);

      const lines = [
        `Start: ${fmt(dateA)}`,
        `Operation: ${mode === 'subtract' ? 'subtract' : 'add'} ${Math.abs(amount)} ${unit}`,
        `Result: ${fmt(result)}`,
        `ISO: ${result.toISOString().slice(0, 10)}`,
      ];
      return { type: 'text', data: lines.join('\n') };
    }
  },
};

registry.register(tool);
export default tool;
