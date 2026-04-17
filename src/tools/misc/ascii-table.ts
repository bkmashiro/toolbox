import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const CONTROL_NAMES: Record<number, string> = {
  0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ',
  6: 'ACK', 7: 'BEL (\\a)', 8: 'BS (\\b)', 9: 'HT (\\t)', 10: 'LF (\\n)',
  11: 'VT (\\v)', 12: 'FF (\\f)', 13: 'CR (\\r)', 14: 'SO', 15: 'SI',
  16: 'DLE', 17: 'DC1', 18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK',
  22: 'SYN', 23: 'ETB', 24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC',
  28: 'FS', 29: 'GS', 30: 'RS', 31: 'US', 127: 'DEL',
};

function getCharDisplay(code: number): string {
  if (CONTROL_NAMES[code]) return CONTROL_NAMES[code];
  if (code === 32) return 'SPACE';
  return String.fromCharCode(code);
}

const tool: Tool = {
  id: 'ascii-table',
  name: 'ASCII Table',
  description: 'Complete ASCII 0–127 reference table with decimal, hex, binary, character, and description. Filterable.',
  category: 'misc',
  tags: ['ascii', 'table', 'reference', 'character', 'decimal', 'hex', 'binary', 'code'],
  inputs: [
    {
      id: 'filter',
      label: 'Filter (decimal, hex, or character)',
      type: 'text',
      placeholder: 'e.g. A or 65 or 0x41',
      required: false,
    },
  ],
  options: [
    {
      id: 'extended',
      label: 'Show Extended ASCII (128-255)',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'html' },
  apiSupported: false,

  async run(inputs, options) {
    const filter = (inputs.filter as string ?? '').trim().toLowerCase();
    const showExtended = options.extended as boolean;
    const maxCode = showExtended ? 255 : 127;

    const rows: Array<{ dec: number; hex: string; bin: string; char: string; desc: string }> = [];

    for (let code = 0; code <= maxCode; code++) {
      const hex = code.toString(16).toUpperCase().padStart(2, '0');
      const bin = code.toString(2).padStart(8, '0');
      const char = getCharDisplay(code);

      let desc = '';
      if (CONTROL_NAMES[code]) desc = 'Control character';
      else if (code === 32) desc = 'Space';
      else if (code >= 33 && code <= 47) desc = 'Punctuation';
      else if (code >= 48 && code <= 57) desc = 'Digit';
      else if (code >= 58 && code <= 64) desc = 'Punctuation';
      else if (code >= 65 && code <= 90) desc = 'Uppercase letter';
      else if (code >= 91 && code <= 96) desc = 'Punctuation / symbol';
      else if (code >= 97 && code <= 122) desc = 'Lowercase letter';
      else if (code >= 123 && code <= 126) desc = 'Punctuation / symbol';
      else if (code === 127) desc = 'Delete (control)';
      else desc = 'Extended ASCII';

      rows.push({ dec: code, hex, bin, char, desc });
    }

    // Filter
    const filtered = filter
      ? rows.filter(r =>
          r.dec.toString() === filter ||
          r.hex.toLowerCase() === filter.replace(/^0x/, '') ||
          `0x${r.hex.toLowerCase()}` === filter ||
          r.char.toLowerCase() === filter
        )
      : rows;

    const tableRows = filtered.map(r =>
      `<tr>
        <td>${r.dec}</td>
        <td><code>0x${r.hex}</code></td>
        <td><code>${r.bin}</code></td>
        <td style="font-weight:600;text-align:center">${r.char}</td>
        <td>${r.desc}</td>
      </tr>`
    ).join('\n');

    const html = `
<style>
table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
th, td { border: 1px solid #dee2e6; padding: 5px 10px; text-align: left; }
th { background: #f1f3f5; font-weight: 600; position: sticky; top: 0; }
tr:nth-child(even) { background: #f8f9fa; }
code { font-family: monospace; font-size: 0.85em; }
</style>
<table>
<thead><tr>
  <th>Decimal</th><th>Hex</th><th>Binary</th><th>Char</th><th>Description</th>
</tr></thead>
<tbody>${tableRows}</tbody>
</table>
<p style="font-size:0.75rem;color:#868e96;margin-top:8px">${filtered.length} characters shown</p>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
