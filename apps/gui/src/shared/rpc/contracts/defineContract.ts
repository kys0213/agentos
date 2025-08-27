import type { z } from 'zod';

export type ZodSchema<T = unknown> = z.ZodTypeAny | { _type?: T };

export interface MethodSpec {
  channel: string;
  payload?: ZodSchema;
  response?: ZodSchema;
}

export interface ContractSpec {
  namespace: string;
  methods: Record<string, MethodSpec>;
}

export function defineContract<T extends ContractSpec>(spec: T): T {
  return spec;
}
