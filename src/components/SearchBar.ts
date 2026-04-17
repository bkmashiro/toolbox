import { Component } from './base';
import type { Tool } from '../core/types';
import { registry } from '../core/registry';

interface SearchBarConfig {
  onSearch(query: string): void;
  onSelect(toolId: string): void;
}

export class SearchBar extends Component {
  private input: HTMLInputElement;
  private dropdown: HTMLElement;
  private config: SearchBarConfig;
  private highlightIndex = -1;
  private results: Tool[] = [];

  constructor(config: SearchBarConfig) {
    super('div', 'search-bar-wrapper');
    this.config = config;
    this.input = document.createElement('input');
    this.dropdown = document.createElement('div');
    this.build();
  }

  private build(): void {
    this.el.style.cssText = `
      position: relative;
      width: 100%;
    `;

    const inputWrapper = document.createElement('div');
    inputWrapper.style.cssText = `
      display: flex;
      align-items: center;
      background: var(--color-surface2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      padding: var(--space-1) var(--space-3);
      gap: var(--space-2);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    `;

    const searchIcon = document.createElement('span');
    searchIcon.textContent = '🔍';
    searchIcon.style.fontSize = 'var(--font-size-sm)';

    this.input.type = 'text';
    this.input.placeholder = 'Search tools... (/)';
    this.input.style.cssText = `
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: var(--font-size-sm);
      color: var(--color-text);
      padding: 2px 0;
    `;

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '✕';
    clearBtn.style.cssText = `
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
      padding: 2px;
      line-height: 1;
    `;

    inputWrapper.appendChild(searchIcon);
    inputWrapper.appendChild(this.input);
    inputWrapper.appendChild(clearBtn);
    this.el.appendChild(inputWrapper);

    // Dropdown
    this.dropdown.style.cssText = `
      display: none;
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 200;
      max-height: 320px;
      overflow-y: auto;
    `;
    this.el.appendChild(this.dropdown);

    // Events
    this.input.addEventListener('input', () => {
      const q = this.input.value;
      clearBtn.style.display = q ? '' : 'none';
      this.search(q);
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.moveHighlight(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.moveHighlight(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const tool = this.results[this.highlightIndex] ?? this.results[0];
        if (tool) this.selectTool(tool.id);
      } else if (e.key === 'Escape') {
        this.closeDropdown();
        this.input.value = '';
        clearBtn.style.display = 'none';
        this.config.onSearch('');
      }
    });

    clearBtn.addEventListener('click', () => {
      this.input.value = '';
      clearBtn.style.display = 'none';
      this.closeDropdown();
      this.config.onSearch('');
      this.input.focus();
    });

    document.addEventListener('click', (e) => {
      if (!this.el.contains(e.target as Node)) {
        this.closeDropdown();
      }
    });

    // Focus styles
    this.input.addEventListener('focus', () => {
      inputWrapper.style.borderColor = 'var(--color-accent)';
      inputWrapper.style.boxShadow = '0 0 0 3px var(--color-accent-light)';
      if (this.input.value) this.renderDropdown();
    });
    this.input.addEventListener('blur', () => {
      inputWrapper.style.borderColor = 'var(--color-border)';
      inputWrapper.style.boxShadow = '';
    });
  }

  private search(query: string): void {
    this.config.onSearch(query);
    if (!query.trim()) {
      this.closeDropdown();
      return;
    }
    this.results = registry.search(query).slice(0, 8);
    this.highlightIndex = -1;
    this.renderDropdown();
  }

  private renderDropdown(): void {
    this.dropdown.innerHTML = '';
    if (this.results.length === 0) {
      this.closeDropdown();
      return;
    }
    this.dropdown.style.display = 'block';

    this.results.forEach((tool, i) => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        cursor: pointer;
        transition: background-color var(--transition-fast);
        border-bottom: 1px solid var(--color-border-light);
      `;
      if (i === this.highlightIndex) {
        item.style.backgroundColor = 'var(--color-surface2)';
      }
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = 'var(--color-surface2)';
        this.highlightIndex = i;
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '';
      });
      item.addEventListener('click', () => {
        this.selectTool(tool.id);
      });

      const nameEl = document.createElement('span');
      nameEl.style.cssText = `font-size:var(--font-size-sm);font-weight:var(--font-weight-medium);flex:1;`;
      nameEl.textContent = tool.name;

      const catBadge = document.createElement('span');
      catBadge.className = 'badge badge-accent';
      catBadge.textContent = tool.category;

      item.appendChild(nameEl);
      item.appendChild(catBadge);
      this.dropdown.appendChild(item);
    });
  }

  private moveHighlight(delta: number): void {
    this.highlightIndex = Math.max(-1, Math.min(this.results.length - 1, this.highlightIndex + delta));
    const items = this.dropdown.children;
    for (let i = 0; i < items.length; i++) {
      (items[i] as HTMLElement).style.backgroundColor = i === this.highlightIndex ? 'var(--color-surface2)' : '';
    }
  }

  private selectTool(id: string): void {
    this.input.value = '';
    this.closeDropdown();
    this.config.onSearch('');
    this.config.onSelect(id);
  }

  private closeDropdown(): void {
    this.dropdown.style.display = 'none';
    this.results = [];
    this.highlightIndex = -1;
  }

  focus(): void {
    this.input.focus();
  }
}
