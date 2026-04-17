import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'stt',
  name: 'Speech to Text',
  description: 'Transcribe spoken words to text using the browser Web Speech API (microphone required)',
  category: 'misc',
  tags: ['speech', 'recognition', 'stt', 'transcribe', 'microphone', 'voice', 'dictation'],
  inputs: [],
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
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(_inputs, options) {
    const SpeechRecognition = (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;
    if (!SpeechRecognition) throw new Error('Speech Recognition not supported. Use Chrome or Edge.');
    const lang = (options.lang as string) || 'en-US';
    return new Promise((resolve, reject) => {
      const rec = new SpeechRecognition();
      rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = (e: any) => resolve({ type: 'text', data: e.results[0][0].transcript });
      rec.onerror = (e: any) => reject(new Error(`Recognition error: ${e.error}`));
      rec.start();
    });
  },
};

registry.register(tool);
export default tool;
