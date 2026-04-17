import { Component } from './base';

interface ProgressBarConfig {
  showPercent?: boolean;
  showMessage?: boolean;
  height?: number;
}

export class ProgressBar extends Component {
  private barEl: HTMLElement;
  private percentEl: HTMLElement;
  private messageEl: HTMLElement;
  private config: Required<ProgressBarConfig>;

  constructor(config: ProgressBarConfig = {}) {
    super('div', 'progress-bar-wrapper');
    this.config = {
      showPercent: config.showPercent ?? true,
      showMessage: config.showMessage ?? true,
      height: config.height ?? 8,
    };
    this.barEl = document.createElement('div');
    this.percentEl = document.createElement('span');
    this.messageEl = document.createElement('div');
    this.build();
  }

  private build(): void {
    const { height } = this.config;

    // Track + bar row
    const row = document.createElement('div');
    row.style.cssText = `display:flex;align-items:center;gap:0.5rem;`;

    const track = document.createElement('div');
    track.style.cssText = `
      flex:1;
      height:${height}px;
      background:var(--color-surface3);
      border-radius:9999px;
      overflow:hidden;
    `;

    this.barEl.style.cssText = `
      height:100%;
      width:0%;
      background:var(--color-accent);
      border-radius:9999px;
      transition:width 200ms ease, background-color 200ms ease;
    `;
    track.appendChild(this.barEl);

    if (this.config.showPercent) {
      this.percentEl.style.cssText = `
        min-width:3rem;
        text-align:right;
        font-size:var(--font-size-xs);
        color:var(--color-text-secondary);
        font-variant-numeric:tabular-nums;
      `;
      this.percentEl.textContent = '0%';
      row.appendChild(track);
      row.appendChild(this.percentEl);
    } else {
      row.appendChild(track);
    }

    this.el.appendChild(row);

    if (this.config.showMessage) {
      this.messageEl.style.cssText = `
        font-size:var(--font-size-xs);
        color:var(--color-text-muted);
        margin-top:0.25rem;
        min-height:1.2em;
      `;
      this.el.appendChild(this.messageEl);
    }
  }

  update(percent: number, message?: string): void {
    if (percent === -1) {
      // Indeterminate
      this.barEl.style.width = '100%';
      this.barEl.style.animation = 'progress-indeterminate 1.2s ease infinite';
      this.barEl.style.background = 'linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-hover) 50%, var(--color-accent) 100%)';
      if (this.config.showPercent) this.percentEl.textContent = '...';
    } else {
      const pct = Math.min(100, Math.max(0, percent));
      this.barEl.style.animation = '';
      this.barEl.style.width = `${pct}%`;
      this.barEl.style.background = pct === 100 ? 'var(--color-success)' : 'var(--color-accent)';
      if (this.config.showPercent) this.percentEl.textContent = `${pct}%`;
    }
    if (this.config.showMessage && message !== undefined) {
      this.messageEl.textContent = message;
    }
  }

  reset(): void {
    this.barEl.style.animation = '';
    this.barEl.style.width = '0%';
    this.barEl.style.background = 'var(--color-accent)';
    if (this.config.showPercent) this.percentEl.textContent = '0%';
    if (this.config.showMessage) this.messageEl.textContent = '';
  }

  setError(message: string): void {
    this.barEl.style.animation = '';
    this.barEl.style.background = 'var(--color-error)';
    if (this.config.showMessage) {
      this.messageEl.textContent = message;
      this.messageEl.style.color = 'var(--color-error)';
    }
  }
}
