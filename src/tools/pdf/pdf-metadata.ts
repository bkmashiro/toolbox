import { registry } from '../../core/registry';
import type { Tool, ToolResult } from '../../core/types';
import { loadPDFLib, savePDFLib } from './pdf-utils';

const tool: Tool = {
  id: 'pdf-metadata',
  name: 'PDF Metadata',
  description: 'View and edit PDF metadata (title, author, subject, keywords, creator, producer)',
  category: 'pdf',
  tags: ['pdf', 'metadata', 'title', 'author', 'subject', 'keywords', 'edit'],
  inputs: [
    {
      id: 'pdf',
      label: 'PDF File',
      type: 'file',
      accept: 'application/pdf',
    },
  ],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'view',
      options: [
        { label: 'View metadata', value: 'view' },
        { label: 'Edit metadata', value: 'edit' },
      ],
    },
    {
      id: 'title',
      label: 'Title',
      type: 'text',
      default: '',
      placeholder: 'Document title',
      showWhen: { optionId: 'mode', value: 'edit' },
    },
    {
      id: 'author',
      label: 'Author',
      type: 'text',
      default: '',
      placeholder: 'Author name',
      showWhen: { optionId: 'mode', value: 'edit' },
    },
    {
      id: 'subject',
      label: 'Subject',
      type: 'text',
      default: '',
      placeholder: 'Subject',
      showWhen: { optionId: 'mode', value: 'edit' },
    },
    {
      id: 'keywords',
      label: 'Keywords (comma-separated)',
      type: 'text',
      default: '',
      placeholder: 'keyword1, keyword2',
      showWhen: { optionId: 'mode', value: 'edit' },
    },
    {
      id: 'creator',
      label: 'Creator',
      type: 'text',
      default: '',
      placeholder: 'Creating application',
      showWhen: { optionId: 'mode', value: 'edit' },
    },
    {
      id: 'producer',
      label: 'Producer',
      type: 'text',
      default: '',
      placeholder: 'Producing application',
      showWhen: { optionId: 'mode', value: 'edit' },
    },
  ],
  output: {
    type: 'text',
  },
  heavyDeps: ['pdf-lib'],
  apiSupported: false,

  async run(inputs, options): Promise<ToolResult> {
    const file = inputs['pdf'] as File;
    const mode = options['mode'] as string;

    const doc = await loadPDFLib(file);

    if (mode === 'view') {
      const meta = {
        Title: doc.getTitle() ?? '',
        Author: doc.getAuthor() ?? '',
        Subject: doc.getSubject() ?? '',
        Keywords: doc.getKeywords() ?? '',
        Creator: doc.getCreator() ?? '',
        Producer: doc.getProducer() ?? '',
        'Creation Date': doc.getCreationDate()?.toISOString() ?? '',
        'Modification Date': doc.getModificationDate()?.toISOString() ?? '',
        'Page Count': String(doc.getPageCount()),
      };
      const text = Object.entries(meta)
        .map(([k, v]) => `${k}: ${v || '(empty)'}`)
        .join('\n');
      return { type: 'text', data: text };
    }

    // Edit mode
    const title = (options['title'] as string).trim();
    const author = (options['author'] as string).trim();
    const subject = (options['subject'] as string).trim();
    const keywords = (options['keywords'] as string).trim();
    const creator = (options['creator'] as string).trim();
    const producer = (options['producer'] as string).trim();

    if (title) doc.setTitle(title);
    if (author) doc.setAuthor(author);
    if (subject) doc.setSubject(subject);
    if (keywords) doc.setKeywords(keywords.split(',').map((k) => k.trim()));
    if (creator) doc.setCreator(creator);
    if (producer) doc.setProducer(producer);

    const blob = await savePDFLib(doc);
    const baseName = file.name.replace(/\.pdf$/i, '');

    return {
      type: 'file',
      data: blob,
      filename: `${baseName}-metadata.pdf`,
      mimeType: 'application/pdf',
      summary: 'Metadata updated successfully',
    };
  },
};

registry.register(tool);
export default tool;
