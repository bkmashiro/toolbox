import { Component } from './base';

const isMac = navigator.platform.toUpperCase().includes('MAC');
const mod = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  { key: '/', description: 'Focus search bar' },
  { key: 'Escape', description: 'Close tool / clear search / close modal' },
  { key: `${mod}+Enter`, description: 'Run current tool' },
  { key: `${mod}+D`, description: 'Download output' },
  { key: `${mod}+Shift+C`, description: 'Copy output to clipboard' },
  { key: `${mod}+,`, description: 'Toggle theme' },
  { key: '?', description: 'Show this help modal' },
];

export class ShortcutsModal extends Component {
  private overlay: HTMLElement;
  private isOpen = false;

  constructor() {
    super('div');
    this.overlay = this.el;
    this.build();
  }

  private build(): void {
    this.overlay.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    `;
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Keyboard shortcuts');

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      padding: var(--space-6);
      width: 100%;
      max-width: 480px;
      margin: var(--space-4);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    `;
    const title = document.createElement('h2');
    title.style.cssText = `font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);`;
    title.textContent = '⌨ Keyboard Shortcuts';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-ghost btn-icon';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const table = document.createElement('div');
    table.style.cssText = `display:flex;flex-direction:column;gap:var(--space-2);`;

    for (const s of SHORTCUTS) {
      const row = document.createElement('div');
      row.style.cssText = `
        display:flex;align-items:center;justify-content:space-between;
        padding:var(--space-2) 0;
        border-bottom:1px solid var(--color-border-light);
      `;
      const desc = document.createElement('span');
      desc.style.fontSize = 'var(--font-size-sm)';
      desc.textContent = s.description;
      const kbd = document.createElement('kbd');
      kbd.style.cssText = `
        font-family:var(--font-family-mono);
        font-size:var(--font-size-xs);
        background:var(--color-surface2);
        border:1px solid var(--color-border);
        border-radius:var(--radius-sm);
        padding:2px 6px;
        white-space:nowrap;
      `;
      kbd.textContent = s.key;
      row.appendChild(desc);
      row.appendChild(kbd);
      table.appendChild(row);
    }
    modal.appendChild(table);
    this.overlay.appendChild(modal);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  open(): void {
    this.isOpen = true;
    this.overlay.style.display = 'flex';
  }

  close(): void {
    this.isOpen = false;
    this.overlay.style.display = 'none';
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }
}
