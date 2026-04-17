// 1. Import styles
import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/tool-workspace.css';
import './styles/utilities.css';

// 2. Import core
import { initTheme } from './core/theme';
import { parseParams } from './core/url-params';
import { initShortcuts } from './core/shortcuts';

// 3. Import all tools (triggers registration)
import './tools/manifest';

// 4. Import UI components
import { App } from './components/App';

// 5. Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initShortcuts();

  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('Missing #app element');

  const app = new App(appEl);

  // Handle URL params
  const params = parseParams();
  if (params.toolId) {
    app.openTool(params.toolId, params.inputs, params.options, params.autoRun);
  }

  // Handle popstate (back/forward)
  window.addEventListener('popstate', () => {
    const p = parseParams();
    if (p.toolId) {
      app.openTool(p.toolId, p.inputs, p.options, p.autoRun);
    } else {
      app.showHome();
    }
  });
});
