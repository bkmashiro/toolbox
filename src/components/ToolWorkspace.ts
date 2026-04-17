import { Component } from './base';
import type { Tool, ToolResult } from '../core/types';
import { DropZone } from './DropZone';
import { OptionsPanel } from './OptionsPanel';
import { ProgressBar } from './ProgressBar';
import { OutputPreview } from './OutputPreview';
import { loadToolOptions, saveToolOptions } from '../core/preferences';
import { onShortcut, offShortcut } from '../core/shortcuts';
import { downloadBlob, copyToClipboard } from '../core/utils';
import { showToast } from './Toast';

interface ToolWorkspaceConfig {
  tool: Tool;
  initialInputs?: Record<string, string>;
  initialOptions?: Record<string, unknown>;
  autoRun?: boolean;
  onBack(): void;
}

export class ToolWorkspace extends Component {
  private config: ToolWorkspaceConfig;
  private inputValues: Record<string, File | File[] | string> = {};
  private optionValues: Record<string, unknown> = {};
  private dropzones: Map<string, DropZone> = new Map();
  private optionsPanel: OptionsPanel | null = null;
  private progressBar: ProgressBar | null = null;
  private runBtn: HTMLButtonElement | null = null;
  private outputArea: HTMLElement | null = null;
  private errorArea: HTMLElement | null = null;
  private lastResult: ToolResult | null = null;
  private isRunning = false;

  constructor(config: ToolWorkspaceConfig) {
    super('div', 'tool-workspace');
    this.config = config;
    this.initOptions();
    this.build();
    this.registerShortcuts();

    if (config.autoRun) {
      setTimeout(() => this.run(), 100);
    }
  }

  private initOptions(): void {
    const { tool, initialOptions } = this.config;
    const savedOptions = loadToolOptions(tool.id);
    for (const opt of tool.options) {
      this.optionValues[opt.id] = initialOptions?.[opt.id] ?? savedOptions[opt.id] ?? opt.default;
    }
    // Pre-fill text inputs from URL params
    if (this.config.initialInputs) {
      for (const [id, val] of Object.entries(this.config.initialInputs)) {
        this.inputValues[id] = val;
      }
    }
  }

  private build(): void {
    const { tool } = this.config;

    // Header
    const header = document.createElement('div');
    header.className = 'tool-workspace-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-ghost btn-sm tool-workspace-back';
    backBtn.innerHTML = '← Back';
    backBtn.addEventListener('click', () => this.config.onBack());

    const titleArea = document.createElement('div');
    titleArea.style.flex = '1';

    const title = document.createElement('h1');
    title.className = 'tool-workspace-title';
    title.textContent = tool.name;

    const desc = document.createElement('div');
    desc.className = 'tool-workspace-description';
    desc.textContent = tool.description;

    titleArea.appendChild(title);
    titleArea.appendChild(desc);

    if (tool.heavyDeps && tool.heavyDeps.length > 0) {
      const depsHint = document.createElement('div');
      depsHint.className = 'tool-workspace-heavy-deps';
      depsHint.textContent = `⚠ This tool uses ${tool.heavyDeps.join(', ')} — first run may require a large download.`;
      titleArea.appendChild(depsHint);
    }

    header.appendChild(backBtn);
    header.appendChild(titleArea);
    this.el.appendChild(header);

    // Body (two-col)
    const body = document.createElement('div');
    body.className = 'tool-workspace-body';

    const leftCol = document.createElement('div');
    leftCol.className = 'tool-workspace-left';

    const rightCol = document.createElement('div');
    rightCol.className = 'tool-workspace-right';

    // Inputs
    const inputSection = document.createElement('div');
    inputSection.className = 'tool-input-section';

    for (const input of tool.inputs) {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.className = 'tool-input-label';
      label.textContent = input.label + (input.required !== false ? '' : ' (optional)');
      group.appendChild(label);

      if (input.type === 'file' || input.type === 'multifile') {
        const dz = new DropZone({
          accept: input.accept,
          multiple: input.type === 'multifile',
          maxSize: input.maxSize,
          onFiles: (files) => {
            if (input.type === 'multifile') {
              this.inputValues[input.id] = files;
            } else {
              this.inputValues[input.id] = files[0] ?? '';
            }
            this.updateRunButton();
          },
        });
        this.dropzones.set(input.id, dz);
        group.appendChild(dz.getElement());
      } else if (input.type === 'text') {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'tool-text-input';
        if (input.placeholder) inp.placeholder = input.placeholder;
        if (this.inputValues[input.id]) inp.value = this.inputValues[input.id] as string;
        inp.addEventListener('input', () => {
          this.inputValues[input.id] = inp.value;
          this.updateRunButton();
        });
        group.appendChild(inp);
      } else if (input.type === 'textarea') {
        const ta = document.createElement('textarea');
        ta.className = 'tool-textarea-input';
        ta.rows = input.rows ?? 6;
        if (input.placeholder) ta.placeholder = input.placeholder;
        if (this.inputValues[input.id]) ta.value = this.inputValues[input.id] as string;
        ta.addEventListener('input', () => {
          this.inputValues[input.id] = ta.value;
          this.updateRunButton();
        });
        group.appendChild(ta);
      }

      inputSection.appendChild(group);
    }

    leftCol.appendChild(inputSection);

    // Run button + progress
    const runArea = document.createElement('div');
    runArea.className = 'tool-run-area';

    this.runBtn = document.createElement('button');
    this.runBtn.className = 'btn btn-primary btn-lg tool-run-btn';
    this.runBtn.textContent = `Run ${tool.name}`;
    this.runBtn.disabled = true;
    this.runBtn.addEventListener('click', () => this.run());
    runArea.appendChild(this.runBtn);
    leftCol.appendChild(runArea);

    // Progress bar
    this.progressBar = new ProgressBar();
    const progressArea = document.createElement('div');
    progressArea.className = 'tool-progress-area';
    progressArea.style.display = 'none';
    progressArea.appendChild(this.progressBar.getElement());
    leftCol.appendChild(progressArea);
    this.progressBar.getElement().parentElement!.style.display = 'none';

    // Error area
    this.errorArea = document.createElement('div');
    this.errorArea.className = 'tool-error-area';
    this.errorArea.style.display = 'none';
    leftCol.appendChild(this.errorArea);

    // Output area
    this.outputArea = document.createElement('div');
    this.outputArea.className = 'tool-output-area';
    this.outputArea.style.display = 'none';
    leftCol.appendChild(this.outputArea);

    // Options panel
    if (tool.options.length > 0) {
      this.optionsPanel = new OptionsPanel({
        options: tool.options,
        values: this.optionValues,
        onChange: (id, value) => {
          this.optionValues[id] = value;
          saveToolOptions(tool.id, this.optionValues);
        },
      });
      rightCol.appendChild(this.optionsPanel.getElement());
    }

    body.appendChild(leftCol);
    body.appendChild(rightCol);
    this.el.appendChild(body);

    this.updateRunButton();
  }

  private updateRunButton(): void {
    if (!this.runBtn) return;
    const { tool } = this.config;
    const allRequired = tool.inputs.every(input => {
      if (input.required === false) return true;
      const val = this.inputValues[input.id];
      if (!val) return false;
      if (Array.isArray(val)) return val.length > 0;
      if (val instanceof File) return true;
      return String(val).trim().length > 0;
    });
    this.runBtn.disabled = !allRequired || this.isRunning;
  }

  private async run(): Promise<void> {
    if (this.isRunning) return;
    const { tool } = this.config;

    this.isRunning = true;
    this.updateRunButton();

    if (this.runBtn) {
      this.runBtn.innerHTML = `<span class="spinner"></span> Running...`;
    }

    const progressParent = this.progressBar?.getElement().parentElement;
    if (progressParent) progressParent.style.display = '';
    this.progressBar?.reset();

    if (this.errorArea) this.errorArea.style.display = 'none';
    if (this.outputArea) this.outputArea.style.display = 'none';

    try {
      const result = await tool.run(
        { ...this.inputValues },
        { ...this.optionValues },
        (percent, message) => {
          this.progressBar?.update(percent, message);
        }
      );

      this.lastResult = result;
      this.progressBar?.update(100, 'Done!');

      if (this.outputArea) {
        this.outputArea.innerHTML = '';
        const inputFile = Object.values(this.inputValues).find(v => v instanceof File) as File | undefined;
        const preview = new OutputPreview({
          result,
          inputSize: inputFile?.size,
        });
        this.outputArea.appendChild(preview.getElement());
        this.outputArea.style.display = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (this.errorArea) {
        this.errorArea.textContent = `Error: ${message}`;
        this.errorArea.style.display = '';
      }
      this.progressBar?.setError('Failed');
      showToast({ message: `Error: ${message}`, type: 'error' });
    } finally {
      this.isRunning = false;
      if (this.runBtn) {
        this.runBtn.innerHTML = `Run ${tool.name}`;
      }
      this.updateRunButton();
    }
  }

  private registerShortcuts(): void {
    onShortcut('run', () => {
      if (!this.runBtn?.disabled) this.run();
    });

    onShortcut('download', () => {
      if (!this.lastResult) return;
      const r = this.lastResult;
      if (r.type === 'file' && r.data instanceof Blob) {
        downloadBlob(r.data, r.filename ?? 'output');
      }
    });

    onShortcut('copy', () => {
      if (!this.lastResult) return;
      const r = this.lastResult;
      if (r.type === 'text' || r.type === 'json') {
        const text = r.type === 'json' ? JSON.stringify(r.data, null, 2) : r.data as string;
        copyToClipboard(text).then(ok => {
          if (ok) showToast({ message: 'Copied to clipboard', type: 'success' });
        });
      }
    });
  }

  destroy(): void {
    offShortcut('run');
    offShortcut('download');
    offShortcut('copy');
    for (const dz of this.dropzones.values()) dz.destroy();
    this.optionsPanel?.destroy();
  }
}
