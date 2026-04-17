import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'json-path',
  name: 'JSONPath',
  description: 'Test JSONPath expressions against JSON data',
  category: 'developer',
  tags: ['jsonpath', 'json', 'query', 'xpath', 'filter', 'test', 'developer'],
  inputs: [
    {
      id: 'json',
      label: 'JSON Data',
      type: 'textarea',
      placeholder: '{\n  "store": {\n    "books": [\n      {"title": "Foo", "price": 8.95}\n    ]\n  }\n}',
      rows: 8,
    },
    {
      id: 'expression',
      label: 'JSONPath Expression',
      type: 'text',
      placeholder: '$.store.books[*].title',
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: false,
  async run(inputs) {
    const jsonStr = (inputs.json as string) ?? '';
    const expression = ((inputs.expression as string) ?? '').trim();

    if (!jsonStr) throw new Error('JSON data is required');
    if (!expression) throw new Error('JSONPath expression is required');

    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error(`Invalid JSON: ${(e as Error).message}`);
    }

    const { JSONPath } = await import('jsonpath-plus');

    let result: unknown;
    try {
      result = JSONPath({ path: expression, json: data as object });
    } catch (e) {
      throw new Error(`Invalid JSONPath expression: ${(e as Error).message}`);
    }

    const count = Array.isArray(result) ? result.length : 0;
    return {
      type: 'json',
      data: {
        expression,
        matches: count,
        result,
      },
    };
  },
};

registry.register(tool);
export default tool;
