import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function lcsLength(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}

const tool: Tool = {
  id: 'string-similarity',
  name: 'String Similarity',
  description: 'Compare two strings using Levenshtein distance, similarity percentage, and LCS length',
  category: 'text',
  tags: ['string', 'similarity', 'levenshtein', 'distance', 'lcs', 'compare', 'diff', 'fuzzy'],
  inputs: [
    {
      id: 'str1',
      label: 'String A',
      type: 'text',
      placeholder: 'Enter first string...',
      required: true,
    },
    {
      id: 'str2',
      label: 'String B',
      type: 'text',
      placeholder: 'Enter second string...',
      required: true,
    },
  ],
  options: [],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs) {
    const a = inputs.str1 as string;
    const b = inputs.str2 as string;

    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    const similarity = maxLen === 0 ? 100 : Math.round((1 - dist / maxLen) * 10000) / 100;
    const lcs = lcsLength(a, b);

    const lines = [
      `String A: "${a}"`,
      `String B: "${b}"`,
      '',
      `Levenshtein Distance : ${dist}`,
      `Similarity           : ${similarity}%`,
      `LCS Length           : ${lcs}`,
      `String A length      : ${a.length}`,
      `String B length      : ${b.length}`,
    ];

    return {
      type: 'text',
      data: lines.join('\n'),
      summary: `${similarity}% similar (distance: ${dist})`,
    };
  },
};

registry.register(tool);
export default tool;
