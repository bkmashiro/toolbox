type ShortcutAction =
  | 'search'
  | 'escape'
  | 'run'
  | 'download'
  | 'copy'
  | 'help'
  | 'theme';

type ShortcutHandler = () => void;

const handlers: Map<ShortcutAction, ShortcutHandler> = new Map();
const isMac = navigator.platform.toUpperCase().includes('MAC');

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

/**
 * Register a handler for a shortcut action.
 */
export function onShortcut(action: ShortcutAction, handler: ShortcutHandler): void {
  handlers.set(action, handler);
}

/**
 * Remove a handler for a shortcut action.
 */
export function offShortcut(action: ShortcutAction): void {
  handlers.delete(action);
}

function trigger(action: ShortcutAction): void {
  handlers.get(action)?.();
}

/**
 * Initialize keyboard shortcuts. Call once at app startup.
 */
export function initShortcuts(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl+Enter / Cmd+Enter → run
    if (mod && e.key === 'Enter') {
      e.preventDefault();
      trigger('run');
      return;
    }

    // Ctrl+D / Cmd+D → download
    if (mod && e.key === 'd') {
      e.preventDefault();
      trigger('download');
      return;
    }

    // Ctrl+Shift+C → copy
    if (mod && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      trigger('copy');
      return;
    }

    // Ctrl+, / Cmd+, → toggle theme
    if (mod && e.key === ',') {
      e.preventDefault();
      trigger('theme');
      return;
    }

    // Keys that should not fire when in a text input
    if (isInputFocused()) return;

    // / → focus search
    if (e.key === '/') {
      e.preventDefault();
      trigger('search');
      return;
    }

    // Escape → close/clear
    if (e.key === 'Escape') {
      trigger('escape');
      return;
    }

    // ? → help modal
    if (e.key === '?') {
      trigger('help');
      return;
    }
  });
}
