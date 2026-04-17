import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}));

// Mock qrcode dynamic import
vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn().mockResolvedValue(undefined),
  },
  toCanvas: vi.fn().mockResolvedValue(undefined),
}));

const mockBlob = new Blob(['fake-png'], { type: 'image/png' });
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
};

vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
  return document.createElement(tag);
});

describe('qr-generate tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas.toBlob.mockImplementation((cb: (b: Blob | null) => void) => cb(mockBlob));
  });

  it('has correct id and category', async () => {
    const mod = await import('../qr-generate');
    expect(mod.default.id).toBe('qr-generate');
    expect(mod.default.category).toBe('image');
  });

  it('has expected options', async () => {
    const mod = await import('../qr-generate');
    const ids = mod.default.options.map((o) => o.id);
    expect(ids).toContain('size');
    expect(ids).toContain('errorCorrection');
    expect(ids).toContain('margin');
    expect(ids).toContain('fgColor');
    expect(ids).toContain('bgColor');
  });

  it('throws on empty content', async () => {
    const mod = await import('../qr-generate');
    await expect(
      mod.default.run(
        { content: '   ' },
        { size: 256, errorCorrection: 'M', margin: 4, fgColor: '#000000', bgColor: '#ffffff' }
      )
    ).rejects.toThrow('Content is required');
  });

  it('returns a PNG file for valid content', async () => {
    const mod = await import('../qr-generate');
    const result = await mod.default.run(
      { content: 'https://example.com' },
      { size: 256, errorCorrection: 'M', margin: 4, fgColor: '#000000', bgColor: '#ffffff' }
    );
    expect(result.type).toBe('file');
    expect(result.mimeType).toBe('image/png');
    expect(result.filename).toBe('qrcode.png');
  });
});
