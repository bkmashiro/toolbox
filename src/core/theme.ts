import { loadPreferences, savePreferences } from './preferences';

let mediaQuery: MediaQueryList | null = null;

function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Initialize theme from preferences. Adds `data-theme="dark"` or
 * `data-theme="light"` to <html>. For 'system', uses
 * matchMedia('(prefers-color-scheme: dark)') and listens for changes.
 */
export function initTheme(): void {
  const prefs = loadPreferences();
  const theme = prefs.theme ?? 'system';

  if (theme === 'system') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(getSystemTheme());
    mediaQuery.addEventListener('change', () => {
      const currentPrefs = loadPreferences();
      if (currentPrefs.theme === 'system') {
        applyTheme(getSystemTheme());
      }
    });
  } else {
    applyTheme(theme);
  }
}

/**
 * Toggle between light and dark. If currently 'system', switches to
 * the opposite of the current system preference.
 */
export function toggleTheme(): void {
  const prefs = loadPreferences();
  const currentEffective =
    prefs.theme === 'system' ? getSystemTheme() : prefs.theme;
  const next: 'light' | 'dark' = currentEffective === 'dark' ? 'light' : 'dark';
  prefs.theme = next;
  savePreferences(prefs);
  applyTheme(next);
}
