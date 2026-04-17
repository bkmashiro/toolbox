import { Component } from './base';
import type { Tool } from '../core/types';

interface ToolCardConfig {
  tool: Tool;
  isFavorite: boolean;
  onSelect(toolId: string): void;
  onToggleFavorite(toolId: string): void;
}

export class ToolCard extends Component {
  private config: ToolCardConfig;

  constructor(config: ToolCardConfig) {
    super('div', 'card tool-card');
    this.config = config;
    this.build();
  }

  private build(): void {
    const { tool, isFavorite, onSelect, onToggleFavorite } = this.config;

    this.el.style.cssText = `
      cursor: pointer;
      position: relative;
      padding: var(--space-4);
      transition: box-shadow var(--transition-fast), transform var(--transition-fast);
    `;
    this.el.setAttribute('role', 'button');
    this.el.setAttribute('tabindex', '0');
    this.el.setAttribute('aria-label', `Open ${tool.name}`);

    // Hover effect
    this.el.addEventListener('mouseenter', () => {
      this.el.style.boxShadow = 'var(--shadow-md)';
      this.el.style.transform = 'translateY(-1px)';
    });
    this.el.addEventListener('mouseleave', () => {
      this.el.style.boxShadow = 'var(--shadow-sm)';
      this.el.style.transform = '';
    });

    // Top row: icon + star
    const topRow = document.createElement('div');
    topRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-2);
    `;

    const icon = document.createElement('span');
    icon.style.fontSize = '1.5rem';
    // Derive icon from category — could also pass from registry
    const categoryIcons: Record<string, string> = {
      video: '🎬', gif: '🎞️', audio: '🎵', image: '🖼️', pdf: '📄',
      data: '📊', text: '📝', crypto: '🔐', network: '🌐',
      developer: '💻', math: '🔢', misc: '🧰',
    };
    icon.textContent = categoryIcons[tool.category] ?? '🔧';

    const starBtn = document.createElement('button');
    starBtn.className = 'btn btn-ghost btn-icon';
    starBtn.style.cssText = `
      font-size: 1rem;
      line-height: 1;
      padding: 2px;
      color: ${isFavorite ? '#f59e0b' : 'var(--color-text-muted)'};
    `;
    starBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
    starBtn.textContent = isFavorite ? '★' : '☆';
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onToggleFavorite(tool.id);
    });

    topRow.appendChild(icon);
    topRow.appendChild(starBtn);

    // Tool name
    const name = document.createElement('div');
    name.style.cssText = `
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      color: var(--color-text);
      margin-bottom: var(--space-1);
    `;
    name.textContent = tool.name;

    // Description
    const desc = document.createElement('div');
    desc.style.cssText = `
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      line-height: var(--line-height-relaxed);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `;
    desc.textContent = tool.description;

    // API badge
    if (tool.apiSupported) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-accent';
      badge.style.marginTop = 'var(--space-2)';
      badge.textContent = 'API';
      this.el.appendChild(topRow);
      this.el.appendChild(name);
      this.el.appendChild(desc);
      this.el.appendChild(badge);
    } else {
      this.el.appendChild(topRow);
      this.el.appendChild(name);
      this.el.appendChild(desc);
    }

    // Click handler
    const handleSelect = () => onSelect(tool.id);
    this.el.addEventListener('click', handleSelect);
    this.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      }
    });
  }
}
