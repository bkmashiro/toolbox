import { Component } from './base';
import { formatBytes } from '../core/utils';
import { showToast } from './Toast';

interface DropZoneConfig {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  label?: string;
  onFiles(files: File[]): void;
}

export class DropZone extends Component {
  private files: File[] = [];
  private config: DropZoneConfig;
  private input: HTMLInputElement;
  private filesArea: HTMLElement;

  constructor(config: DropZoneConfig) {
    super('div', 'dropzone');
    this.config = config;
    this.input = document.createElement('input');
    this.filesArea = document.createElement('div');
    this.build();
  }

  private build(): void {
    const { accept, multiple, label = 'Drop files here or click to upload' } = this.config;

    this.el.style.cssText = `
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-8);
      text-align: center;
      cursor: pointer;
      transition: border-color var(--transition-fast), background-color var(--transition-fast);
      background: var(--color-surface);
      user-select: none;
      position: relative;
    `;
    this.el.setAttribute('role', 'button');
    this.el.setAttribute('tabindex', '0');
    this.el.setAttribute('aria-label', label);

    // Hidden file input
    this.input.type = 'file';
    this.input.style.display = 'none';
    if (accept) this.input.accept = accept;
    if (multiple) this.input.multiple = true;
    this.el.appendChild(this.input);

    // Upload icon + label
    const iconEl = document.createElement('div');
    iconEl.style.cssText = `font-size:2rem;margin-bottom:var(--space-2);`;
    iconEl.textContent = '📂';

    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
      font-size:var(--font-size-sm);
      color:var(--color-text-secondary);
      font-weight:var(--font-weight-medium);
      margin-bottom:var(--space-1);
    `;
    labelEl.textContent = label;

    const hintEl = document.createElement('div');
    hintEl.style.cssText = `font-size:var(--font-size-xs);color:var(--color-text-muted);`;
    if (accept) {
      hintEl.textContent = `Accepted: ${accept}`;
    }

    const promptArea = document.createElement('div');
    promptArea.appendChild(iconEl);
    promptArea.appendChild(labelEl);
    promptArea.appendChild(hintEl);
    this.el.appendChild(promptArea);

    // Files area
    this.filesArea.style.cssText = `display:none;margin-top:var(--space-4);`;
    this.el.appendChild(this.filesArea);

    // Events
    this.el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.dropzone-clear')) return;
      this.input.click();
    });

    this.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.input.click();
      }
    });

    this.el.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.el.style.borderColor = 'var(--color-accent)';
      this.el.style.backgroundColor = 'var(--color-accent-light)';
    });

    this.el.addEventListener('dragleave', (e) => {
      if (!this.el.contains(e.relatedTarget as Node)) {
        this.el.style.borderColor = 'var(--color-border)';
        this.el.style.backgroundColor = 'var(--color-surface)';
      }
    });

    this.el.addEventListener('drop', (e) => {
      e.preventDefault();
      this.el.style.borderColor = 'var(--color-border)';
      this.el.style.backgroundColor = 'var(--color-surface)';
      const dt = e.dataTransfer;
      if (!dt) return;
      const dropped = Array.from(dt.files);
      this.handleFiles(dropped);
    });

    this.input.addEventListener('change', () => {
      const selected = Array.from(this.input.files ?? []);
      this.handleFiles(selected);
      this.input.value = '';
    });
  }

  private handleFiles(incoming: File[]): void {
    const { multiple, maxSize } = this.config;
    let files = multiple ? incoming : incoming.slice(0, 1);

    const rejected: string[] = [];
    files = files.filter(f => {
      if (maxSize && f.size > maxSize) {
        rejected.push(`${f.name} (${formatBytes(f.size)}) exceeds limit of ${formatBytes(maxSize)}`);
        return false;
      }
      return true;
    });

    if (rejected.length) {
      showToast({ message: `File too large: ${rejected[0]}`, type: 'error' });
    }

    if (files.length === 0) return;

    this.files = multiple ? [...this.files, ...files] : files;
    this.config.onFiles(this.files);
    this.renderFiles();
  }

  private renderFiles(): void {
    this.filesArea.style.display = 'block';
    this.filesArea.innerHTML = '';

    this.files.forEach((f) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display:flex;align-items:center;gap:var(--space-2);
        padding:var(--space-1) var(--space-2);
        background:var(--color-surface2);
        border-radius:var(--radius-sm);
        font-size:var(--font-size-xs);
        margin-bottom:var(--space-1);
      `;
      const nameEl = document.createElement('span');
      nameEl.style.cssText = `flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
      nameEl.textContent = `📄 ${f.name}`;
      const sizeEl = document.createElement('span');
      sizeEl.style.color = 'var(--color-text-muted)';
      sizeEl.textContent = formatBytes(f.size);
      row.appendChild(nameEl);
      row.appendChild(sizeEl);
      this.filesArea.appendChild(row);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-ghost btn-sm dropzone-clear';
    clearBtn.style.marginTop = 'var(--space-2)';
    clearBtn.textContent = '✕ Clear';
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clear();
    });
    this.filesArea.appendChild(clearBtn);
  }

  clear(): void {
    this.files = [];
    this.filesArea.style.display = 'none';
    this.filesArea.innerHTML = '';
    this.config.onFiles([]);
  }

  getFiles(): File[] {
    return this.files;
  }
}
