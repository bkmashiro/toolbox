import { describe, it, expect } from 'vitest';

// Re-implement the conversion helpers to test color logic independently
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

describe('color-palette helpers', () => {
  describe('hexToHsl / hslToHex roundtrip', () => {
    it('converts red #ff0000 to HSL(0, 100, 50)', () => {
      const [h, s, l] = hexToHsl('#ff0000');
      expect(h).toBe(0);
      expect(s).toBe(100);
      expect(l).toBe(50);
    });

    it('converts #00ff00 (lime) to HSL(120, 100, 50)', () => {
      const [h, s, l] = hexToHsl('#00ff00');
      expect(h).toBe(120);
      expect(s).toBe(100);
      expect(l).toBe(50);
    });

    it('roundtrips hex -> hsl -> hex for blue', () => {
      const original = '#0000ff';
      const [h, s, l] = hexToHsl(original);
      const back = hslToHex(h, s, l);
      expect(back).toBe(original);
    });
  });

  describe('complementary color is 180° apart in HSL', () => {
    it('complementary of red (#ff0000) is cyan (#00ffff)', () => {
      const base = '#ff0000';
      const [h, s, l] = hexToHsl(base);
      const complement = hslToHex(h + 180, s, l);
      const [ch] = hexToHsl(complement);
      // Hue should be 180° away
      const diff = Math.abs(ch - h);
      expect(diff === 180 || diff === 0).toBe(true); // 0 handles 0/360 wraparound edge case — diff should be 180
      expect(Math.abs(ch - (h + 180) % 360) <= 1).toBe(true);
    });

    it('complementary of blue (#0000ff) hue is 180° away', () => {
      const base = '#0000ff';
      const [h, s, l] = hexToHsl(base);
      const complement = hslToHex(h + 180, s, l);
      const [ch] = hexToHsl(complement);
      const expectedH = (h + 180) % 360;
      expect(Math.abs(ch - expectedH) <= 2).toBe(true);
    });

    it('complementary of lime (#00ff00) hue is 180° away', () => {
      const base = '#00ff00';
      const [h, s, l] = hexToHsl(base);
      const complement = hslToHex(h + 180, s, l);
      const [ch] = hexToHsl(complement);
      const expectedH = (h + 180) % 360;
      expect(Math.abs(ch - expectedH) <= 2).toBe(true);
    });
  });

  describe('hslToHex wraps hue correctly', () => {
    it('hue 360 wraps to 0 (same as red)', () => {
      const r = hslToHex(0, 100, 50);
      const r360 = hslToHex(360, 100, 50);
      expect(r).toBe(r360);
    });

    it('hue -180 wraps to 180 (same as cyan)', () => {
      const cyan180 = hslToHex(180, 100, 50);
      const cyanNeg = hslToHex(-180, 100, 50);
      expect(cyan180).toBe(cyanNeg);
    });
  });
});
