import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}));

// Create deterministic mock pixel data for a 4x4 image
const createFakeImageData = (w: number, h: number) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    data[idx] = (i % 3) === 0 ? 255 : 0;     // R
    data[idx + 1] = (i % 3) === 1 ? 255 : 0;  // G
    data[idx + 2] = (i % 3) === 2 ? 255 : 0;  // B
    data[idx + 3] = 255;                       // A
  }
  return { data, width: w, height: h };
};

const mockCtx = {
  drawImage: vi.fn(),
  getImageData: vi.fn((x: number, y: number, w: number, h: number) => createFakeImageData(w, h)),
};

const mockBitmap = { width: 100, height: 100, close: vi.fn() };
(globalThis as Record<string, unknown>).createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
};

vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
  return document.createElement(tag);
});

describe('palette-extract tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as Record<string, unknown>).createImageBitmap = vi.fn().mockResolvedValue({ width: 100, height: 100, close: vi.fn() });
  });

  it('registers with correct id', async () => {
    const mod = await import('../palette-extract');
    expect(mod.default.id).toBe('palette-extract');
    expect(mod.default.category).toBe('image');
  });

  it('has count option with correct range', async () => {
    const mod = await import('../palette-extract');
    const countOpt = mod.default.options.find((o) => o.id === 'count');
    expect(countOpt).toBeDefined();
    expect(countOpt!.min).toBe(3);
    expect(countOpt!.max).toBe(12);
    expect(countOpt!.default).toBe(6);
  });

  it('returns json with array of colors', async () => {
    const mod = await import('../palette-extract');
    const fakeFile = new File(['x'], 'img.png', { type: 'image/png' });
    const result = await mod.default.run({ image: fakeFile }, { count: 3 });
    expect(result.type).toBe('json');
    expect(Array.isArray(result.data)).toBe(true);
    const colors = result.data as Array<{ hex: string; rgb: string }>;
    expect(colors.length).toBe(3);
    expect(colors[0].hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(colors[0].rgb).toMatch(/^rgb\(/);
  });

  it('respects the count option', async () => {
    const mod = await import('../palette-extract');
    const fakeFile = new File(['x'], 'img.png', { type: 'image/png' });
    const result = await mod.default.run({ image: fakeFile }, { count: 5 });
    const colors = result.data as Array<unknown>;
    expect(colors.length).toBe(5);
  });
});
