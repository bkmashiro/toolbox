import type { UserPreferences } from './types';

const STORAGE_KEY = 'toolbox-prefs';
const TOOL_OPTIONS_PREFIX = 'toolbox-opts-'; // per-tool option persistence

const DEFAULTS: UserPreferences = {
  favorites: [],
  recent: [],
  theme: 'system',
  sidebarCollapsed: false,
  optionsPanelCollapsed: false,
};

/**
 * Load preferences from localStorage.
 * Returns defaults if not found or corrupted.
 */
export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * Save preferences to localStorage.
 */
export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage quota exceeded or unavailable — ignore
  }
}

/**
 * Add a tool to favorites.
 */
export function addFavorite(toolId: string): void {
  const prefs = loadPreferences();
  if (!prefs.favorites.includes(toolId)) {
    prefs.favorites.push(toolId);
    savePreferences(prefs);
  }
}

/**
 * Remove a tool from favorites.
 */
export function removeFavorite(toolId: string): void {
  const prefs = loadPreferences();
  prefs.favorites = prefs.favorites.filter(id => id !== toolId);
  savePreferences(prefs);
}

/**
 * Record a tool as recently used (moves to front, caps at 20).
 */
export function addRecent(toolId: string): void {
  const prefs = loadPreferences();
  prefs.recent = prefs.recent.filter(id => id !== toolId);
  prefs.recent.unshift(toolId);
  prefs.recent = prefs.recent.slice(0, 20);
  savePreferences(prefs);
}

/**
 * Save option values for a specific tool.
 */
export function saveToolOptions(toolId: string, options: Record<string, unknown>): void {
  try {
    localStorage.setItem(TOOL_OPTIONS_PREFIX + toolId, JSON.stringify(options));
  } catch {
    // ignore
  }
}

/**
 * Load saved option values for a specific tool.
 * Returns empty object if not found.
 */
export function loadToolOptions(toolId: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(TOOL_OPTIONS_PREFIX + toolId);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
