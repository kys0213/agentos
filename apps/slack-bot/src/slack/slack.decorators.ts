import 'reflect-metadata';

import { SetMetadata } from '@nestjs/common';

export const SLACK_HANDLER_METADATA_KEY = 'slack:handler';

export type SlackHandlerType = 'event' | 'command' | 'action';

export interface SlackBindingMetadata {
  readonly type: SlackHandlerType;
  readonly matcher: string;
}

const createSlackDecorator =
  (type: SlackHandlerType) =>
  (matcher: string): MethodDecorator =>
    SetMetadata(SLACK_HANDLER_METADATA_KEY, {
      type,
      matcher,
    } satisfies SlackBindingMetadata);

export const SlackEvent = createSlackDecorator('event');
export const SlackCommand = createSlackDecorator('command');
export const SlackAction = createSlackDecorator('action');

export const SLACK_PARAM_METADATA_KEY = 'slack:param';

export type SlackParamSource =
  | 'event'
  | 'command'
  | 'action'
  | 'payload'
  | 'body'
  | 'context'
  | 'client'
  | 'ack'
  | 'respond'
  | 'say';

export interface SlackParamMetadataEntry {
  readonly index: number;
  readonly source: SlackParamSource;
  readonly path?: string;
}

const pluckValue = (target: unknown, path?: string): unknown => {
  if (!path || typeof path !== 'string') {
    return target;
  }

  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, target);
};

const getMethodReference = (
  target: object,
  propertyKey: string | symbol
): ((...args: unknown[]) => unknown) => {
  const descriptor = Reflect.getOwnPropertyDescriptor(target, propertyKey);
  const method = descriptor?.value ?? (target as Record<string | symbol, unknown>)[propertyKey];

  if (typeof method !== 'function') {
    throw new Error('Slack 파라미터 데코레이터는 메서드에만 선언할 수 있습니다.');
  }

  return method;
};

const pushSlackParamMetadata = (
  target: object,
  propertyKey: string | symbol,
  metadata: SlackParamMetadataEntry
): void => {
  const method = getMethodReference(target, propertyKey);
  const existing =
    (Reflect.getMetadata(SLACK_PARAM_METADATA_KEY, method) as SlackParamMetadataEntry[] | undefined) ?? [];

  Reflect.defineMetadata(SLACK_PARAM_METADATA_KEY, [...existing, metadata], method);
};

const createSlackParamDecorator =
  (source: SlackParamSource) =>
  (path?: string): ParameterDecorator =>
  (target, propertyKey, parameterIndex) => {
    pushSlackParamMetadata(target, propertyKey, {
      index: parameterIndex,
      source,
      path,
    });
  };

export const SlackEventPayload = createSlackParamDecorator('event');
export const SlackCommandPayload = createSlackParamDecorator('command');
export const SlackActionPayload = createSlackParamDecorator('action');
export const SlackPayload = createSlackParamDecorator('payload');
export const SlackBody = createSlackParamDecorator('body');
export const SlackContext = createSlackParamDecorator('context');
export const SlackClient = createSlackParamDecorator('client');
export const SlackAck = createSlackParamDecorator('ack');
export const SlackRespond = createSlackParamDecorator('respond');
export const SlackSay = createSlackParamDecorator('say');

export const resolveSlackParamValue = (
  source: SlackParamSource,
  args: unknown[],
  path?: string
): unknown => {
  const [middlewareArgs] = args as [Record<string, unknown>?];

  if (!middlewareArgs || typeof middlewareArgs !== 'object') {
    return undefined;
  }

  if (source === 'event' || source === 'command' || source === 'action') {
    return pluckValue((middlewareArgs as Record<string, unknown>)[source], path);
  }

  if (source === 'payload') {
    return pluckValue(middlewareArgs.payload, path);
  }

  if (source === 'body' || source === 'context' || source === 'client') {
    return pluckValue(middlewareArgs[source], path);
  }

  if (source === 'ack' || source === 'respond' || source === 'say') {
    const value = middlewareArgs[source];
    return typeof value === 'function' ? value : undefined;
  }

  return undefined;
};

export const buildSlackParameterArray = (
  metadata: SlackParamMetadataEntry[],
  methodLength: number,
  boltArgs: unknown[]
): unknown[] => {
  if (!metadata.length) {
    return boltArgs;
  }

  const maxIndex = metadata.reduce((max, { index }) => Math.max(max, index), -1);
  const params = new Array(Math.max(methodLength, maxIndex + 1)).fill(undefined) as unknown[];

  for (const entry of metadata) {
    params[entry.index] = resolveSlackParamValue(entry.source, boltArgs, entry.path);
  }

  return params;
};
