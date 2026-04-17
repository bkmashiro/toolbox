import type { Tool } from './types';

export interface ParsedParams {
  toolId: string | null;
  inputs: Record<string, string>;   // input values (text only, files cannot be URL-driven)
  options: Record<string, string>;  // option values as strings
  autoRun: boolean;                 // whether to auto-execute
}

/**
 * Parse the current URL search params.
 *
 * Convention:
 *   ?tool=<id>                    -- select tool
 *   ?tool=<id>&input=<value>      -- pre-fill the first text input (shorthand)
 *   ?tool=<id>&input.<id>=<value> -- pre-fill a specific input by ID
 *   ?tool=<id>&<optionId>=<value> -- pre-fill an option
 *   ?tool=<id>&run=1              -- auto-execute after pre-fill
 */
export function parseParams(): ParsedParams {
  const sp = new URLSearchParams(window.location.search);
  const toolId = sp.get('tool');
  const autoRun = sp.get('run') === '1';
  const inputs: Record<string, string> = {};
  const options: Record<string, string> = {};

  for (const [key, value] of sp.entries()) {
    if (key === 'tool' || key === 'run') continue;
    if (key === 'input') {
      inputs['_shorthand'] = value;
    } else if (key.startsWith('input.')) {
      inputs[key.slice('input.'.length)] = value;
    } else {
      options[key] = value;
    }
  }

  return { toolId, inputs, options, autoRun };
}

/**
 * Update the URL to reflect the current tool state (pushState, no reload).
 */
export function updateParams(
  toolId: string,
  inputs: Record<string, string>,
  options: Record<string, unknown>,
  tool: Tool
): void {
  const sp = new URLSearchParams();
  sp.set('tool', toolId);

  for (const [key, value] of Object.entries(inputs)) {
    if (value) sp.set(`input.${key}`, value);
  }

  for (const opt of tool.options) {
    const val = options[opt.id];
    if (val !== undefined && val !== opt.default) {
      sp.set(opt.id, String(val));
    }
  }

  const url = `${window.location.pathname}?${sp.toString()}`;
  window.history.pushState({}, '', url);
}

/**
 * Clear all params (navigates to plain `/`).
 */
export function clearParams(): void {
  window.history.pushState({}, '', window.location.pathname);
}
