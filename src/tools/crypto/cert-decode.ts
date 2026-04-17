import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';
import { hexEncode, base64ToBuf, bufToBase64 } from './crypto-utils';

// Minimal ASN.1 DER decoder for X.509 certificates
function readLength(data: Uint8Array, offset: number): { length: number; nextOffset: number } {
  const first = data[offset];
  if (first < 0x80) return { length: first, nextOffset: offset + 1 };
  const numBytes = first & 0x7f;
  let length = 0;
  for (let i = 0; i < numBytes; i++) length = (length << 8) | data[offset + 1 + i];
  return { length, nextOffset: offset + 1 + numBytes };
}

function readTLV(data: Uint8Array, offset: number): { tag: number; value: Uint8Array; nextOffset: number } {
  const tag = data[offset];
  const { length, nextOffset } = readLength(data, offset + 1);
  return { tag, value: data.slice(nextOffset, nextOffset + length), nextOffset: nextOffset + length };
}

function decodeOid(bytes: Uint8Array): string {
  const parts: number[] = [];
  const first = bytes[0];
  parts.push(Math.floor(first / 40));
  parts.push(first % 40);
  let val = 0;
  for (let i = 1; i < bytes.length; i++) {
    val = (val << 7) | (bytes[i] & 0x7f);
    if (!(bytes[i] & 0x80)) { parts.push(val); val = 0; }
  }
  return parts.join('.');
}

const OID_MAP: Record<string, string> = {
  '2.5.4.3': 'CN', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST',
  '2.5.4.10': 'O', '2.5.4.11': 'OU', '2.5.4.17': 'postalCode',
  '2.5.4.5': 'serialNumber', '2.5.4.12': 'title',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.10045.2.1': 'ecPublicKey',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.15': 'keyUsage',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.35': 'authorityKeyIdentifier',
  '2.5.29.14': 'subjectKeyIdentifier',
};

function decodeName(data: Uint8Array): Record<string, string> {
  const result: Record<string, string> = {};
  let offset = 0;
  while (offset < data.length) {
    const set = readTLV(data, offset);
    offset = set.nextOffset;
    const seq = readTLV(set.value, 0);
    const oidTlv = readTLV(seq.value, 0);
    const valTlv = readTLV(seq.value, oidTlv.nextOffset);
    const oidStr = decodeOid(oidTlv.value);
    const key = OID_MAP[oidStr] || oidStr;
    result[key] = new TextDecoder().decode(valTlv.value);
  }
  return result;
}

function decodeTime(data: Uint8Array, tag: number): string {
  const str = new TextDecoder().decode(data);
  if (tag === 0x17) {
    // UTCTime: YYMMDDHHMMSSZ
    const yr = parseInt(str.slice(0, 2), 10);
    const year = yr >= 50 ? 1900 + yr : 2000 + yr;
    return `${year}-${str.slice(2, 4)}-${str.slice(4, 6)}T${str.slice(6, 8)}:${str.slice(8, 10)}:${str.slice(10, 12)}Z`;
  }
  // GeneralizedTime: YYYYMMDDHHMMSSZ
  return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}T${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)}Z`;
}

async function parseCert(der: Uint8Array) {
  const subtle = globalThis.crypto.subtle;
  const sha256 = await subtle.digest('SHA-256', der);
  const sha1 = await subtle.digest('SHA-1', der);

  // Parse the outer SEQUENCE
  const outerSeq = readTLV(der, 0);
  const tbsCert = readTLV(outerSeq.value, 0);

  let offset = 0;
  const tbs = tbsCert.value;

  // Optional version [0]
  if (tbs[offset] === 0xa0) {
    const ver = readTLV(tbs, offset);
    offset = ver.nextOffset;
  }

  // Serial number
  const serialTlv = readTLV(tbs, offset);
  offset = serialTlv.nextOffset;
  const serial = hexEncode(serialTlv.value).replace(/^0+/, '');

  // Signature algorithm
  const sigAlgTlv = readTLV(tbs, offset);
  offset = sigAlgTlv.nextOffset;
  const sigAlgOidTlv = readTLV(sigAlgTlv.value, 0);
  const sigAlg = OID_MAP[decodeOid(sigAlgOidTlv.value)] || decodeOid(sigAlgOidTlv.value);

  // Issuer
  const issuerTlv = readTLV(tbs, offset);
  offset = issuerTlv.nextOffset;
  const issuer = decodeName(issuerTlv.value);

  // Validity
  const validityTlv = readTLV(tbs, offset);
  offset = validityTlv.nextOffset;
  const notBefore = readTLV(validityTlv.value, 0);
  const notAfterTlv = readTLV(validityTlv.value, notBefore.nextOffset);
  const notBeforeStr = decodeTime(notBefore.value, notBefore.tag);
  const notAfterStr = decodeTime(notAfterTlv.value, notAfterTlv.tag);

  // Subject
  const subjectTlv = readTLV(tbs, offset);
  offset = subjectTlv.nextOffset;
  const subject = decodeName(subjectTlv.value);

  // Subject Public Key Info
  const spkiTlv = readTLV(tbs, offset);
  offset = spkiTlv.nextOffset;
  const spkiAlgTlv = readTLV(spkiTlv.value, 0);
  const spkiAlgOidTlv = readTLV(spkiAlgTlv.value, 0);
  const keyAlg = OID_MAP[decodeOid(spkiAlgOidTlv.value)] || decodeOid(spkiAlgOidTlv.value);
  const pubKeyBitStr = readTLV(spkiTlv.value, spkiAlgTlv.nextOffset);
  const pubKeySize = (pubKeyBitStr.value.length - 1) * 8; // rough estimate

  const isExpired = new Date(notAfterStr) < new Date();
  const isNotYetValid = new Date(notBeforeStr) > new Date();

  return {
    subject,
    issuer,
    serialNumber: serial,
    validity: {
      notBefore: notBeforeStr,
      notAfter: notAfterStr,
      isExpired,
      isNotYetValid,
      status: isExpired ? 'EXPIRED' : isNotYetValid ? 'NOT YET VALID' : 'VALID',
    },
    publicKey: {
      algorithm: keyAlg,
      size: `~${pubKeySize} bits`,
    },
    signatureAlgorithm: sigAlg,
    fingerprints: {
      sha256: hexEncode(sha256).match(/.{2}/g)!.join(':'),
      sha1: hexEncode(sha1).match(/.{2}/g)!.join(':'),
    },
  };
}

const tool: Tool = {
  id: 'cert-decode',
  name: 'Certificate Decoder',
  description: 'Parse X.509 PEM certificate — subject, issuer, validity, key info, fingerprints',
  category: 'crypto',
  tags: ['certificate', 'x509', 'pem', 'ssl', 'tls', 'decode', 'subject', 'issuer', 'expiry'],
  inputs: [
    {
      id: 'pem',
      label: 'PEM Certificate',
      type: 'textarea',
      placeholder: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
      rows: 10,
    },
  ],
  options: [],
  output: { type: 'json' },
  apiSupported: false,
  async run(inputs) {
    const pem = ((inputs.pem as string) ?? '').trim();
    if (!pem) throw new Error('PEM certificate is required');

    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    const der = base64ToBuf(b64);
    const info = await parseCert(der);

    return { type: 'json', data: info };
  },
};

registry.register(tool);
export default tool;
