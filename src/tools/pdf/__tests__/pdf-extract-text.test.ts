import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}));

// Polyfill arrayBuffer for jsdom
if (typeof Blob.prototype.arrayBuffer === 'undefined') {
  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    value: function () {
      return new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(this);
      });
    },
  });
}

// Mock pdfjs-dist
const mockPage = {
  getTextContent: vi.fn().mockResolvedValue({
    items: [
      { str: 'Hello' },
      { str: ' World' },
    ],
  }),
};

const mockPdfDoc = {
  numPages: 3,
  getPage: vi.fn().mockResolvedValue(mockPage),
};

vi.mock('pdfjs-dist', () => ({
  default: {
    getDocument: vi.fn(() => ({ promise: Promise.resolve(mockPdfDoc) })),
    GlobalWorkerOptions: { workerSrc: '' },
  },
  getDocument: vi.fn(() => ({ promise: Promise.resolve(mockPdfDoc) })),
  GlobalWorkerOptions: { workerSrc: '' },
}));

// Mock URL constructor for worker src
(globalThis as Record<string, unknown>).URL = class {
  constructor(url: string) { return { toString: () => url }; }
  toString() { return ''; }
} as unknown as typeof URL;

describe('pdf-extract-text tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.getTextContent.mockResolvedValue({
      items: [{ str: 'Hello' }, { str: ' World' }],
    });
    mockPdfDoc.getPage.mockResolvedValue(mockPage);
    mockPdfDoc.numPages = 3;
  });

  it('has correct id and category', async () => {
    const mod = await import('../pdf-extract-text');
    expect(mod.default.id).toBe('pdf-extract-text');
    expect(mod.default.category).toBe('pdf');
  });

  it('has pages and separator options', async () => {
    const mod = await import('../pdf-extract-text');
    const optionIds = mod.default.options.map((o) => o.id);
    expect(optionIds).toContain('pages');
    expect(optionIds).toContain('separator');
  });

  it('uses pdfjs-dist for text extraction', async () => {
    const mod = await import('../pdf-extract-text');
    const fakeFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'test.pdf', {
      type: 'application/pdf',
    });
    const result = await mod.default.run(
      { pdf: fakeFile },
      { pages: '', separator: 'doublenewline', customSeparator: '---' }
    );
    expect(result.type).toBe('text');
    expect(typeof result.data).toBe('string');
    expect(result.data as string).toContain('Hello');
    expect(result.data as string).toContain('World');
  });

  it('separates pages with page break by default', async () => {
    const mod = await import('../pdf-extract-text');
    const fakeFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'test.pdf', {
      type: 'application/pdf',
    });
    const result = await mod.default.run(
      { pdf: fakeFile },
      { pages: '1-2', separator: 'pagebreak', customSeparator: '' }
    );
    expect(result.data as string).toContain('\f');
  });

  it('extracts only specified pages', async () => {
    const mod = await import('../pdf-extract-text');
    const fakeFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'test.pdf', {
      type: 'application/pdf',
    });
    await mod.default.run(
      { pdf: fakeFile },
      { pages: '2', separator: 'none', customSeparator: '' }
    );
    expect(mockPdfDoc.getPage).toHaveBeenCalledWith(2);
    expect(mockPdfDoc.getPage).toHaveBeenCalledTimes(1);
  });
});
