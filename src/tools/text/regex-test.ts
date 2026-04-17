import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'regex-test',
  name: 'Regex Tester',
  description: 'Test regular expressions with live match highlighting and capture group display.',
  category: 'text',
  tags: ['regex', 'regexp', 'pattern', 'match', 'test', 'text', 'capture', 'groups'],
  inputs: [
    {
      id: 'pattern',
      label: 'Pattern',
      type: 'text',
      placeholder: '(\\w+)@(\\w+\\.\\w+)',
    },
    {
      id: 'flags',
      label: 'Flags',
      type: 'text',
      placeholder: 'gi',
    },
    {
      id: 'text',
      label: 'Test String',
      type: 'textarea',
      placeholder: 'Paste text to test against...',
      rows: 8,
    },
  ],
  options: [],
  output: { type: 'html' },
  apiSupported: false,
  async run(inputs) {
    const pattern = inputs.pattern as string;
    const flags = (inputs.flags as string) || '';
    const text = inputs.text as string;

    if (!pattern) {
      return { type: 'html', data: '<p style="color:#64748b">Enter a pattern to test.</p>' };
    }

    let regex: RegExp;
    try {
      // Ensure 'g' flag for findAllMatches
      const effectiveFlags = flags.includes('g') ? flags : flags + 'g';
      regex = new RegExp(pattern, effectiveFlags);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        type: 'html',
        data: `<div class="regex-error">Invalid regex: ${msg}</div>`,
        summary: 'Invalid regex',
      };
    }

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Collect all matches
    const matches: Array<{ match: string; index: number; groups: (string | undefined)[] }> = [];
    let m: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        match: m[0],
        index: m.index,
        groups: m.slice(1),
      });
      // Avoid infinite loops with zero-width matches
      if (m[0].length === 0) regex.lastIndex++;
    }

    // Build highlighted text
    let highlighted = '';
    let lastIndex = 0;
    regex.lastIndex = 0;
    while ((m = regex.exec(text)) !== null) {
      highlighted += escapeHtml(text.slice(lastIndex, m.index));
      highlighted += `<mark class="regex-match-highlight">${escapeHtml(m[0])}</mark>`;
      lastIndex = m.index + m[0].length;
      if (m[0].length === 0) {
        highlighted += escapeHtml(text[lastIndex] ?? '');
        lastIndex++;
        regex.lastIndex = lastIndex;
      }
    }
    highlighted += escapeHtml(text.slice(lastIndex));

    // Build match list
    let matchListHtml = '';
    if (matches.length === 0) {
      matchListHtml = '<p style="color:#64748b;font-size:14px">No matches found.</p>';
    } else {
      matchListHtml = matches
        .map((match, i) => {
          const groupsHtml =
            match.groups.length > 0
              ? match.groups
                  .map(
                    (g, gi) =>
                      `<div class="match-group">Group ${gi + 1}: ${g !== undefined ? `<code>${escapeHtml(g)}</code>` : '<em>undefined</em>'}</div>`
                  )
                  .join('')
              : '';
          return `
<div class="regex-match-item">
  <div>Match ${i + 1} at index ${match.index}: <span class="match-full">${escapeHtml(match.match)}</span></div>
  ${groupsHtml}
</div>`;
        })
        .join('');
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; padding: 16px; color: #24292e; }
h3 { font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin: 16px 0 8px; }
.test-text { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; white-space: pre-wrap; word-break: break-word; font-family: monospace; font-size: 13px; line-height: 1.6; }
mark.regex-match-highlight { background: #fef08a; color: #713f12; border-radius: 2px; }
.match-item { border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 12px; margin-bottom: 6px; background: #f8fafc; font-family: monospace; font-size: 13px; }
.match-full { background: #fef08a; color: #713f12; padding: 1px 4px; border-radius: 2px; font-weight: 600; }
.match-group { color: #64748b; font-size: 12px; margin-top: 3px; }
.match-group code { background: #e2e8f0; border-radius: 2px; padding: 0 3px; }
.summary { font-size: 13px; color: #16a34a; font-weight: 600; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="summary">${matches.length} match${matches.length !== 1 ? 'es' : ''} found</div>
<h3>Test String (with highlights)</h3>
<div class="test-text">${highlighted}</div>
<h3>Matches</h3>
${matchListHtml.replace(/class="regex-match-item"/g, 'class="match-item"').replace(/class="match-full"/g, 'class="match-full"')}
</body>
</html>`;

    return {
      type: 'html',
      data: html,
      summary: `${matches.length} match${matches.length !== 1 ? 'es' : ''} found`,
    };
  },
};

registry.register(tool);
export default tool;
