import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

function buildVCard(fields: {
  firstName: string; lastName: string; org: string; title: string;
  phone: string; email: string; url: string; address: string;
}): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${fields.firstName} ${fields.lastName}`.trim(),
    `N:${fields.lastName};${fields.firstName};;;`,
  ];
  if (fields.org) lines.push(`ORG:${fields.org}`);
  if (fields.title) lines.push(`TITLE:${fields.title}`);
  if (fields.phone) lines.push(`TEL;TYPE=CELL:${fields.phone}`);
  if (fields.email) lines.push(`EMAIL:${fields.email}`);
  if (fields.url) lines.push(`URL:${fields.url}`);
  if (fields.address) lines.push(`ADR:;;${fields.address};;;;`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

const tool: Tool = {
  id: 'qr-vcard',
  name: 'vCard QR',
  description: 'Generate a QR code from contact information (vCard 3.0 format)',
  category: 'misc',
  tags: ['vcard', 'qr', 'contact', 'qr code', 'business card', 'phone', 'email'],
  inputs: [],
  options: [
    {
      id: 'firstName',
      label: 'First Name',
      type: 'text',
      default: '',
      placeholder: 'John',
    },
    {
      id: 'lastName',
      label: 'Last Name',
      type: 'text',
      default: '',
      placeholder: 'Doe',
    },
    {
      id: 'org',
      label: 'Organization',
      type: 'text',
      default: '',
      placeholder: 'Acme Corp',
    },
    {
      id: 'title',
      label: 'Job Title',
      type: 'text',
      default: '',
      placeholder: 'Software Engineer',
    },
    {
      id: 'phone',
      label: 'Phone',
      type: 'text',
      default: '',
      placeholder: '+1 555 123 4567',
    },
    {
      id: 'email',
      label: 'Email',
      type: 'text',
      default: '',
      placeholder: 'john@example.com',
    },
    {
      id: 'url',
      label: 'Website',
      type: 'text',
      default: '',
      placeholder: 'https://example.com',
    },
    {
      id: 'address',
      label: 'Address',
      type: 'text',
      default: '',
      placeholder: '123 Main St, Springfield, USA',
    },
    {
      id: 'size',
      label: 'QR Size (px)',
      type: 'range',
      default: 256,
      min: 128,
      max: 512,
      step: 32,
    },
    {
      id: 'errorCorrection',
      label: 'Error Correction',
      type: 'select',
      default: 'M',
      options: [
        { label: 'L (7%)', value: 'L' },
        { label: 'M (15%)', value: 'M' },
        { label: 'Q (25%)', value: 'Q' },
        { label: 'H (30%)', value: 'H' },
      ],
    },
  ],
  output: { type: 'file', defaultFilename: 'vcard-qr.png', defaultMimeType: 'image/png' },
  apiSupported: false,

  async run(_inputs, options) {
    const QRCode = (await import('qrcode')).default;

    const vcard = buildVCard({
      firstName: (options.firstName as string) || '',
      lastName: (options.lastName as string) || '',
      org: (options.org as string) || '',
      title: (options.title as string) || '',
      phone: (options.phone as string) || '',
      email: (options.email as string) || '',
      url: (options.url as string) || '',
      address: (options.address as string) || '',
    });

    const size = options.size as number;
    const ec = options.errorCorrection as 'L' | 'M' | 'Q' | 'H';

    const dataUrl: string = await QRCode.toDataURL(vcard, {
      width: size,
      margin: 2,
      errorCorrectionLevel: ec,
    });

    // Convert data URL to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    return {
      type: 'file',
      data: blob,
      filename: 'vcard-qr.png',
      mimeType: 'image/png',
      preview: dataUrl,
      summary: `vCard QR code (${size}×${size}px)`,
    };
  },
};

registry.register(tool);
export default tool;
