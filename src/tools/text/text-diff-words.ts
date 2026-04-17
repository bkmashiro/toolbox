import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'text-diff-words',
  name: 'Word Diff',
  description: 'Word-level inline diff between two texts, highlighted in one view.',
  category: 'text',
  tags: ['diff', 'word', 'compare', 'text', 'inline', 'difference'],
  inputs: [
    {
      id: 'original',
      label: 'Original Text',
      type: 'textarea',
      placeholder: 'Original text...',
      rows: 8,
    },
    {
      id: 'modified',
      label: 'Modified Text',
      type: 'textarea',
      placeholder: 'Modified text...',
      rows: 8,
    },
  ],
  options: [
    {
      id: 'ignoreCase',
      label: 'Ignore case',
      type: 'checkbox',
      default: false,
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  async run(inputs, options) {
    const original = inputs.original as string;
    const modified = inputs.modified as string;
    const ignoreCase = options.ignoreCase as boolean;

    const diffLib = await import('diff');
    const changes = diffLib.diffWords(original, modified, { ignoreCase });

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let addedCount = 0;
    let removedCount = 0;

    const inlineHtml = changes
      .map(change => {
        const text = escapeHtml(change.value);
        if (change.added) {
          addedCount += change.value.split(/\s+/).filter(Boolean).length;
          return `<ins class="added">${text}</ins>`;
        }
        if (change.removed) {
          removedCount += change.value.split(/\s+/).filter(Boolean).length;
          return `<del class="removed">${text}</del>`;
        }
        return `<span>${text}</span>`;
      })
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.7; padding: 16px; color: #24292e; }
.diff-content { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; white-space: pre-wrap; word-break: break-word; }
ins.added { background: #dcfce7; color: #166534; text-decoration: none; border-radius: 2px; padding: 0 1px; }
del.removed { background: #fee2e2; color: #991b1b; border-radius: 2px; padding: 0 1px; }
.diff-stats { margin-top: 10px; font-size: 12px; color: #64748b; display: flex; gap: 16px; }
.added-count { color: #16a34a; font-weight: 600; }
.removed-count { color: #dc2626; font-weight: 600; }
.legend { display: flex; gap: 12px; margin-bottom: 10px; font-size: 12px; }
.legend span { display: flex; align-items: center; gap: 4px; }
.legend .swatch { width: 12px; height: 12px; border-radius: 2px; }
.legend .swatch.add { background: #dcfce7; }
.legend .swatch.rem { background: #fee2e2; }
</style>
</head>
<body>
<div class="legend">
  <span><span class="swatch add"></span> Added</span>
  <span><span class="swatch rem"></span> Removed</span>
</div>
<div class="diff-content">${inlineHtml}</div>
<div class="diff-stats">
  <span class="added-count">+${addedCount} words added</span>
  <span class="removed-count">−${removedCount} words removed</span>
</div>
</body>
</html>`;

    return {
      type: 'html',
      data: html,
      summary: `+${addedCount} words added, −${removedCount} words removed`,
    };
  },
};

registry.register(tool);
export default tool;
