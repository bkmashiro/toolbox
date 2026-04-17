import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the registry to capture registrations without side effects
vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}));

// Mock createImageBitmap and canvas APIs for jsdom
const mockBitmap = { width: 100, height: 50, close: vi.fn() };
(globalThis as Record<string, unknown>).createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);

const mockBlob = new Blob(['fake-png'], { type: 'image/png' });
const mockCtx = {
  drawImage: vi.fn(),
};
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
  toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
};

vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
  return document.createElement(tag);
});

describe('image-convert tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas.toBlob.mockImplementation((cb: (b: Blob | null) => void) => cb(mockBlob));
    (globalThis as Record<string, unknown>).createImageBitmap = vi.fn().mockResolvedValue({ width: 100, height: 50, close: vi.fn() });
  });

  it('registers with the registry', async () => {
    const { registry } = await import('../../../core/registry');
    await import('../image-convert');
    expect(registry.register).toHaveBeenCalledOnce();
  });

  it('exports a tool with correct id', async () => {
    const mod = await import('../image-convert');
    expect(mod.default.id).toBe('image-convert');
    expect(mod.default.category).toBe('image');
  });

  it('has correct options', async () => {
    const mod = await import('../image-convert');
    const optionIds = mod.default.options.map((o) => o.id);
    expect(optionIds).toContain('format');
    expect(optionIds).toContain('quality');
    expect(optionIds).toContain('resizeWidth');
    expect(optionIds).toContain('resizeHeight');
    expect(optionIds).toContain('maintainAspect');
  });

  it('returns a file result', async () => {
    const mod = await import('../image-convert');
    const fakeFile = new File(['data'], 'test.png', { type: 'image/png' });
    const result = await mod.default.run(
      { image: fakeFile },
      { format: 'jpeg', quality: 80, resizeWidth: 0, resizeHeight: 0, maintainAspect: true }
    );
    expect(result.type).toBe('file');
    expect(result.filename).toMatch(/\.jpg$/);
  });

  it('sets correct MIME type for webp output', async () => {
    const mod = await import('../image-convert');
    const fakeFile = new File(['data'], 'test.png', { type: 'image/png' });
    const result = await mod.default.run(
      { image: fakeFile },
      { format: 'webp', quality: 85, resizeWidth: 0, resizeHeight: 0, maintainAspect: true }
    );
    expect(result.mimeType).toBe('image/webp');
  });
});
