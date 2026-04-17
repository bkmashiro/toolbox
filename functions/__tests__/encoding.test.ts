import { describe, it, expect } from 'vitest';
import { encodingRoutes } from '../api/routes/encoding';

async function fetchRoute(path: string): Promise<{ ok: boolean; result?: string; error?: string }> {
  const req = new Request(`http://localhost${path}`);
  const res = await encodingRoutes.fetch(req);
  return res.json();
}

describe('encoding routes', () => {
  describe('base64', () => {
    it('encodes a string to base64', async () => {
      const body = await fetchRoute('/base64?mode=encode&input=hello');
      expect(body.ok).toBe(true);
      expect(body.result).toBe('aGVsbG8=');
    });

    it('decodes a base64 string', async () => {
      const body = await fetchRoute('/base64?mode=decode&input=aGVsbG8%3D');
      expect(body.ok).toBe(true);
      expect(body.result).toBe('hello');
    });

    it('roundtrip: encode then decode returns original', async () => {
      const original = 'Hello, World! 123';
      const encoded = await fetchRoute(`/base64?mode=encode&input=${encodeURIComponent(original)}`);
      expect(encoded.ok).toBe(true);

      const decoded = await fetchRoute(`/base64?mode=decode&input=${encodeURIComponent(encoded.result!)}`);
      expect(decoded.ok).toBe(true);
      expect(decoded.result).toBe(original);
    });

    it('URL-safe base64 replaces + and /', async () => {
      // ">" encodes to a base64 string potentially containing + or /
      const body = await fetchRoute('/base64?mode=encode&input=%3E%3F&urlSafe=1');
      expect(body.ok).toBe(true);
      expect(body.result).not.toContain('+');
      expect(body.result).not.toContain('/');
    });

    it('returns error for invalid base64 decode input', async () => {
      const body = await fetchRoute('/base64?mode=decode&input=!!!invalid!!!');
      expect(body.ok).toBe(false);
    });
  });

  describe('hex', () => {
    it('encodes string to hex', async () => {
      const body = await fetchRoute('/hex?mode=encode&input=hi');
      expect(body.ok).toBe(true);
      expect(body.result).toBe('6869');
    });

    it('decodes hex to string', async () => {
      const body = await fetchRoute('/hex?mode=decode&input=6869');
      expect(body.ok).toBe(true);
      expect(body.result).toBe('hi');
    });

    it('roundtrip: encode then decode returns original', async () => {
      const original = 'roundtrip test';
      const encoded = await fetchRoute(`/hex?mode=encode&input=${encodeURIComponent(original)}`);
      expect(encoded.ok).toBe(true);

      const decoded = await fetchRoute(`/hex?mode=decode&input=${encoded.result}`);
      expect(decoded.ok).toBe(true);
      expect(decoded.result).toBe(original);
    });
  });

  describe('url-encode', () => {
    it('encodes special characters', async () => {
      const body = await fetchRoute('/url-encode?mode=encode&input=hello%20world');
      expect(body.ok).toBe(true);
      expect(body.result).toBe('hello%20world');
    });

    it('decodes encoded string', async () => {
      const body = await fetchRoute('/url-encode?mode=decode&input=hello%2520world');
      expect(body.ok).toBe(true);
      expect(body.result).toContain('hello');
    });
  });

  describe('number-base', () => {
    it('converts 255 from base 10 to hex (ff)', async () => {
      const body = await fetchRoute('/number-base?number=255&from=10&to=16');
      expect(body.ok).toBe(true);
      expect(body.result).toBe('ff');
    });

    it('converts ff from hex (base 16) to decimal (255)', async () => {
      const body = await fetchRoute('/number-base?number=ff&from=16&to=10');
      expect(body.ok).toBe(true);
      expect(body.result).toBe('255');
    });

    it('converts 10 from base 2 (binary) to decimal', async () => {
      const body = await fetchRoute('/number-base?number=1010&from=2&to=10');
      expect(body.ok).toBe(true);
      expect(body.result).toBe('10');
    });

    it('returns error for invalid base', async () => {
      const body = await fetchRoute('/number-base?number=255&from=1&to=16');
      expect(body.ok).toBe(false);
    });
  });
});
