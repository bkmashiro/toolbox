import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}));

// Mock fflate dynamic import
vi.mock('fflate', () => ({
  zipSync: vi.fn((files: Record<string, Uint8Array>) => {
    // Return a simple concatenation as fake zip
    const totalLen = Object.values(files).reduce((s, f) => s + f.byteLength, 0);
    return new Uint8Array(totalLen + 10);
  }),
}));

const mockBlob = new Blob(['fake-png'], { type: 'image/png' });
const mockCtx = { drawImage: vi.fn() };
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
};

// Polyfill Blob.arrayBuffer for jsdom
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

const mockBitmap = { width: 512, height: 512, close: vi.fn() };
(globalThis as Record<string, unknown>).createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);

vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
  return document.createElement(tag);
});

describe('favicon-gen tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas.toBlob.mockImplementation((cb: (b: Blob | null) => void) => cb(mockBlob));
    (globalThis as Record<string, unknown>).createImageBitmap = vi.fn().mockResolvedValue({ width: 512, height: 512, close: vi.fn() });
  });

  it('has correct id and category', async () => {
    const mod = await import('../favicon-gen');
    expect(mod.default.id).toBe('favicon-gen');
    expect(mod.default.category).toBe('image');
  });

  it('has options for all standard sizes', async () => {
    const mod = await import('../favicon-gen');
    const optionIds = mod.default.options.map((o) => o.id);
    expect(optionIds).toContain('size_16');
    expect(optionIds).toContain('size_32');
    expect(optionIds).toContain('size_48');
    expect(optionIds).toContain('size_64');
    expect(optionIds).toContain('size_128');
    expect(optionIds).toContain('size_180');
    expect(optionIds).toContain('size_192');
    expect(optionIds).toContain('size_512');
  });

  it('all size options default to true', async () => {
    const mod = await import('../favicon-gen');
    for (const opt of mod.default.options) {
      expect(opt.default).toBe(true);
    }
  });

  it('throws when no sizes are selected', async () => {
    const mod = await import('../favicon-gen');
    const fakeFile = new File(['x'], 'icon.png', { type: 'image/png' });
    const opts = Object.fromEntries(mod.default.options.map((o) => [o.id, false]));
    await expect(mod.default.run({ image: fakeFile }, opts)).rejects.toThrow('Select at least one size');
  });

  it('returns a ZIP file', async () => {
    const mod = await import('../favicon-gen');
    const fakeFile = new File(['x'], 'icon.png', { type: 'image/png' });
    const opts = Object.fromEntries(mod.default.options.map((o) => [o.id, false]));
    opts['size_16'] = true;
    opts['size_32'] = true;

    const result = await mod.default.run({ image: fakeFile }, opts);
    expect(result.type).toBe('file');
    expect(result.mimeType).toBe('application/zip');
    expect(result.filename).toMatch(/\.zip$/);
  });
});
