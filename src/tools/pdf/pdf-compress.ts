import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { savePDFLib } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-compress',
  name: 'Compress PDF',
  description: 'Reduce PDF file size by removing metadata and compressing streams',
  category: 'pdf',
  tags: ['pdf', 'compress', 'reduce', 'optimize', 'size'],
  inputs: [
    {
      id: 'pdf',
      label: 'PDF File',
      type: 'file',
      accept: 'application/pdf',
    },
  ],
  options: [],
  output: {
    type: 'file',
    defaultFilename: 'compressed.pdf',
    defaultMimeType: 'application/pdf',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, options, onProgress) {
    const file = inputs['pdf'] as File;

    onProgress?.(10, 'Loading PDF...');
    const { PDFDocument } = await import('pdf-lib');
    const buffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(buffer, { updateMetadata: false });

    onProgress?.(40, 'Removing metadata...');
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('');
    doc.setCreator('');

    onProgress?.(70, 'Saving with compression...');
    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    const blob = new Blob([bytes], { type: 'application/pdf' });

    const origKB = (file.size / 1024).toFixed(1);
    const newKB = (bytes.byteLength / 1024).toFixed(1);
    const reduction = (((file.size - bytes.byteLength) / file.size) * 100).toFixed(1);

    onProgress?.(100, 'Done');

    const baseName = file.name.replace(/\.pdf$/i, '');
    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-compressed.pdf`,
      mimeType: 'application/pdf',
      summary: `${origKB} KB → ${newKB} KB (${reduction}% smaller)`,
    };
  },
};

registry.register(tool);
export default tool;
