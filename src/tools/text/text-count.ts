import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

/**
 * Flesch Reading Ease approximation:
 *   206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 * Syllable count: vowel groups heuristic
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  // Count vowel groups
  const matches = word.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 0;
  // Remove silent trailing 'e'
  if (word.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const words = text.match(/\b\w+\b/g) || [];
  if (words.length === 0 || sentences.length === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (totalSyllables / words.length);

  return Math.round(score * 10) / 10;
}

function fleschLabel(score: number): string {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Confusing';
}

const tool: Tool = {
  id: 'text-count',
  name: 'Text Stats Counter',
  description:
    'Count characters, words, lines, sentences, and paragraphs. Includes Flesch readability approximation.',
  category: 'text',
  tags: ['count', 'words', 'characters', 'lines', 'sentences', 'paragraphs', 'readability', 'flesch', 'text'],
  inputs: [
    {
      id: 'text',
      label: 'Text',
      type: 'textarea',
      placeholder: 'Paste or type text here...',
      rows: 10,
    },
  ],
  options: [
    {
      id: 'countSpaces',
      label: 'Count spaces in character count',
      type: 'checkbox',
      default: true,
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const text = inputs.text as string;
    const countSpaces = options.countSpaces as boolean;

    const chars = countSpaces ? text.length : text.replace(/\s/g, '').length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = (text.match(/\b\w+\b/g) || []).length;
    const lines = text === '' ? 0 : text.split('\n').length;
    const sentences = (text.match(/[^.!?]*[.!?]+/g) || []).length;
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter(p => p.trim()).length;

    const flesch = fleschReadingEase(text);
    const readability = fleschLabel(flesch);

    const result = [
      `Characters:        ${chars}${!countSpaces ? '' : ` (${charsNoSpaces} without spaces)`}`,
      `Words:             ${words}`,
      `Lines:             ${lines}`,
      `Sentences:         ${sentences}`,
      `Paragraphs:        ${paragraphs}`,
      ``,
      `Readability (Flesch): ${flesch} — ${readability}`,
      `  90-100: Very Easy | 80-90: Easy | 70-80: Fairly Easy`,
      `  60-70: Standard   | 50-60: Fairly Difficult`,
      `  30-50: Difficult  | 0-30:  Very Confusing`,
    ].join('\n');

    return {
      type: 'text',
      data: result,
      summary: `${words} words, ${chars} chars`,
    };
  },
};

registry.register(tool);
export default tool;
