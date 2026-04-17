import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'csv-viewer',
  name: 'CSV Viewer',
  description: 'Render CSV as a sortable, scrollable table.',
  category: 'data',
  tags: ['csv', 'table', 'viewer', 'preview', 'sort', 'spreadsheet', 'data'],
  inputs: [
    {
      id: 'csv',
      label: 'CSV Input',
      type: 'textarea',
      placeholder: 'Paste CSV here...',
      rows: 8,
    },
  ],
  options: [
    {
      id: 'delimiter',
      label: 'Delimiter',
      type: 'select',
      default: 'auto',
      options: [
        { label: 'Auto-detect', value: 'auto' },
        { label: 'Comma (,)', value: ',' },
        { label: 'Semicolon (;)', value: ';' },
        { label: 'Tab (\\t)', value: '\t' },
        { label: 'Pipe (|)', value: '|' },
      ],
    },
    {
      id: 'header',
      label: 'First row is header',
      type: 'checkbox',
      default: true,
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(inputs, options) {
    const raw = inputs.csv as string;
    const delimiter = options.delimiter as string;
    const hasHeader = options.header as boolean;

    const Papa = await import('papaparse');
    const result = Papa.parse(raw, {
      delimiter: delimiter === 'auto' ? undefined : delimiter,
      header: false,
      skipEmptyLines: true,
    });

    const rows = result.data as string[][];
    if (rows.length === 0) {
      return { type: 'html', data: '<p>No data found.</p>' };
    }

    const headers = hasHeader ? rows[0] : rows[0].map((_, i) => `Column ${i + 1}`);
    const dataRows = hasHeader ? rows.slice(1) : rows;

    const escapeHtml = (s: string) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const headerHtml = headers
      .map(
        (h, i) =>
          `<th data-col="${i}" onclick="sortTable(this)"><span>${escapeHtml(h)}</span><span class="sort-indicator"></span></th>`
      )
      .join('');

    const rowsHtml = dataRows
      .map(
        row =>
          '<tr>' +
          headers
            .map((_, i) => `<td title="${escapeHtml(row[i] ?? '')}">${escapeHtml(row[i] ?? '')}</td>`)
            .join('') +
          '</tr>'
      )
      .join('\n');

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
.csv-viewer-container { overflow: auto; max-height: 480px; }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
th { background: #f8fafc; font-weight: 600; padding: 8px 12px; text-align: left;
     border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; cursor: pointer;
     user-select: none; white-space: nowrap; }
th:hover { background: #f1f5f9; }
td { padding: 6px 12px; border-bottom: 1px solid #e2e8f0; max-width: 300px;
     overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: #f8fafc; }
tbody tr:nth-child(even) td { background: #fafafa; }
.sort-indicator { margin-left: 4px; font-size: 0.7rem; color: #64748b; }
.asc .sort-indicator::after { content: ' ▲'; }
.desc .sort-indicator::after { content: ' ▼'; }
.meta { padding: 6px 12px; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0; background: #f8fafc; }
</style>
</head>
<body>
<div class="csv-viewer-container">
<table id="csv-table">
<thead><tr>${headerHtml}</tr></thead>
<tbody id="csv-body">${rowsHtml}</tbody>
</table>
</div>
<div class="meta">${dataRows.length} rows × ${headers.length} columns</div>
<script>
let sortCol = -1, sortDir = 1;
function sortTable(th) {
  const col = parseInt(th.dataset.col);
  if (sortCol === col) sortDir *= -1; else { sortCol = col; sortDir = 1; }
  document.querySelectorAll('th').forEach(t => t.className = '');
  th.className = sortDir === 1 ? 'asc' : 'desc';
  const tbody = document.getElementById('csv-body');
  const rows = Array.from(tbody.rows);
  rows.sort((a, b) => {
    const av = a.cells[col]?.textContent ?? '';
    const bv = b.cells[col]?.textContent ?? '';
    const an = parseFloat(av), bn = parseFloat(bv);
    if (!isNaN(an) && !isNaN(bn)) return (an - bn) * sortDir;
    return av.localeCompare(bv) * sortDir;
  });
  rows.forEach(r => tbody.appendChild(r));
}
</script>
</body>
</html>`;

    return {
      type: 'html',
      data: html,
      summary: `${dataRows.length} rows × ${headers.length} columns`,
    };
  },
};

registry.register(tool);
export default tool;
