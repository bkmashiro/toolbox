import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'sql-format',
  name: 'SQL Formatter',
  description: 'Format SQL queries with dialect support (MySQL, PostgreSQL, SQLite, BigQuery).',
  category: 'data',
  tags: ['sql', 'format', 'pretty', 'mysql', 'postgresql', 'sqlite', 'bigquery', 'query', 'data'],
  inputs: [
    {
      id: 'sql',
      label: 'SQL Input',
      type: 'textarea',
      placeholder: 'SELECT * FROM users WHERE id = 1;',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'dialect',
      label: 'SQL Dialect',
      type: 'select',
      default: 'sql',
      options: [
        { label: 'Standard SQL', value: 'sql' },
        { label: 'MySQL', value: 'mysql' },
        { label: 'PostgreSQL', value: 'postgresql' },
        { label: 'SQLite', value: 'sqlite' },
        { label: 'BigQuery', value: 'bigquery' },
      ],
    },
    {
      id: 'indent',
      label: 'Indentation',
      type: 'select',
      default: '2',
      options: [
        { label: '2 spaces', value: '2' },
        { label: '4 spaces', value: '4' },
        { label: 'Tab', value: 'tab' },
      ],
    },
    {
      id: 'uppercase',
      label: 'Uppercase keywords',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'linesBetween',
      label: 'Lines between queries',
      type: 'number',
      default: 1,
      min: 0,
      max: 3,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const sql = inputs.sql as string;
    const dialect = options.dialect as string;
    const indentOpt = options.indent as string;
    const uppercase = options.uppercase as boolean;
    const linesBetween = options.linesBetween as number;

    const { format } = await import('sql-formatter');

    const tabWidth = indentOpt === 'tab' ? 1 : parseInt(indentOpt, 10);
    const useTabs = indentOpt === 'tab';

    try {
      const result = format(sql, {
        language: dialect as Parameters<typeof format>[1] extends { language?: infer L } ? L : string,
        tabWidth,
        useTabs,
        keywordCase: uppercase ? 'upper' : 'preserve',
        linesBetweenQueries: linesBetween,
      });
      return { type: 'text', data: result };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { type: 'text', data: `SQL format error: ${msg}` };
    }
  },
};

registry.register(tool);
export default tool;
