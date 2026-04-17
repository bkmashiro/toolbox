/**
 * Shared crypto utility functions.
 */

export function hexEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexDecode(str: string): Uint8Array<ArrayBuffer> {
  const clean = str.replace(/\s/g, '');
  if (clean.length % 2 !== 0) throw new Error('Invalid hex string');
  const buf = new ArrayBuffer(clean.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBuf(str: string): Uint8Array<ArrayBuffer> {
  const binary = atob(str);
  const buf = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function strToBytes(str: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(str);
  // TextEncoder.encode() returns Uint8Array<ArrayBufferLike>; copy to ArrayBuffer-backed one
  const buf = new ArrayBuffer(encoded.length);
  const bytes = new Uint8Array(buf);
  bytes.set(encoded);
  return bytes;
}

export function bytesToStr(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return new TextDecoder().decode(bytes);
}
