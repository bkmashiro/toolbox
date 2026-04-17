import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'pgp-encrypt',
  name: 'PGP Encrypt',
  description: 'PGP encrypt, decrypt, sign, and verify messages using openpgp.js',
  category: 'crypto',
  tags: ['pgp', 'gpg', 'openpgp', 'encrypt', 'decrypt', 'sign', 'verify', 'armor', 'key'],
  inputs: [
    {
      id: 'text',
      label: 'Message / Ciphertext',
      type: 'textarea',
      placeholder: 'Enter message or PGP armored ciphertext...',
      rows: 6,
    },
    {
      id: 'key',
      label: 'Key (public for encrypt/verify, private for decrypt/sign)',
      type: 'textarea',
      placeholder: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n...',
      rows: 8,
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'encrypt',
      options: [
        { label: 'Encrypt', value: 'encrypt' },
        { label: 'Decrypt', value: 'decrypt' },
        { label: 'Sign', value: 'sign' },
        { label: 'Verify', value: 'verify' },
      ],
    },
    {
      id: 'passphrase',
      label: 'Key Passphrase (if key is encrypted)',
      type: 'text',
      default: '',
      placeholder: 'Leave empty if key has no passphrase',
      required: false,
    },
    {
      id: 'armor',
      label: 'Armored Output',
      type: 'checkbox',
      default: true,
      helpText: 'ASCII armor for text-friendly output',
    },
  ],
  output: { type: 'text' },
  apiSupported: false,
  heavyDeps: ['openpgp'],
  async run(inputs, options) {
    const openpgp = await import('openpgp');
    const text = (inputs.text as string) ?? '';
    const keyStr = (inputs.key as string) ?? '';
    const mode = options.mode as string;
    const passphrase = (options.passphrase as string) || undefined;
    const armor = options.armor as boolean;

    if (!text) throw new Error('Message is required');

    if (mode === 'encrypt') {
      if (!keyStr) throw new Error('Public key is required for encryption');
      const publicKey = await openpgp.readKey({ armoredKey: keyStr });
      const message = await openpgp.createMessage({ text });
      const encrypted = await openpgp.encrypt({
        message,
        encryptionKeys: publicKey,
        format: armor ? 'armored' : 'binary',
      });
      return { type: 'text', data: encrypted as string };
    }

    if (mode === 'decrypt') {
      if (!keyStr) throw new Error('Private key is required for decryption');
      let privateKey = await openpgp.readPrivateKey({ armoredKey: keyStr });
      if (passphrase) {
        privateKey = await openpgp.decryptKey({ privateKey, passphrase });
      }
      const message = await openpgp.readMessage({ armoredMessage: text });
      const { data } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
      });
      return { type: 'text', data: data as string };
    }

    if (mode === 'sign') {
      if (!keyStr) throw new Error('Private key is required for signing');
      let privateKey = await openpgp.readPrivateKey({ armoredKey: keyStr });
      if (passphrase) {
        privateKey = await openpgp.decryptKey({ privateKey, passphrase });
      }
      const message = await openpgp.createMessage({ text });
      const signed = await openpgp.sign({
        message,
        signingKeys: privateKey,
        format: armor ? 'armored' : 'binary',
      });
      return { type: 'text', data: signed as string };
    }

    if (mode === 'verify') {
      if (!keyStr) throw new Error('Public key is required for verification');
      const publicKey = await openpgp.readKey({ armoredKey: keyStr });
      const message = await openpgp.readCleartextMessage({ cleartextMessage: text }).catch(async () => {
        const msg = await openpgp.readMessage({ armoredMessage: text });
        return msg;
      });
      const { signatures } = await openpgp.verify({
        message: message as openpgp.CleartextMessage,
        verificationKeys: publicKey,
      });
      const valid = await signatures[0]?.verified;
      return {
        type: 'text',
        data: valid ? 'VALID: Signature verified successfully' : 'INVALID: Signature verification failed',
      };
    }

    throw new Error('Unknown mode');
  },
};

registry.register(tool);
export default tool;
