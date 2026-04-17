import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'text-stats',
  name: 'Text Statistics',
  description: 'Character and word frequency table, unique words count, and longest word finder.',
  category: 'text',
  tags: ['stats', 'frequency', 'words', 'characters', 'unique', 'count', 'analysis', 'text'],
  inputs: [
    {
      id: 'text',
      label: 'Text',
      type: 'textarea',
      placeholder: 'Paste text here to analyze...',
      rows: 10,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Analysis Mode',
      type: 'select',
      default: 'words',
      options: [
        { label: 'Word frequency', value: 'words' },
        { label: 'Character frequency', value: 'chars' },
      ],
    },
    {
      id: 'topN',
      label: 'Show top N items',
      type: 'number',
      default: 20,
      min: 5,
      max: 100,
    },
    {
      id: 'caseInsensitive',
      label: 'Case insensitive',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'excludeCommon',
      label: 'Exclude common stopwords (word mode)',
      type: 'checkbox',
      default: false,
      showWhen: { optionId: 'mode', value: 'words' },
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(inputs, options) {
    const text = inputs.text as string;
    const mode = options.mode as string;
    const topN = Math.max(5, Math.min(100, options.topN as number));
    const caseInsensitive = options.caseInsensitive as boolean;
    const excludeCommon = options.excludeCommon as boolean;

    const STOPWORDS = new Set([
      'the','a','an','and','or','but','in','on','at','to','for','of','with',
      'is','it','its','was','are','be','been','being','have','has','had',
      'do','does','did','will','would','could','should','may','might',
      'i','you','he','she','we','they','this','that','these','those',
      'not','from','by','as','if','so','what','which','who','how',
    ]);

    const freq = new Map<string, number>();

    if (mode === 'words') {
      const words = text.match(/\b\w+\b/g) ?? [];
      for (let word of words) {
        if (caseInsensitive) word = word.toLowerCase();
        if (excludeCommon && STOPWORDS.has(word.toLowerCase())) continue;
        freq.set(word, (freq.get(word) ?? 0) + 1);
      }
    } else {
      for (const ch of text) {
        if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue;
        const c = caseInsensitive ? ch.toLowerCase() : ch;
        freq.set(c, (freq.get(c) ?? 0) + 1);
      }
    }

    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, topN);
    const maxCount = top[0]?.[1] ?? 1;

    // Additional stats (word mode)
    const allWords = text.match(/\b\w+\b/g) ?? [];
    const uniqueWords = new Set(allWords.map(w => w.toLowerCase())).size;
    const longestWord = allWords.reduce((a, b) => (b.length > a.length ? b : a), '');
    const avgWordLen =
      allWords.length > 0
        ? (allWords.reduce((s, w) => s + w.length, 0) / allWords.length).toFixed(1)
        : '0';

    const escapeHtml = (s: string) =>
      String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const tableRows = top
      .map(([item, count], i) => {
        const pct = ((count / maxCount) * 100).toFixed(0);
        return `<tr>
          <td>${i + 1}</td>
          <td><code>${escapeHtml(item)}</code></td>
          <td>${count}</td>
          <td class="bar-cell"><div class="freq-bar" style="width:${pct}%"></div></td>
        </tr>`;
      })
      .join('\n');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; padding: 16px; color: #1e293b; }
h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 16px 0 8px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; margin-bottom: 20px; }
.stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
.stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { font-size: 22px; font-weight: 700; color: #3b82f6; font-family: monospace; }
.stat-detail { font-size: 11px; color: #94a3b8; margin-top: 1px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 5px 8px; font-weight: 600; font-size: 11px; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
td { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; }
code { font-family: monospace; }
.bar-cell { width: 100px; }
.freq-bar { height: 10px; background: #3b82f6; border-radius: 2px; opacity: 0.7; min-width: 2px; }
tr:hover td { background: #f8fafc; }
</style>
</head>
<body>
<div class="stats-grid">
  <div class="stat-card"><div class="stat-label">Total Words</div><div class="stat-value">${allWords.length}</div></div>
  <div class="stat-card"><div class="stat-label">Unique Words</div><div class="stat-value">${uniqueWords}</div></div>
  <div class="stat-card"><div class="stat-label">Avg Word Length</div><div class="stat-value">${avgWordLen}</div><div class="stat-detail">characters</div></div>
  <div class="stat-card"><div class="stat-label">Longest Word</div><div class="stat-value" style="font-size:14px;word-break:break-all">${escapeHtml(longestWord)}</div><div class="stat-detail">${longestWord.length} chars</div></div>
  <div class="stat-card"><div class="stat-label">Unique ${mode === 'words' ? 'Words' : 'Chars'}</div><div class="stat-value">${freq.size}</div></div>
</div>
<h3>Top ${topN} ${mode === 'words' ? 'Words' : 'Characters'} by Frequency</h3>
<table>
<thead><tr><th>#</th><th>${mode === 'words' ? 'Word' : 'Char'}</th><th>Count</th><th>Frequency</th></tr></thead>
<tbody>${tableRows}</tbody>
</table>
</body>
</html>`;

    return {
      type: 'html',
      data: html,
      summary: `${allWords.length} words, ${uniqueWords} unique`,
    };
  },
};

registry.register(tool);
export default tool;
