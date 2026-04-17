import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { HTTP_STATUS_DATA } from './http-status-data';

const CATEGORY_COLORS: Record<string, string> = {
  '1xx': '#1c7ed6',
  '2xx': '#2f9e44',
  '3xx': '#f08c00',
  '4xx': '#e03131',
  '5xx': '#7048e8',
};

const tool: Tool = {
  id: 'http-status',
  name: 'HTTP Status Codes',
  description: 'Searchable HTTP status codes reference — all codes with descriptions',
  category: 'network',
  tags: ['http', 'status', 'codes', 'reference', 'rest', 'api', '404', '500', '200', 'network'],
  inputs: [
    {
      id: 'search',
      label: 'Search (code, name, or description)',
      type: 'text',
      placeholder: '404 or "not found"...',
      required: false,
    },
  ],
  options: [
    {
      id: 'category',
      label: 'Filter by Category',
      type: 'select',
      default: 'all',
      options: [
        { label: 'All', value: 'all' },
        { label: '1xx Informational', value: '1xx' },
        { label: '2xx Success', value: '2xx' },
        { label: '3xx Redirection', value: '3xx' },
        { label: '4xx Client Errors', value: '4xx' },
        { label: '5xx Server Errors', value: '5xx' },
      ],
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(inputs, options) {
    const search = ((inputs.search as string) ?? '').toLowerCase().trim();
    const category = options.category as string;

    let filtered = HTTP_STATUS_DATA;
    if (category !== 'all') filtered = filtered.filter((s) => s.category === category);
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.code.toString().includes(search) ||
          s.name.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search)
      );
    }

    const rows = filtered
      .map((s) => {
        const color = CATEGORY_COLORS[s.category] || '#666';
        return `<tr>
          <td style="font-weight:600;color:${color};white-space:nowrap">${s.code}</td>
          <td style="font-weight:500">${s.name}</td>
          <td style="color:#666;font-size:0.875rem">${s.category}</td>
          <td style="font-size:0.875rem">${s.description}</td>
        </tr>`;
      })
      .join('');

    const html = `<style>
      table { width:100%; border-collapse:collapse; font-family:system-ui,sans-serif; }
      th { background:#f8f9fa; padding:8px 12px; text-align:left; font-size:0.75rem; text-transform:uppercase; letter-spacing:.05em; border-bottom:2px solid #dee2e6; }
      td { padding:8px 12px; border-bottom:1px solid #f1f3f5; vertical-align:top; }
      tr:hover td { background:#f8f9fa; }
    </style>
    <p style="margin:0 0 8px;font-size:0.875rem;color:#666">${filtered.length} of ${HTTP_STATUS_DATA.length} codes shown</p>
    <table>
      <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Description</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
