import { Component } from './base';
import type { ToolResult } from '../core/types';
import { formatBytes, downloadBlob, copyToClipboard } from '../core/utils';
import { showToast } from './Toast';

interface OutputPreviewConfig {
  result: ToolResult;
  inputSize?: number;
}

export class OutputPreview extends Component {
  private config: OutputPreviewConfig;

  constructor(config: OutputPreviewConfig) {
    super('div', 'tool-output-preview');
    this.config = config;
    this.build();
  }

  private build(): void {
    const { result, inputSize } = this.config;

    // Summary line
    if (result.summary) {
      const summary = document.createElement('div');
      summary.className = 'tool-output-summary';
      summary.textContent = result.summary;
      this.el.appendChild(summary);
    } else if (inputSize && result.type === 'file' && result.data instanceof Blob) {
      const outputSize = result.data.size;
      const pct = Math.round((1 - outputSize / inputSize) * 100);
      const summary = document.createElement('div');
      summary.className = 'tool-output-summary';
      summary.textContent = `${formatBytes(inputSize)} → ${formatBytes(outputSize)} (${pct > 0 ? pct + '% smaller' : 'no change'})`;
      this.el.appendChild(summary);
    }

    // Preview area
    const previewArea = document.createElement('div');
    previewArea.style.padding = 'var(--space-4)';

    if (result.type === 'file' && result.data instanceof Blob) {
      this.renderFilePreview(previewArea, result.data, result.filename, result.mimeType);
    } else if (result.type === 'files' && Array.isArray(result.data)) {
      this.renderFilesPreview(previewArea, result.data as Blob[], result.filenames);
    } else if (result.type === 'text' || result.type === 'json') {
      this.renderTextPreview(previewArea, String(result.type === 'json' ? JSON.stringify(result.data, null, 2) : result.data));
    } else if (result.type === 'html') {
      this.renderHtmlPreview(previewArea, result.data as string);
    }

    this.el.appendChild(previewArea);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'tool-output-actions';
    actions.style.padding = '0 var(--space-4) var(--space-4)';

    if (result.type === 'file' && result.data instanceof Blob) {
      const dlBtn = this.makeButton('⬇ Download', 'btn-primary btn-sm', () => {
        downloadBlob(result.data as Blob, result.filename ?? 'output');
      });
      actions.appendChild(dlBtn);
    } else if (result.type === 'files' && Array.isArray(result.data)) {
      const dlAllBtn = this.makeButton('⬇ Download All (ZIP)', 'btn-primary btn-sm', async () => {
        await this.downloadAllAsZip(result.data as Blob[], result.filenames);
      });
      actions.appendChild(dlAllBtn);
    } else if (result.type === 'text' || result.type === 'json') {
      const text = result.type === 'json' ? JSON.stringify(result.data, null, 2) : result.data as string;
      const copyBtn = this.makeButton('⎘ Copy', 'btn-secondary btn-sm', async () => {
        const ok = await copyToClipboard(text);
        if (ok) {
          copyBtn.textContent = '✓ Copied!';
          setTimeout(() => { copyBtn.textContent = '⎘ Copy'; }, 2000);
        }
      });
      const dlBtn = this.makeButton('⬇ Download', 'btn-ghost btn-sm', () => {
        const ext = result.type === 'json' ? '.json' : '.txt';
        const mime = result.type === 'json' ? 'application/json' : 'text/plain';
        downloadBlob(new Blob([text], { type: mime }), `output${ext}`);
      });
      actions.appendChild(copyBtn);
      actions.appendChild(dlBtn);
    }

    if (actions.children.length > 0) {
      this.el.appendChild(actions);
    }
  }

  private makeButton(label: string, cls: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `btn ${cls}`;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private renderFilePreview(container: HTMLElement, blob: Blob, filename?: string, mimeType?: string): void {
    const mime = mimeType ?? blob.type;
    const url = URL.createObjectURL(blob);

    if (mime.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = url;
      img.style.maxHeight = '400px';
      img.style.margin = '0 auto';
      img.style.borderRadius = 'var(--radius-md)';
      container.appendChild(img);
    } else if (mime.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.style.maxWidth = '100%';
      container.appendChild(video);
    } else if (mime.startsWith('audio/')) {
      const audio = document.createElement('audio');
      audio.src = url;
      audio.controls = true;
      audio.style.width = '100%';
      container.appendChild(audio);
    } else {
      const card = document.createElement('div');
      card.className = 'tool-output-file-card';
      card.innerHTML = `
        <div class="tool-output-file-icon">📄</div>
        <div>
          <div class="tool-output-file-name">${filename ?? 'output'}</div>
          <div class="tool-output-file-size">${formatBytes(blob.size)}</div>
        </div>
      `;
      container.appendChild(card);
    }
  }

  private renderFilesPreview(container: HTMLElement, blobs: Blob[], filenames?: string[]): void {
    const grid = document.createElement('div');
    grid.className = 'tool-output-files-grid';
    grid.style.padding = '0';

    blobs.forEach((blob, i) => {
      const name = filenames?.[i] ?? `file-${i + 1}`;
      const thumb = document.createElement('div');
      thumb.className = 'tool-output-file-thumb';
      thumb.addEventListener('click', () => downloadBlob(blob, name));

      if (blob.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.alt = name;
        thumb.appendChild(img);
      } else {
        const icon = document.createElement('div');
        icon.style.fontSize = '2rem';
        icon.textContent = '📄';
        thumb.appendChild(icon);
      }

      const nameEl = document.createElement('div');
      nameEl.className = 'tool-output-file-thumb-name';
      nameEl.textContent = name;
      thumb.appendChild(nameEl);

      const sizeEl = document.createElement('div');
      sizeEl.style.cssText = 'font-size:var(--font-size-xs);color:var(--color-text-muted);';
      sizeEl.textContent = formatBytes(blob.size);
      thumb.appendChild(sizeEl);

      grid.appendChild(thumb);
    });

    container.appendChild(grid);
  }

  private renderTextPreview(container: HTMLElement, text: string): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'tool-output-code';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = text;
    pre.appendChild(code);
    wrapper.appendChild(pre);
    container.appendChild(wrapper);
  }

  private renderHtmlPreview(container: HTMLElement, html: string): void {
    const iframe = document.createElement('iframe');
    iframe.className = 'tool-output-iframe';
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.srcdoc = html;
    container.appendChild(iframe);
  }

  private async downloadAllAsZip(blobs: Blob[], filenames?: string[]): Promise<void> {
    try {
      const { zipSync } = await import('fflate');
      const files: Record<string, Uint8Array> = {};
      for (let i = 0; i < blobs.length; i++) {
        const name = filenames?.[i] ?? `file-${i + 1}`;
        const buf = await blobs[i].arrayBuffer();
        files[name] = new Uint8Array(buf);
      }
      const zipped = zipSync(files);
      downloadBlob(new Blob([new Uint8Array(zipped)], { type: 'application/zip' }), 'output.zip');
    } catch (err) {
      showToast({ message: 'Failed to create ZIP', type: 'error' });
      console.error(err);
    }
  }
}
