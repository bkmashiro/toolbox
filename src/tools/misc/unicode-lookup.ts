import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

// Common Unicode blocks for reference
const UNICODE_BLOCKS = [
  { name: 'Basic Latin', start: 0x0020, end: 0x007E },
  { name: 'Latin-1 Supplement', start: 0x00A0, end: 0x00FF },
  { name: 'Latin Extended-A', start: 0x0100, end: 0x017F },
  { name: 'Greek and Coptic', start: 0x0370, end: 0x03FF },
  { name: 'Cyrillic', start: 0x0400, end: 0x04FF },
  { name: 'Hebrew', start: 0x0590, end: 0x05FF },
  { name: 'Arabic', start: 0x0600, end: 0x06FF },
  { name: 'CJK Unified Ideographs', start: 0x4E00, end: 0x9FFF },
  { name: 'Hiragana', start: 0x3040, end: 0x309F },
  { name: 'Katakana', start: 0x30A0, end: 0x30FF },
  { name: 'Mathematical Operators', start: 0x2200, end: 0x22FF },
  { name: 'Arrows', start: 0x2190, end: 0x21FF },
  { name: 'Geometric Shapes', start: 0x25A0, end: 0x25FF },
  { name: 'Miscellaneous Symbols', start: 0x2600, end: 0x26FF },
  { name: 'Emoticons (legacy)', start: 0x1F600, end: 0x1F64F },
  { name: 'Miscellaneous Symbols and Pictographs', start: 0x1F300, end: 0x1F5FF },
];

function getBlock(cp: number): string {
  for (const b of UNICODE_BLOCKS) {
    if (cp >= b.start && cp <= b.end) return b.name;
  }
  return 'Unknown';
}

function getCategory(cp: number): string {
  const c = String.fromCodePoint(cp);
  if (/\p{L}/u.test(c)) return 'Letter';
  if (/\p{N}/u.test(c)) return 'Number';
  if (/\p{P}/u.test(c)) return 'Punctuation';
  if (/\p{S}/u.test(c)) return 'Symbol';
  if (/\p{Z}/u.test(c)) return 'Separator';
  if (/\p{C}/u.test(c)) return 'Control';
  return 'Other';
}

function toUtf8Bytes(cp: number): string {
  const bytes = new TextEncoder().encode(String.fromCodePoint(cp));
  return Array.from(bytes).map(b => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' ');
}

function lookupCodePoint(cp: number): Record<string, string> {
  const char = String.fromCodePoint(cp);
  const hex = cp.toString(16).toUpperCase().padStart(4, '0');
  return {
    character: cp < 32 || (cp >= 127 && cp < 160) ? '(control)' : char,
    codePoint: `U+${hex}`,
    decimal: cp.toString(),
    htmlEntity: `&#x${hex};`,
    htmlDecimal: `&#${cp};`,
    cssEscape: `\\${hex}`,
    category: getCategory(cp),
    block: getBlock(cp),
    utf8Bytes: toUtf8Bytes(cp),
  };
}

const tool: Tool = {
  id: 'unicode-lookup',
  name: 'Unicode Lookup',
  description: 'Search Unicode characters by name, code point (U+XXXX), or character. Shows code point, category, HTML entity, and UTF-8 bytes.',
  category: 'misc',
  tags: ['unicode', 'lookup', 'character', 'code point', 'html entity', 'utf-8', 'symbol'],
  inputs: [
    {
      id: 'query',
      label: 'Search (character, U+code, or decimal)',
      type: 'text',
      placeholder: 'e.g. A or U+0041 or 65',
    },
  ],
  options: [],
  output: { type: 'html' },
  apiSupported: false,

  async run(inputs) {
    const raw = (inputs.query as string).trim();
    if (!raw) throw new Error('Please enter a character or code point');

    const codePoints: number[] = [];

    // Parse U+XXXX format
    if (/^U\+[0-9A-Fa-f]+$/i.test(raw)) {
      codePoints.push(parseInt(raw.slice(2), 16));
    }
    // Parse decimal number
    else if (/^\d+$/.test(raw)) {
      codePoints.push(parseInt(raw, 10));
    }
    // Parse multiple characters
    else {
      for (const c of [...raw]) {
        codePoints.push(c.codePointAt(0)!);
      }
    }

    if (codePoints.length === 0 || codePoints.some(cp => isNaN(cp))) {
      throw new Error('Could not parse input as Unicode');
    }

    const rows = codePoints.map(cp => {
      if (cp < 0 || cp > 0x10FFFF) return `<tr><td colspan="9">Code point 0x${cp.toString(16).toUpperCase()} is out of Unicode range</td></tr>`;
      const info = lookupCodePoint(cp);
      return `<tr>
        <td style="font-size:1.5rem;text-align:center">${info.character}</td>
        <td><code>${info.codePoint}</code></td>
        <td>${info.decimal}</td>
        <td>${info.category}</td>
        <td>${info.block}</td>
        <td><code>${info.htmlEntity}</code></td>
        <td><code>${info.htmlDecimal}</code></td>
        <td><code>${info.cssEscape}</code></td>
        <td style="font-size:0.8rem">${info.utf8Bytes}</td>
      </tr>`;
    }).join('\n');

    const html = `
<style>
table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
th, td { border: 1px solid #dee2e6; padding: 6px 10px; text-align: left; }
th { background: #f1f3f5; font-weight: 600; }
code { font-family: monospace; background: #f1f3f5; padding: 1px 4px; border-radius: 3px; }
</style>
<table>
<thead><tr>
  <th>Char</th><th>Code Point</th><th>Decimal</th><th>Category</th>
  <th>Block</th><th>HTML Entity</th><th>HTML Decimal</th><th>CSS Escape</th><th>UTF-8</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>`;

    return { type: 'html', data: html, summary: `${codePoints.length} character(s) found` };
  },
};

registry.register(tool);
export default tool;
