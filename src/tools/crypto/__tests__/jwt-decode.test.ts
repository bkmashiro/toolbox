import { describe, it, expect } from 'vitest';
import tool from '../jwt-decode';

const KNOWN_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('jwt-decode', () => {
  it('decodes known JWT header correctly', async () => {
    const result = await tool.run({ jwt: KNOWN_JWT }, {});
    expect(result.type).toBe('json');
    const data = result.data as { header: Record<string, unknown> };
    expect(data.header.alg).toBe('HS256');
    expect(data.header.typ).toBe('JWT');
  });

  it('decodes known JWT payload correctly', async () => {
    const result = await tool.run({ jwt: KNOWN_JWT }, {});
    const data = result.data as { payload: Record<string, unknown> };
    expect(data.payload.sub).toBe('1234567890');
    expect(data.payload.name).toBe('John Doe');
    expect(data.payload.iat).toBe(1516239022);
  });

  it('marks expired JWT correctly', async () => {
    // JWT with exp in the past (exp: 1)
    const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjF9.';
    // We need 3 parts, even if signature is empty
    const result = await tool.run({ jwt: expiredJwt + 'abc' }, {});
    const data = result.data as { expiry: { isExpired: boolean } };
    expect(data.expiry.isExpired).toBe(true);
  });

  it('throws on invalid JWT format', async () => {
    await expect(tool.run({ jwt: 'not.a.valid.jwt.with.too.many.parts' }, {})).rejects.toThrow();
  });

  it('throws on empty input', async () => {
    await expect(tool.run({ jwt: '' }, {})).rejects.toThrow('JWT token is required');
  });

  it('includes expiry field for token with no exp', async () => {
    const result = await tool.run({ jwt: KNOWN_JWT }, {});
    const data = result.data as { expiry: { status: string } };
    expect(data.expiry.status).toContain('No expiry');
  });
});
