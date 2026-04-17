import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToolGrid } from './ToolGrid';
import { ToolWorkspace } from './ToolWorkspace';
import { ShortcutsModal } from './ShortcutsModal';
import { registry } from '../core/registry';
import { addFavorite, removeFavorite, addRecent, loadPreferences } from '../core/preferences';
import { onShortcut } from '../core/shortcuts';
import { updateParams, clearParams } from '../core/url-params';

export class App {
  private root: HTMLElement;
  private shell: HTMLElement;
  private mainContent: HTMLElement;
  private sidebar: Sidebar;
  private header: Header;
  private shortcutsModal: ShortcutsModal;
  private currentWorkspace: ToolWorkspace | null = null;
  private toolGrid: ToolGrid | null = null;
  private sidebarEl: HTMLElement | null = null;
  private sidebarOverlay: HTMLElement | null = null;
  private searchQuery = '';
  private filterCategory: string | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.shell = document.createElement('div');
    this.shell.className = 'app-shell';
    this.mainContent = document.createElement('main');
    this.mainContent.className = 'main-content';
    this.shortcutsModal = new ShortcutsModal();

    this.header = new Header({
      onHamburger: () => this.toggleSidebar(),
    });

    this.sidebar = new Sidebar({
      onSelectTool: (id) => this.openTool(id),
      onSearchChange: (q) => this.handleSearch(q),
      onSelectCategory: (cat) => this.handleCategoryFilter(cat),
    });

    this.sidebarEl = this.sidebar.getElement();
    this.sidebarOverlay = document.createElement('div');
    this.sidebarOverlay.className = 'sidebar-overlay';
    this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

    this.shell.appendChild(this.header.getElement());
    this.shell.appendChild(this.sidebarEl);
    this.shell.appendChild(this.mainContent);
    document.body.appendChild(this.sidebarOverlay);
    document.body.appendChild(this.shortcutsModal.getElement());
    this.root.appendChild(this.shell);

    this.showHome();
    this.registerShortcuts();
  }

  private registerShortcuts(): void {
    onShortcut('search', () => {
      this.sidebar.focusSearch();
    });

    onShortcut('escape', () => {
      if (this.currentWorkspace) {
        this.showHome();
        clearParams();
      }
    });

    onShortcut('help', () => {
      this.shortcutsModal.toggle();
    });

    onShortcut('theme', () => {
      // theme toggle is handled in Header
    });
  }

  showHome(): void {
    if (this.currentWorkspace) {
      this.currentWorkspace.destroy();
      this.currentWorkspace = null;
    }
    this.mainContent.innerHTML = '';
    this.toolGrid = new ToolGrid({
      onSelect: (id) => this.openTool(id),
      onToggleFavorite: (id) => this.toggleFavorite(id),
      filterQuery: this.searchQuery,
      filterCategory: this.filterCategory ?? undefined,
    });
    this.mainContent.appendChild(this.toolGrid.getElement());
    clearParams();
  }

  openTool(
    toolId: string,
    initialInputs?: Record<string, string>,
    initialOptions?: Record<string, unknown>,
    autoRun?: boolean
  ): void {
    const tool = registry.get(toolId);
    if (!tool) return;

    if (this.currentWorkspace) {
      this.currentWorkspace.destroy();
      this.currentWorkspace = null;
    }

    this.mainContent.innerHTML = '';
    this.currentWorkspace = new ToolWorkspace({
      tool,
      initialInputs,
      initialOptions,
      autoRun,
      onBack: () => {
        this.showHome();
        clearParams();
      },
    });
    this.mainContent.appendChild(this.currentWorkspace.getElement());

    addRecent(toolId);
    updateParams(toolId, initialInputs ?? {}, initialOptions ?? {}, tool);
    this.closeSidebar();
  }

  private toggleFavorite(toolId: string): void {
    const prefs = loadPreferences();
    if (prefs.favorites.includes(toolId)) {
      removeFavorite(toolId);
    } else {
      addFavorite(toolId);
    }
    // Re-render grid
    if (this.toolGrid) {
      this.toolGrid.update({});
    }
  }

  private handleSearch(query: string): void {
    this.searchQuery = query;
    if (this.currentWorkspace) {
      this.showHome();
    }
    if (this.toolGrid) {
      this.toolGrid.update({ filterQuery: query });
    }
  }

  private handleCategoryFilter(cat: string | null): void {
    this.filterCategory = cat;
    if (this.currentWorkspace) {
      this.showHome();
    }
    if (this.toolGrid) {
      this.toolGrid.update({ filterCategory: cat ?? undefined });
    }
  }

  private toggleSidebar(): void {
    const isOpen = this.sidebarEl?.classList.contains('open');
    if (isOpen) this.closeSidebar();
    else this.openSidebar();
  }

  private openSidebar(): void {
    this.sidebarEl?.classList.add('open');
    this.sidebarOverlay?.classList.add('open');
  }

  private closeSidebar(): void {
    this.sidebarEl?.classList.remove('open');
    this.sidebarOverlay?.classList.remove('open');
  }
}
