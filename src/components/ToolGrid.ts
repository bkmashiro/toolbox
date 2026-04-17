import { Component } from './base';
import type { Tool } from '../core/types';
import { registry } from '../core/registry';
import { loadPreferences } from '../core/preferences';
import { ToolCard } from './ToolCard';

interface ToolGridConfig {
  onSelect(toolId: string): void;
  onToggleFavorite(toolId: string): void;
  filterQuery?: string;
  filterCategory?: string;
}

export class ToolGrid extends Component {
  private config: ToolGridConfig;

  constructor(config: ToolGridConfig) {
    super('div', 'tool-grid-container');
    this.config = config;
    this.render();
  }

  render(): void {
    this.el.innerHTML = '';
    const { filterQuery, filterCategory, onSelect, onToggleFavorite } = this.config;
    const prefs = loadPreferences();
    const favorites = new Set(prefs.favorites);

    let tools: Tool[];

    if (filterQuery && filterQuery.trim()) {
      tools = registry.search(filterQuery);
      if (tools.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = `
          text-align: center;
          padding: var(--space-16);
          color: var(--color-text-muted);
        `;
        empty.innerHTML = `<div style="font-size:2rem;margin-bottom:var(--space-4)">🔍</div>
          <div>No tools found for "<strong>${filterQuery}</strong>"</div>`;
        this.el.appendChild(empty);
        return;
      }
      const section = this.buildSection(`Results for "${filterQuery}"`, tools, favorites, onSelect, onToggleFavorite);
      this.el.appendChild(section);
      return;
    }

    // Favorites section
    if (prefs.favorites.length > 0) {
      const favTools = prefs.favorites.map(id => registry.get(id)).filter(Boolean) as Tool[];
      if (favTools.length > 0) {
        const section = this.buildSection('⭐ Favorites', favTools, favorites, onSelect, onToggleFavorite);
        this.el.appendChild(section);
      }
    }

    // Category sections
    const categories = registry.getCategories();
    for (const cat of categories) {
      if (filterCategory && filterCategory !== cat.id) continue;
      const catTools = registry.getByCategory(cat.id);
      if (catTools.length === 0) continue;
      const section = this.buildSection(`${cat.icon} ${cat.label}`, catTools, favorites, onSelect, onToggleFavorite);
      this.el.appendChild(section);
    }

    if (this.el.children.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = `
        text-align:center;padding:var(--space-16);color:var(--color-text-muted);
      `;
      empty.innerHTML = `<div style="font-size:3rem;margin-bottom:var(--space-4)">🧰</div>
        <div style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-2)">No tools yet</div>
        <div>Tool implementations will appear here.</div>`;
      this.el.appendChild(empty);
    }
  }

  private buildSection(
    title: string,
    tools: Tool[],
    favorites: Set<string>,
    onSelect: (id: string) => void,
    onToggleFavorite: (id: string) => void
  ): HTMLElement {
    const section = document.createElement('div');
    section.className = 'tool-grid-section';

    const heading = document.createElement('h2');
    heading.className = 'tool-grid-category-title';
    heading.textContent = title;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'tool-grid';

    for (const tool of tools) {
      const card = new ToolCard({
        tool,
        isFavorite: favorites.has(tool.id),
        onSelect,
        onToggleFavorite,
      });
      grid.appendChild(card.getElement());
    }

    section.appendChild(grid);
    return section;
  }

  update(config: Partial<ToolGridConfig>): void {
    Object.assign(this.config, config);
    this.render();
  }
}
