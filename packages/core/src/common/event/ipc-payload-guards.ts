import { AgentStatus } from '../../agent/agent';
import type { MessageHistory } from '../../chat/chat-session';

// Basic runtime type guards for IPC payloads described in IPC_EVENT_SPEC.md

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

export function parseMaybeJson(payload: unknown): unknown {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  }
  return payload;
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isAgentStatusPayload(v: unknown): v is AgentStatusPayload {
  return isObject(v) && typeof v.agentId === 'string' && typeof v.status === 'string';
}

export function isAgentChangePayload(v: unknown): v is AgentChangePayload {
  return isObject(v) && typeof v.agentId === 'string' && isObject(v.patch);
}

export function isSessionStatusPayload(v: unknown): v is SessionStatusPayload {
  return (
    isObject(v) &&
    typeof v.agentId === 'string' &&
    typeof v.sessionId === 'string' &&
    typeof v.state === 'string'
  );
}

export function isSessionMessagePayload(v: unknown): v is SessionMessagePayload {
  return (
    isObject(v) &&
    typeof v.agentId === 'string' &&
    typeof v.sessionId === 'string' &&
    isObject(v.message)
  );
}

export function isSessionErrorPayload(v: unknown): v is SessionErrorPayload {
  return (
    isObject(v) &&
    typeof v.agentId === 'string' &&
    typeof v.sessionId === 'string' &&
    isObject(v.error) &&
    typeof v.error.message === 'string'
  );
}

export function isSessionPromptRequestPayload(v: unknown): v is SessionPromptRequestPayload {
  return (
    isObject(v) &&
    typeof v.agentId === 'string' &&
    typeof v.sessionId === 'string' &&
    typeof v.id === 'string' &&
    typeof v.message === 'string'
  );
}

export function isSessionConsentRequestPayload(v: unknown): v is SessionConsentRequestPayload {
  return (
    isObject(v) &&
    typeof v.agentId === 'string' &&
    typeof v.sessionId === 'string' &&
    typeof v.id === 'string' &&
    typeof v.reason === 'string'
  );
}

export function isSessionSensitiveInputRequestPayload(
  v: unknown
): v is SessionSensitiveInputRequestPayload {
  return (
    isObject(v) &&
    typeof v.agentId === 'string' &&
    typeof v.sessionId === 'string' &&
    typeof v.id === 'string' &&
    Array.isArray(v.fields)
  );
}
