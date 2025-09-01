import type { SparseVec } from '../../memory/embedding/simple-embedding';

export function serializeSparse(v?: SparseVec | number[]) {
  if (!v) {
    return null;
  }
  if (Array.isArray(v)) {
    return v;
  }
  return [...(v as SparseVec).entries()];
}

export function deserializeSparse(x: unknown): SparseVec | number[] | undefined {
  if (!x) {
    return undefined;
  }
  if (Array.isArray(x) && (x.length === 0 || typeof x[0] === 'number')) {
    return x as number[];
  }
  return new Map<number, number>(x as Array<[number, number]>);
}
