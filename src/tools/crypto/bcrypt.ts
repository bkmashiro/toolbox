import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'bcrypt',
  name: 'Bcrypt',
  description: 'Hash and verify passwords with bcrypt',
  category: 'crypto',
  tags: ['bcrypt', 'password', 'hash', 'verify', 'salt', 'rounds', 'security'],
  inputs: [
    {
      id: 'password',
      label: 'Password',
      type: 'text',
      placeholder: 'Enter password...',
    },
    {
      id: 'hash',
      label: 'Hash (for verify mode)',
      type: 'text',
      placeholder: '$2a$10$...',
      required: false,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'hash',
      options: [
        { label: 'Hash Password', value: 'hash' },
        { label: 'Verify Password', value: 'verify' },
      ],
    },
    {
      id: 'rounds',
      label: 'Salt Rounds',
      type: 'range',
      default: 10,
      min: 4,
      max: 16,
      step: 1,
      helpText: 'Higher rounds = more secure but slower. 10-12 recommended for production.',
      showWhen: { optionId: 'mode', value: 'hash' },
    },
  ],
  output: { type: 'text' },
  apiSupported: true,
  async run(inputs, options) {
    const bcrypt = await import('bcryptjs');
    const password = (inputs.password as string) ?? '';
    const mode = options.mode as string;

    if (!password) throw new Error('Password is required');

    if (mode === 'hash') {
      const rounds = options.rounds as number;
      const hash = await bcrypt.hash(password, rounds);
      return {
        type: 'text',
        data: hash,
        summary: `Hashed with ${rounds} rounds`,
      };
    } else {
      const hash = (inputs.hash as string) ?? '';
      if (!hash) throw new Error('Hash is required for verify mode');
      const match = await bcrypt.compare(password, hash);
      return {
        type: 'text',
        data: match ? 'MATCH: Password matches the hash' : 'NO MATCH: Password does not match the hash',
        summary: match ? 'Verification successful' : 'Verification failed',
      };
    }
  },
};

registry.register(tool);
export default tool;
