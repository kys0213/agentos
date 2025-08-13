import type { MessageHistory } from '../../chat/chat-session';

// Basic runtime type guards for IPC payloads described in IPC_EVENT_SPEC.md

export type AgentStatus = 'active' | 'idle' | 'inactive' | 'error';

export interface AgentStatusPayload {
  agentId: string;
  status: AgentStatus;
}
export interface AgentChangePayload {
  agentId: string;
  patch: Record<string, unknown>;
}
export interface SessionBase {
  agentId: string;
  sessionId: string;
}
export interface SessionStatusPayload extends SessionBase {
  state: string;
  detail?: string;
}
export interface SessionMessagePayload extends SessionBase {
  message: MessageHistory;
}
export interface SessionErrorPayload extends SessionBase {
  error: { message: string; code?: string; domain?: string };
}
export interface SessionPromptRequestPayload extends SessionBase {
  id: string;
  message: string;
  schema?: unknown;
}
export interface SessionConsentRequestPayload extends SessionBase {
  id: string;
  reason: string;
  data?: unknown;
}
export interface SessionSensitiveInputRequestPayload extends SessionBase {
  id: string;
  fields: Array<{ key: string; label: string; secret?: boolean }>;
}

export function parseMaybeJson<T = unknown>(payload: unknown): T {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload) as T;
    } catch {
      return payload as unknown as T;
    }
  }
  return payload as T;
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isAgentStatusPayload(v: unknown): v is AgentStatusPayload {
  const o = v as AgentStatusPayload;
  return isObject(v) && typeof o.agentId === 'string' && typeof o.status === 'string';
}

export function isAgentChangePayload(v: unknown): v is AgentChangePayload {
  const o = v as AgentChangePayload;
  return isObject(v) && typeof o.agentId === 'string' && isObject(o.patch);
}

export function isSessionStatusPayload(v: unknown): v is SessionStatusPayload {
  const o = v as SessionStatusPayload;
  return (
    isObject(v) &&
    typeof o.agentId === 'string' &&
    typeof o.sessionId === 'string' &&
    typeof o.state === 'string'
  );
}

export function isSessionMessagePayload(v: unknown): v is SessionMessagePayload {
  const o = v as SessionMessagePayload;
  return (
    isObject(v) &&
    typeof o.agentId === 'string' &&
    typeof o.sessionId === 'string' &&
    isObject(o.message)
  );
}

export function isSessionErrorPayload(v: unknown): v is SessionErrorPayload {
  const o = v as SessionErrorPayload;
  return (
    isObject(v) &&
    typeof o.agentId === 'string' &&
    typeof o.sessionId === 'string' &&
    isObject(o.error) &&
    typeof o.error.message === 'string'
  );
}

export function isSessionPromptRequestPayload(v: unknown): v is SessionPromptRequestPayload {
  const o = v as SessionPromptRequestPayload;
  return (
    isObject(v) &&
    typeof o.agentId === 'string' &&
    typeof o.sessionId === 'string' &&
    typeof o.id === 'string' &&
    typeof o.message === 'string'
  );
}

export function isSessionConsentRequestPayload(v: unknown): v is SessionConsentRequestPayload {
  const o = v as SessionConsentRequestPayload;
  return (
    isObject(v) &&
    typeof o.agentId === 'string' &&
    typeof o.sessionId === 'string' &&
    typeof o.id === 'string' &&
    typeof o.reason === 'string'
  );
}

export function isSessionSensitiveInputRequestPayload(
  v: unknown
): v is SessionSensitiveInputRequestPayload {
  const o = v as SessionSensitiveInputRequestPayload;
  const arr = (o && (o as any).fields) as unknown;
  return (
    isObject(v) &&
    typeof (o as any).agentId === 'string' &&
    typeof (o as any).sessionId === 'string' &&
    typeof (o as any).id === 'string' &&
    Array.isArray(arr)
  );
}
