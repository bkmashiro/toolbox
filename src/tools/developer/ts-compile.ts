import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'ts-compile',
  name: 'TS to JS',
  description: 'Compile TypeScript to JavaScript using the TypeScript compiler from CDN',
  category: 'developer',
  tags: ['typescript', 'ts', 'javascript', 'js', 'compile', 'transpile', 'developer'],
  inputs: [
    {
      id: 'typescript',
      label: 'TypeScript Code',
      type: 'textarea',
      placeholder: 'const greeting: string = "Hello, World!";\nconsole.log(greeting);',
      rows: 12,
    },
  ],
  options: [
    {
      id: 'target',
      label: 'Target',
      type: 'select',
      default: 'ES2020',
      options: [
        { label: 'ES5', value: 'ES5' },
        { label: 'ES2015 (ES6)', value: 'ES2015' },
        { label: 'ES2020', value: 'ES2020' },
        { label: 'ESNext', value: 'ESNext' },
      ],
    },
    {
      id: 'module',
      label: 'Module',
      type: 'select',
      default: 'ESNext',
      options: [
        { label: 'CommonJS', value: 'CommonJS' },
        { label: 'ESNext', value: 'ESNext' },
        { label: 'None', value: 'None' },
      ],
    },
    {
      id: 'strict',
      label: 'Strict Mode',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'jsx',
      label: 'JSX',
      type: 'select',
      default: 'None',
      options: [
        { label: 'None', value: 'None' },
        { label: 'React', value: 'React' },
        { label: 'React JSX (modern)', value: 'ReactJSX' },
        { label: 'Preserve', value: 'Preserve' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const code = (inputs.typescript as string) ?? '';
    if (!code.trim()) throw new Error('TypeScript code is required');

    const target = options.target as string;
    const module = options.module as string;
    const strict = options.strict as boolean;
    const jsx = options.jsx as string;

    // Load TypeScript compiler from CDN
    const tsScript = document.createElement('script');
    tsScript.src = 'https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.js';

    await new Promise<void>((resolve, reject) => {
      tsScript.onload = () => resolve();
      tsScript.onerror = () => reject(new Error('Failed to load TypeScript compiler from CDN'));
      document.head.appendChild(tsScript);
    });

    const ts = (globalThis as unknown as { ts: { transpileModule: (code: string, opts: unknown) => { outputText: string; diagnostics?: unknown[] } } }).ts;
    if (!ts) throw new Error('TypeScript compiler not available');

    const targetMap: Record<string, number> = { ES5: 1, ES2015: 2, ES2020: 7, ESNext: 99 };
    const moduleMap: Record<string, number> = { None: 0, CommonJS: 1, ESNext: 99 };
    const jsxMap: Record<string, number> = { None: 0, Preserve: 1, React: 2, ReactJSX: 4 };

    const result = ts.transpileModule(code, {
      compilerOptions: {
        target: targetMap[target] ?? 7,
        module: moduleMap[module] ?? 99,
        strict,
        jsx: jsxMap[jsx] ?? 0,
        removeComments: false,
      },
    });

    return {
      type: 'text',
      data: result.outputText,
      summary: `Compiled TypeScript → JavaScript (target: ${target}, module: ${module})`,
    };
  },
};

registry.register(tool);
export default tool;
