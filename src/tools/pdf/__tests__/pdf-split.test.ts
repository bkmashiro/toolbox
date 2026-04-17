import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}));

// Mock pdf-lib
const mockPage = {};
const mockSrcDoc = {
  getPageCount: vi.fn(() => 5),
  getPageIndices: vi.fn(() => [0, 1, 2, 3, 4]),
};
const mockNewDoc = {
  addPage: vi.fn(),
  copyPages: vi.fn().mockResolvedValue([mockPage]),
  save: vi.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])), // %PDF
};
const PDFDocumentMock = {
  load: vi.fn().mockResolvedValue(mockSrcDoc),
  create: vi.fn().mockResolvedValue(mockNewDoc),
};

vi.mock('pdf-lib', () => ({
  PDFDocument: PDFDocumentMock,
}));

// Mock copyPages
mockSrcDoc.copyPages = vi.fn().mockResolvedValue([mockPage, mockPage, mockPage]);

// Mock fflate
vi.mock('fflate', () => ({
  zipSync: vi.fn((files: Record<string, Uint8Array>) => {
    const count = Object.keys(files).length;
    return new Uint8Array(count * 10 + 4);
  }),
}));

// Polyfill arrayBuffer for jsdom Blob/File
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

describe('pdf-split tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSrcDoc.getPageCount.mockReturnValue(5);
    PDFDocumentMock.load.mockResolvedValue(mockSrcDoc);
    PDFDocumentMock.create.mockResolvedValue(mockNewDoc);
    mockSrcDoc.copyPages = vi.fn().mockResolvedValue([mockPage]);
    mockNewDoc.copyPages = vi.fn().mockResolvedValue([mockPage]);
    mockNewDoc.save.mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  });

  it('has correct id and category', async () => {
    const mod = await import('../pdf-split');
    expect(mod.default.id).toBe('pdf-split');
    expect(mod.default.category).toBe('pdf');
  });

  it('has ranges option', async () => {
    const mod = await import('../pdf-split');
    const rangesOpt = mod.default.options.find((o) => o.id === 'ranges');
    expect(rangesOpt).toBeDefined();
    expect(rangesOpt!.type).toBe('text');
  });

  it('returns a ZIP file', async () => {
    const mod = await import('../pdf-split');
    const fakeFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'test.pdf', { type: 'application/pdf' });
    const result = await mod.default.run({ pdf: fakeFile }, { ranges: '1-2, 3-5' });
    expect(result.type).toBe('file');
    expect(result.mimeType).toBe('application/zip');
    expect(result.filename).toMatch(/\.zip$/);
  });

  it('splits into one-page files when ranges blank', async () => {
    const { zipSync } = await import('fflate');
    const mod = await import('../pdf-split');
    const fakeFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'test.pdf', { type: 'application/pdf' });
    await mod.default.run({ pdf: fakeFile }, { ranges: '' });
    // Should call create once per page (5 pages)
    expect(PDFDocumentMock.create).toHaveBeenCalledTimes(5);
  });
});
