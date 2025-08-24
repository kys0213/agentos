import { normalize } from '../../memory/embedding/simple-embedding';

export interface CanonicalMeta { normVersion: string; hashAlgo: string; seed: number; }

function hash64(s: string, seed = 0xC0FFEE): number {
  let h = BigInt(seed) ^ 0xcbf29ce484222325n;
  for (let i=0; i<s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * 0x00000100000001B3n) & 0xFFFFFFFFFFFFFFFFn; }
  return Number(h & 0xFFFFFFFFn);
}

export const defaultCanonicalMeta: CanonicalMeta = { normVersion: 'nfc_v1', hashAlgo: 'fnv1a64_demo', seed: 0xC0FFEE };

export function canonicalKey(text: string, meta: CanonicalMeta = defaultCanonicalMeta) {
  const t = normalize(text);
  const h = Math.abs(hash64(t, meta.seed)).toString(36);
  return `ck:${meta.normVersion}:${meta.hashAlgo}:${h}`;
}

