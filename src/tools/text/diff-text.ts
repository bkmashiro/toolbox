import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'diff-text',
  name: 'Text Diff (Side by Side)',
  description: 'Compare two texts side by side with line-level diff highlighting.',
  category: 'text',
  tags: ['diff', 'compare', 'text', 'side-by-side', 'lines', 'difference'],
  inputs: [
    {
      id: 'original',
      label: 'Original Text',
      type: 'textarea',
      placeholder: 'Original text...',
      rows: 10,
    },
    {
      id: 'modified',
      label: 'Modified Text',
      type: 'textarea',
      placeholder: 'Modified text...',
      rows: 10,
    },
  ],
  options: [
    {
      id: 'ignoreCase',
      label: 'Ignore case',
      type: 'checkbox',
      default: false,
    },
    {
      id: 'ignoreWhitespace',
      label: 'Ignore leading/trailing whitespace',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(inputs, options) {
    let original = inputs.original as string;
    let modified = inputs.modified as string;
    const ignoreCase = options.ignoreCase as boolean;
    const ignoreWhitespace = options.ignoreWhitespace as boolean;

    if (ignoreCase) {
      original = original.toLowerCase();
      modified = modified.toLowerCase();
    }

    const diffLib = await import('diff');
    const changes = diffLib.diffLines(original, modified, {
      ignoreWhitespace,
    });

    // Build side-by-side view
    const leftLines: Array<{ num: number | null; text: string; type: string }> = [];
    const rightLines: Array<{ num: number | null; text: string; type: string }> = [];
    let leftNum = 1, rightNum = 1;
    let addedCount = 0, removedCount = 0;

    for (const change of changes) {
      const lines = change.value.split('\n');
      // Remove the trailing empty string caused by trailing newline
      if (lines[lines.length - 1] === '') lines.pop();

      if (change.removed) {
        removedCount += lines.length;
        for (const line of lines) {
          leftLines.push({ num: leftNum++, text: line, type: 'removed' });
          rightLines.push({ num: null, text: '', type: 'empty' });
        }
      } else if (change.added) {
        addedCount += lines.length;
        for (const line of lines) {
          leftLines.push({ num: null, text: '', type: 'empty' });
          rightLines.push({ num: rightNum++, text: line, type: 'added' });
        }
      } else {
        for (const line of lines) {
          leftLines.push({ num: leftNum++, text: line, type: 'unchanged' });
          rightLines.push({ num: rightNum++, text: line, type: 'unchanged' });
        }
      }
    }

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const renderPane = (lines: typeof leftLines) =>
      lines
        .map(
          l =>
            `<div class="diff-line ${l.type}">` +
            `<span class="diff-line-number">${l.num ?? ''}</span>` +
            `<span class="diff-line-content">${escapeHtml(l.text)}</span>` +
            `</div>`
        )
        .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: monospace; font-size: 13px; }
.diff-container { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
.diff-pane { overflow: auto; max-height: 480px; }
.diff-pane:first-child { border-right: 1px solid #e2e8f0; }
.diff-pane-header { padding: 5px 10px; font-weight: 600; font-size: 11px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.diff-line { display: flex; white-space: pre; line-height: 1.5; }
.diff-line-number { width: 40px; min-width: 40px; text-align: right; padding: 0 6px; color: #94a3b8; background: #f8fafc; user-select: none; border-right: 1px solid #e2e8f0; }
.diff-line-content { padding: 0 8px; flex: 1; overflow: hidden; text-overflow: ellipsis; }
.diff-line.added { background: #dcfce7; } .diff-line.added .diff-line-number { background: #bbf7d0; color: #166534; }
.diff-line.removed { background: #fee2e2; } .diff-line.removed .diff-line-number { background: #fecaca; color: #991b1b; }
.diff-line.empty { background: #f8fafc; color: transparent; }
.diff-stats { padding: 6px 12px; font-size: 12px; color: #64748b; display: flex; gap: 16px; border-top: 1px solid #e2e8f0; }
.added-count { color: #16a34a; font-weight: 600; }
.removed-count { color: #dc2626; font-weight: 600; }
</style>
</head>
<body>
<div class="diff-container">
  <div class="diff-pane">
    <div class="diff-pane-header">Original</div>
    ${renderPane(leftLines)}
  </div>
  <div class="diff-pane">
    <div class="diff-pane-header">Modified</div>
    ${renderPane(rightLines)}
  </div>
</div>
<div class="diff-stats">
  <span class="added-count">+${addedCount} added</span>
  <span class="removed-count">−${removedCount} removed</span>
</div>
</body>
</html>`;

    return {
      type: 'html',
      data: html,
      summary: `+${addedCount} added, −${removedCount} removed`,
    };
  },
};

registry.register(tool);
export default tool;
