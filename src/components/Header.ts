import { Component } from './base';
import { toggleTheme } from '../core/theme';
import { loadPreferences } from '../core/preferences';

interface HeaderConfig {
  onHamburger(): void;
}

export class Header extends Component {
  constructor(config: HeaderConfig) {
    super('header', 'header');
    this.build(config);
  }

  private build(config: HeaderConfig): void {
    // Hamburger (mobile)
    const hamburger = document.createElement('button');
    hamburger.className = 'btn btn-ghost btn-icon hamburger';
    hamburger.setAttribute('aria-label', 'Toggle menu');
    hamburger.innerHTML = `<span style="font-size:1.25rem">☰</span>`;
    hamburger.addEventListener('click', config.onHamburger);
    this.el.appendChild(hamburger);

    // Logo
    const logo = document.createElement('a');
    logo.className = 'header-logo';
    logo.href = '/';
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    logo.innerHTML = `
      <img src="/favicon.svg" alt="Toolbox" class="header-logo-icon">
      <span>Toolbox</span>
    `;
    this.el.appendChild(logo);

    const spacer = document.createElement('div');
    spacer.className = 'header-spacer';
    this.el.appendChild(spacer);

    const actions = document.createElement('div');
    actions.className = 'header-actions';

    // Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.className = 'btn btn-ghost btn-icon';
    themeBtn.setAttribute('aria-label', 'Toggle theme');
    const prefs = loadPreferences();
    const isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    themeBtn.textContent = isDark ? '☀️' : '🌙';
    themeBtn.addEventListener('click', () => {
      toggleTheme();
      const newDark = document.documentElement.getAttribute('data-theme') === 'dark';
      themeBtn.textContent = newDark ? '☀️' : '🌙';
    });
    actions.appendChild(themeBtn);

    // GitHub link
    const ghLink = document.createElement('a');
    ghLink.href = 'https://github.com/bkmashiro/toolbox';
    ghLink.target = '_blank';
    ghLink.rel = 'noopener noreferrer';
    ghLink.className = 'btn btn-ghost btn-icon';
    ghLink.setAttribute('aria-label', 'View on GitHub');
    ghLink.textContent = '⭐';
    ghLink.title = 'View on GitHub';
    actions.appendChild(ghLink);

    this.el.appendChild(actions);
  }
}
