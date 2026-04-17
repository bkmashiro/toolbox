import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'code-format',
  name: 'Code Format',
  description: 'Format code with Prettier — JavaScript, TypeScript, JSON, CSS, HTML, Markdown',
  category: 'developer',
  tags: ['prettier', 'format', 'code', 'js', 'ts', 'json', 'css', 'html', 'beautify', 'developer'],
  inputs: [
    {
      id: 'code',
      label: 'Code',
      type: 'textarea',
      placeholder: 'Paste your code here...',
      rows: 14,
    },
  ],
  options: [
    {
      id: 'language',
      label: 'Language',
      type: 'select',
      default: 'javascript',
      options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'JSON', value: 'json' },
        { label: 'CSS', value: 'css' },
        { label: 'HTML', value: 'html' },
        { label: 'Markdown', value: 'markdown' },
        { label: 'YAML', value: 'yaml' },
        { label: 'GraphQL', value: 'graphql' },
      ],
    },
    {
      id: 'tabWidth',
      label: 'Tab Width',
      type: 'select',
      default: '2',
      options: [
        { label: '2 spaces', value: '2' },
        { label: '4 spaces', value: '4' },
      ],
    },
    {
      id: 'useTabs',
      label: 'Use Tabs',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'singleQuote',
      label: 'Single Quotes (JS/TS)',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'semi',
      label: 'Semicolons',
      type: 'checkbox',
      default: true,
    },
    {
      id: 'printWidth',
      label: 'Print Width',
      type: 'select',
      default: '80',
      options: [
        { label: '80', value: '80' },
        { label: '100', value: '100' },
        { label: '120', value: '120' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(inputs, options) {
    const code = (inputs.code as string) ?? '';
    if (!code.trim()) throw new Error('Code is required');

    const language = options.language as string;
    const tabWidth = parseInt(options.tabWidth as string, 10);
    const useTabs = options.useTabs as boolean;
    const singleQuote = options.singleQuote as boolean;
    const semi = options.semi as boolean;
    const printWidth = parseInt(options.printWidth as string, 10);

    // Load Prettier from CDN
    type PrettierModule = {
      format: (code: string, opts: Record<string, unknown>) => Promise<string>;
    };

    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(s);
      });

    const prettierBase = 'https://cdn.jsdelivr.net/npm/prettier@3.2.5';
    await loadScript(`${prettierBase}/standalone.js`);

    const parserMap: Record<string, string> = {
      javascript: 'babel',
      typescript: 'babel-ts',
      json: 'json',
      css: 'css',
      html: 'html',
      markdown: 'markdown',
      yaml: 'yaml',
      graphql: 'graphql',
    };

    const parserPluginMap: Record<string, string> = {
      babel: 'babel',
      'babel-ts': 'babel-ts',
      json: 'babel',
      css: 'postcss',
      html: 'html',
      markdown: 'markdown',
      yaml: 'yaml',
      graphql: 'graphql',
    };

    const parser = parserMap[language] || 'babel';
    const pluginFile = parserPluginMap[parser] || 'babel';
    await loadScript(`${prettierBase}/plugins/${pluginFile}.js`);

    const prettier = (globalThis as unknown as { prettier: PrettierModule }).prettier;
    if (!prettier) throw new Error('Prettier not loaded from CDN');

    const plugins = (globalThis as unknown as Record<string, unknown[]>).prettierPlugins
      ? Object.values((globalThis as unknown as { prettierPlugins: Record<string, unknown> }).prettierPlugins)
      : [];

    let formatted: string;
    try {
      formatted = await prettier.format(code, {
        parser,
        tabWidth,
        useTabs,
        singleQuote,
        semi,
        printWidth,
        plugins,
      });
    } catch (e) {
      throw new Error(`Prettier error: ${(e as Error).message}`);
    }

    return {
      type: 'text',
      data: formatted,
      summary: `Formatted ${language} (tabWidth: ${useTabs ? 'tabs' : tabWidth}, printWidth: ${printWidth})`,
    };
  },
};

registry.register(tool);
export default tool;
