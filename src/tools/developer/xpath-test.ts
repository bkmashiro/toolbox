import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'xpath-test',
  name: 'XPath Tester',
  description: 'Test XPath expressions against XML using the browser\'s native XPathEvaluator',
  category: 'developer',
  tags: ['xpath', 'xml', 'query', 'test', 'developer', 'expression'],
  inputs: [
    {
      id: 'xml',
      label: 'XML Document',
      type: 'textarea',
      placeholder: '<?xml version="1.0"?>\n<catalog>\n  <book id="1">\n    <title>Foo</title>\n  </book>\n</catalog>',
      rows: 8,
    },
    {
      id: 'expression',
      label: 'XPath Expression',
      type: 'text',
      placeholder: '//book/title/text()',
    },
  ],
  options: [],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs) {
    const xmlStr = (inputs.xml as string) ?? '';
    const expression = ((inputs.expression as string) ?? '').trim();

    if (!xmlStr) throw new Error('XML document is required');
    if (!expression) throw new Error('XPath expression is required');

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'application/xml');

    // Check for parse error
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error(`XML parse error: ${parseError.textContent?.trim()}`);
    }

    const evaluator = new XPathEvaluator();
    const resolver = evaluator.createNSResolver(doc.documentElement);

    let xpathResult: XPathResult;
    try {
      xpathResult = evaluator.evaluate(expression, doc, resolver, XPathResult.ANY_TYPE, null);
    } catch (e) {
      throw new Error(`XPath evaluation failed: ${(e as Error).message}`);
    }

    const results: string[] = [];

    switch (xpathResult.resultType) {
      case XPathResult.STRING_TYPE:
        results.push(xpathResult.stringValue);
        break;
      case XPathResult.NUMBER_TYPE:
        results.push(xpathResult.numberValue.toString());
        break;
      case XPathResult.BOOLEAN_TYPE:
        results.push(xpathResult.booleanValue.toString());
        break;
      default: {
        let node: Node | null;
        const s = new XMLSerializer();
        while ((node = xpathResult.iterateNext())) {
          if (node.nodeType === Node.TEXT_NODE) {
            results.push(node.textContent ?? '');
          } else {
            results.push(s.serializeToString(node));
          }
        }
      }
    }

    return {
      type: 'text',
      data: results.length
        ? `${results.length} result${results.length !== 1 ? 's' : ''}:\n\n${results.join('\n---\n')}`
        : 'No matches found',
      summary: `${results.length} match${results.length !== 1 ? 'es' : ''} for "${expression}"`,
    };
  },
};

registry.register(tool);
export default tool;
