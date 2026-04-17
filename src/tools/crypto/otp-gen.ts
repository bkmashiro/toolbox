import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'otp-gen',
  name: 'OTP Generator',
  description: 'TOTP/HOTP generator — input base32 secret, get live OTP with countdown',
  category: 'crypto',
  tags: ['otp', 'totp', 'hotp', '2fa', 'mfa', 'auth', 'time', 'one-time', 'password', 'base32'],
  inputs: [
    {
      id: 'secret',
      label: 'Base32 Secret',
      type: 'text',
      placeholder: 'JBSWY3DPEHPK3PXP',
    },
  ],
  options: [
    {
      id: 'type',
      label: 'OTP Type',
      type: 'select',
      default: 'TOTP',
      options: [
        { label: 'TOTP (Time-based)', value: 'TOTP' },
        { label: 'HOTP (Counter-based)', value: 'HOTP' },
      ],
    },
    {
      id: 'algorithm',
      label: 'Algorithm',
      type: 'select',
      default: 'SHA1',
      options: [
        { label: 'SHA-1 (default)', value: 'SHA1' },
        { label: 'SHA-256', value: 'SHA256' },
        { label: 'SHA-512', value: 'SHA512' },
      ],
    },
    {
      id: 'digits',
      label: 'Digits',
      type: 'select',
      default: '6',
      options: [
        { label: '6 digits', value: '6' },
        { label: '8 digits', value: '8' },
      ],
    },
    {
      id: 'period',
      label: 'Period (TOTP)',
      type: 'select',
      default: '30',
      options: [
        { label: '30 seconds', value: '30' },
        { label: '60 seconds', value: '60' },
      ],
      showWhen: { optionId: 'type', value: 'TOTP' },
    },
    {
      id: 'counter',
      label: 'Counter (HOTP)',
      type: 'number',
      default: 0,
      min: 0,
      max: 999999999,
      step: 1,
      showWhen: { optionId: 'type', value: 'HOTP' },
    },
    {
      id: 'issuer',
      label: 'Issuer (for provisioning URI)',
      type: 'text',
      default: 'Toolbox',
      placeholder: 'MyApp',
      required: false,
    },
    {
      id: 'account',
      label: 'Account (for provisioning URI)',
      type: 'text',
      default: 'user@example.com',
      placeholder: 'user@example.com',
      required: false,
    },
  ],
  output: { type: 'json' },
  apiSupported: false,
  async run(inputs, options) {
    const secret = ((inputs.secret as string) ?? '').trim().toUpperCase().replace(/\s/g, '');
    if (!secret) throw new Error('Base32 secret is required');

    const { TOTP, HOTP } = await import('otpauth');

    const type = options.type as string;
    const algorithm = options.algorithm as string;
    const digits = parseInt(options.digits as string, 10);
    const period = parseInt(options.period as string, 10);
    const counter = options.counter as number;
    const issuer = (options.issuer as string) || 'Toolbox';
    const account = (options.account as string) || 'user@example.com';

    let otp: string;
    let uri: string;
    let secondsRemaining: number | undefined;

    if (type === 'TOTP') {
      const totp = new TOTP({ secret, algorithm, digits, period, issuer, label: account });
      otp = totp.generate();
      uri = totp.toString();
      secondsRemaining = period - (Math.floor(Date.now() / 1000) % period);
    } else {
      const hotp = new HOTP({ secret, algorithm, digits, counter, issuer, label: account });
      otp = hotp.generate({ counter });
      uri = hotp.toString();
    }

    return {
      type: 'json',
      data: {
        otp,
        type,
        algorithm,
        digits,
        ...(type === 'TOTP' ? { period, secondsRemaining } : { counter }),
        provisioningUri: uri,
        secret,
      },
    };
  },
};

registry.register(tool);
export default tool;
