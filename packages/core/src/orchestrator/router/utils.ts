import type { RouterQuery, BuildDocFn } from './types';
import type { ReadonlyAgentMetadata } from '../../agent/agent-metadata';

// Avoid runtime dependency on 'llm-bridge-spec' in CJS build path.
// Implement minimal string-content guard locally to preserve behavior.
type BridgeContent = { contentType: string; value: unknown };
function isStringContent(c: unknown): c is BridgeContent & { value: string } {
  return (
    !!c &&
    typeof c === 'object' &&
    (c as { contentType?: unknown }).contentType === 'text' &&
    typeof (c as { value?: unknown }).value === 'string'
  );
}

export function getQueryText(query: RouterQuery): string {
  if (query.text && query.text.trim().length > 0) {
    return query.text;
  }
  if (query.content && query.content.length > 0) {
    const texts: string[] = [];
    for (const c of query.content) {
      if (isStringContent(c)) {
        const v = c.value;
        if (v.trim().length > 0) {
          texts.push(v);
        }
      }
    }
    return texts.join('\n');
  }
  return '';
}

export const buildSafeDoc: BuildDocFn = (meta, options) => {
  const limit = Math.max(0, Math.min(4096, options?.promptLimit ?? 512));
  const parts: string[] = [];
  parts.push(`name: ${meta.name}`);

  if (meta.description) {
    parts.push(`desc: ${truncate(meta.description, 256)}`);
  }

  if (meta.keywords?.length) {
    parts.push(`keywords: ${meta.keywords.join(', ')}`);
  }
  if (meta.preset?.category?.length) {
    parts.push(`cats: ${meta.preset.category.join(', ')}`);
  }
  try {
    const tools = meta.preset?.enabledMcps?.flatMap((m) => m.enabledTools) ?? [];
    const toolTokens = tools.flatMap((t) => [t.name, t.title]).filter(Boolean) as string[];
    if (toolTokens.length) {
      parts.push(`tools: ${Array.from(new Set(toolTokens)).join(', ')}`);
    }
  } catch {
    // ignore
  }
  // 엄격히 시스템 프롬프트 원문은 포함하지 않음. 필요 시 짧은 스니펫만.
  if (meta.preset?.systemPrompt) {
    parts.push(`promptSnippet: ${truncate(meta.preset.systemPrompt, 200)}`);
  }
  const doc = parts.join(' | ');
  return doc.length > limit ? doc.slice(0, limit) : doc;
};

function truncate(s: string, n: number): string {
  if (!s) {
    return '';
  }
  return s.length <= n ? s : s.slice(0, n);
}

export type StatusRank = 'active' | 'idle' | 'inactive' | 'error';

export function statusOrder(s?: string): number {
  switch (s) {
    case 'active':
      return 0;
    case 'idle':
      return 1;
    case 'inactive':
      return 2;
    case 'error':
      return 3;
    default:
      return 4;
  }
}

export function allowByStatus(meta: ReadonlyAgentMetadata, query: RouterQuery): boolean {
  if (meta.status === 'active') {
    return true;
  }

  if (meta.status === 'idle') {
    const hints = (query.hints ?? []).map((h) => h.toLowerCase());
    const names = [meta.name?.toLowerCase(), meta.id?.toLowerCase()].filter(Boolean) as string[];
    return names.some((n) => hints.includes(n));
  }
  // inactive/error 기본 제외
  return false;
}

// Content type guards are delegated to MultiModalContentHelper (llm-bridge-spec)
