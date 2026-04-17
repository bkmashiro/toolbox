import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function parseNumbers(raw: string): number[] {
  // Accept comma or newline separated numbers
  return raw
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => {
      const n = parseFloat(s);
      if (isNaN(n)) throw new Error(`Invalid number: "${s}"`);
      return n;
    });
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n % 2 === 0) return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return sorted[Math.floor(n / 2)];
}

function mode(nums: number[]): number[] {
  const freq: Record<number, number> = {};
  for (const n of nums) freq[n] = (freq[n] ?? 0) + 1;
  const maxFreq = Math.max(...Object.values(freq));
  if (maxFreq === 1) return []; // no mode
  return Object.entries(freq)
    .filter(([, v]) => v === maxFreq)
    .map(([k]) => parseFloat(k));
}

function quartile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
}

const tool: Tool = {
  id: 'statistics',
  name: 'Statistics',
  description: 'Statistical calculations: count, sum, min, max, mean, median, mode, variance, standard deviation, and quartiles',
  category: 'math',
  tags: ['statistics', 'stats', 'mean', 'median', 'mode', 'variance', 'standard deviation', 'quartile', 'average', 'sum'],
  inputs: [
    {
      id: 'numbers',
      label: 'Numbers (one per line or comma-separated)',
      type: 'textarea',
      placeholder: 'Enter numbers, one per line or comma-separated...\ne.g.\n1, 2, 3, 4, 5',
      rows: 8,
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: false,

  async run(inputs) {
    const raw = inputs.numbers as string;
    if (!raw.trim()) throw new Error('Please enter at least one number');

    const nums = parseNumbers(raw);
    if (nums.length === 0) throw new Error('No valid numbers found');

    const sorted = [...nums].sort((a, b) => a - b);
    const n = nums.length;
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const sampleVariance = n > 1 ? nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
    const sampleStdDev = Math.sqrt(sampleVariance);

    const q1 = quartile(sorted, 0.25);
    const q2 = quartile(sorted, 0.5);
    const q3 = quartile(sorted, 0.75);
    const iqr = q3 - q1;
    const modeNums = mode(nums);

    const result = {
      count: n,
      sum: parseFloat(sum.toPrecision(12)),
      min: sorted[0],
      max: sorted[n - 1],
      range: sorted[n - 1] - sorted[0],
      mean: parseFloat(mean.toPrecision(12)),
      median: median(sorted),
      mode: modeNums.length ? modeNums : 'none',
      variance: parseFloat(variance.toPrecision(12)),
      stdDev: parseFloat(stdDev.toPrecision(12)),
      sampleVariance: parseFloat(sampleVariance.toPrecision(12)),
      sampleStdDev: parseFloat(sampleStdDev.toPrecision(12)),
      Q1: q1,
      Q2: q2,
      Q3: q3,
      IQR: iqr,
    };

    return {
      type: 'json',
      data: result,
      summary: `${n} numbers | mean: ${result.mean} | std dev: ${result.stdDev}`,
    };
  },
};

registry.register(tool);
export default tool;
