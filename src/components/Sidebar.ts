import { Component } from './base';
import { registry } from '../core/registry';
import { SearchBar } from './SearchBar';
import { loadPreferences } from '../core/preferences';

interface SidebarConfig {
  onSelectTool(toolId: string): void;
  onSearchChange(query: string): void;
  onSelectCategory(categoryId: string | null): void;
}

export class Sidebar extends Component {
  private searchBar: SearchBar;
  private config: SidebarConfig;

  constructor(config: SidebarConfig) {
    super('aside', 'sidebar');
    this.config = config;
    this.searchBar = new SearchBar({
      onSearch: config.onSearchChange,
      onSelect: config.onSelectTool,
    });
    this.build();
  }

  private build(): void {
    // Search section
    const searchSection = document.createElement('div');
    searchSection.className = 'sidebar-section';
    searchSection.appendChild(this.searchBar.getElement());
    this.el.appendChild(searchSection);

    // Favorites section
    const prefs = loadPreferences();
    if (prefs.favorites.length > 0) {
      const favSection = document.createElement('div');
      favSection.className = 'sidebar-section';
      const title = document.createElement('div');
      title.className = 'sidebar-section-title';
      title.textContent = 'Favorites';
      favSection.appendChild(title);
      for (const id of prefs.favorites.slice(0, 5)) {
        const tool = registry.get(id);
        if (!tool) continue;
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.textContent = `★ ${tool.name}`;
        item.addEventListener('click', () => this.config.onSelectTool(id));
        favSection.appendChild(item);
      }
      this.el.appendChild(favSection);
    }

    // Recent section
    if (prefs.recent.length > 0) {
      const recentSection = document.createElement('div');
      recentSection.className = 'sidebar-section';
      const title = document.createElement('div');
      title.className = 'sidebar-section-title';
      title.textContent = 'Recent';
      recentSection.appendChild(title);
      for (const id of prefs.recent.slice(0, 5)) {
        const tool = registry.get(id);
        if (!tool) continue;
        const item = document.createElement('div');
        item.className = 'sidebar-item';
        item.textContent = tool.name;
        item.addEventListener('click', () => this.config.onSelectTool(id));
        recentSection.appendChild(item);
      }
      this.el.appendChild(recentSection);
    }

    // Categories section
    const catSection = document.createElement('div');
    catSection.className = 'sidebar-section';
    const catTitle = document.createElement('div');
    catTitle.className = 'sidebar-section-title';
    catTitle.textContent = 'Categories';
    catSection.appendChild(catTitle);

    // All item
    const allItem = document.createElement('div');
    allItem.className = 'sidebar-item active';
    allItem.textContent = '🧰 All Tools';
    allItem.dataset['category'] = '';
    allItem.addEventListener('click', () => this.selectCategory(null, allItem));
    catSection.appendChild(allItem);

    for (const cat of registry.getCategories()) {
      const count = registry.getByCategory(cat.id).length;
      if (count === 0) continue;
      const item = document.createElement('div');
      item.className = 'sidebar-item';
      item.dataset['category'] = cat.id;
      item.innerHTML = `<span class="sidebar-item-icon">${cat.icon}</span><span>${cat.label}</span><span style="margin-left:auto;font-size:var(--font-size-xs);color:var(--color-text-muted)">${count}</span>`;
      item.addEventListener('click', () => this.selectCategory(cat.id, item));
      catSection.appendChild(item);
    }

    this.el.appendChild(catSection);
  }

  private selectCategory(id: string | null, el: HTMLElement): void {
    // Update active states
    this.el.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    el.classList.add('active');
    this.config.onSelectCategory(id);
  }

  focusSearch(): void {
    this.searchBar.focus();
  }
}
