import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'tts',
  name: 'Text to Speech',
  description: 'Convert text to spoken audio using the browser Web Speech API',
  category: 'misc',
  tags: ['text', 'speech', 'tts', 'speak', 'voice', 'audio', 'read aloud'],
  inputs: [
    {
      id: 'text',
      label: 'Text to speak',
      type: 'textarea',
      placeholder: 'Enter text to be spoken...',
      required: true,
      rows: 5,
    },
  ],
  options: [
    {
      id: 'lang',
      label: 'Language',
      type: 'select',
      default: 'en-US',
      options: [
        { label: 'English (US)', value: 'en-US' },
        { label: 'Chinese (Mandarin)', value: 'zh-CN' },
        { label: 'French', value: 'fr-FR' },
        { label: 'German', value: 'de-DE' },
        { label: 'Japanese', value: 'ja-JP' },
        { label: 'Spanish', value: 'es-ES' },
      ],
    },
    {
      id: 'rate',
      label: 'Speech Rate',
      type: 'select',
      default: '1',
      options: [
        { label: '0.5× (very slow)', value: '0.5' },
        { label: '0.75× (slow)', value: '0.75' },
        { label: '1× (normal)', value: '1' },
        { label: '1.25× (fast)', value: '1.25' },
        { label: '1.5× (faster)', value: '1.5' },
        { label: '2× (very fast)', value: '2' },
      ],
    },
    {
      id: 'pitch',
      label: 'Pitch',
      type: 'select',
      default: '1',
      options: [
        { label: '0.5 (low)', value: '0.5' },
        { label: '1 (normal)', value: '1' },
        { label: '1.5 (high)', value: '1.5' },
        { label: '2 (very high)', value: '2' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options) {
    if (!('speechSynthesis' in globalThis)) throw new Error('Web Speech API not supported in this browser');
    const text = inputs.text as string;
    const lang = (options.lang as string) || 'en-US';
    const rate = parseFloat((options.rate as string) || '1');
    const pitch = parseFloat((options.pitch as string) || '1');
    return new Promise((resolve, reject) => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang; utt.rate = rate; utt.pitch = pitch;
      utt.onend = () => resolve({ type: 'text', data: `Speaking complete: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"` });
      utt.onerror = (e) => reject(new Error(`Speech error: ${e.error}`));
      globalThis.speechSynthesis.speak(utt);
    });
  },
};

registry.register(tool);
export default tool;
