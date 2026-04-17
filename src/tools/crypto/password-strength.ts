import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'password-strength',
  name: 'Password Strength',
  description: 'Check password strength with score, crack time estimates, and improvement suggestions',
  category: 'crypto',
  tags: ['password', 'strength', 'zxcvbn', 'security', 'crack', 'entropy', 'audit'],
  inputs: [
    {
      id: 'password',
      label: 'Password',
      type: 'text',
      placeholder: 'Enter password to check...',
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: false,
  async run(inputs) {
    const password = (inputs.password as string) ?? '';
    if (!password) throw new Error('Password is required');

    const { default: zxcvbn } = await import('zxcvbn');
    const result = zxcvbn(password);

    const scoreLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const scoreColors = ['#e03131', '#f08c00', '#fab005', '#2f9e44', '#1c7ed6'];

    return {
      type: 'json',
      data: {
        score: result.score,
        scoreLabel: scoreLabels[result.score],
        scoreColor: scoreColors[result.score],
        crackTimes: {
          onlineThrottled: result.crack_times_display.online_throttling_100_per_hour,
          onlineUnthrottled: result.crack_times_display.online_no_throttling_10_per_second,
          offlineSlow: result.crack_times_display.offline_slow_hashing_1e4_per_second,
          offlineFast: result.crack_times_display.offline_fast_hashing_1e10_per_second,
        },
        guesses: result.guesses,
        guessesLog10: result.guesses_log10.toFixed(2),
        feedback: {
          warning: result.feedback.warning || null,
          suggestions: result.feedback.suggestions,
        },
        sequence: result.sequence.map((s) => ({
          pattern: s.pattern,
          token: s.token,
        })),
      },
    };
  },
};

registry.register(tool);
export default tool;
