import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation',
  'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat',
  'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse',
  'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat',
  'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
  'mollit', 'anim', 'id', 'est', 'laborum', 'pellentesque', 'habitant', 'morbi',
  'tristique', 'senectus', 'netus', 'malesuada', 'fames', 'turpis', 'egestas',
  'volutpat', 'ac', 'adipiscing', 'vitae', 'proin', 'nibh', 'nisl', 'condimentum',
  'lacus', 'vel', 'facilisis', 'volutpat', 'est', 'velit', 'aliquet', 'sagittis',
];

let seedIndex = 0;
function getWord(idx: number): string {
  return LOREM_WORDS[idx % LOREM_WORDS.length];
}

function generateSentence(wordCount: number, startIdx: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(getWord(startIdx + i));
  }
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function generateParagraph(sentenceCount: number, startIdx: number): string {
  const sentences: string[] = [];
  let idx = startIdx;
  for (let i = 0; i < sentenceCount; i++) {
    const len = 8 + ((idx * 7 + i * 3) % 10);
    sentences.push(generateSentence(len, idx));
    idx += len;
  }
  return sentences.join(' ');
}

const tool: Tool = {
  id: 'lorem-ipsum',
  name: 'Lorem Ipsum Generator',
  description: 'Generate lorem ipsum placeholder text by paragraphs, sentences, or words.',
  category: 'text',
  tags: ['lorem', 'ipsum', 'placeholder', 'dummy', 'text', 'generate', 'filler'],
  inputs: [],
  options: [
    {
      id: 'type',
      label: 'Generate by',
      type: 'select',
      default: 'paragraphs',
      options: [
        { label: 'Paragraphs', value: 'paragraphs' },
        { label: 'Sentences', value: 'sentences' },
        { label: 'Words', value: 'words' },
      ],
    },
    {
      id: 'count',
      label: 'Count',
      type: 'number',
      default: 3,
      min: 1,
      max: 100,
    },
    {
      id: 'startWithLorem',
      label: 'Start with "Lorem ipsum..."',
      type: 'checkbox',
      default: true,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  async run(_inputs, options) {
    const type = options.type as string;
    const count = Math.max(1, Math.min(100, options.count as number));
    const startWithLorem = options.startWithLorem as boolean;

    seedIndex = 0;
    let result = '';

    if (type === 'words') {
      const words: string[] = [];
      for (let i = 0; i < count; i++) {
        words.push(getWord(seedIndex++));
      }
      if (startWithLorem && words.length >= 2) {
        words[0] = 'Lorem';
        words[1] = 'ipsum';
      }
      result = words.join(' ');
    } else if (type === 'sentences') {
      const sentences: string[] = [];
      let idx = 0;
      for (let i = 0; i < count; i++) {
        const len = 8 + ((idx * 7 + i * 3) % 10);
        sentences.push(generateSentence(len, idx));
        idx += len;
      }
      if (startWithLorem && sentences.length > 0) {
        sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      }
      result = sentences.join(' ');
    } else {
      // paragraphs
      const paragraphs: string[] = [];
      let idx = 0;
      for (let i = 0; i < count; i++) {
        const sentCount = 4 + (i % 3);
        paragraphs.push(generateParagraph(sentCount, idx));
        idx += sentCount * 12;
      }
      if (startWithLorem && paragraphs.length > 0) {
        paragraphs[0] =
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
          paragraphs[0];
      }
      result = paragraphs.join('\n\n');
    }

    return {
      type: 'text',
      data: result,
      summary: `Generated ${count} ${type}`,
    };
  },
};

registry.register(tool);
export default tool;
