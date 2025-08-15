import type { Message, MultiModalContent } from 'llm-bridge-spec';
import type { LlmManifest } from 'llm-bridge-spec';

export function normalizeToArrayContent(m: Message): MultiModalContent[] {
  const c = (m as any).content;
  if (Array.isArray(c)) {
    return c as MultiModalContent[];
  }
  if (typeof c === 'string') {
    return [{ contentType: 'text', value: c }];
  }
  if (c && typeof c === 'object' && 'contentType' in c) {
    return [c as MultiModalContent];
  }
  return [{ contentType: 'text', value: String(c ?? '') }];
}

export function toCapabilityLabels(manifest: LlmManifest): string[] {
  const labels: string[] = [];
  const caps: any = (manifest as any).capabilities as any;
  if (Array.isArray(caps?.modalities)) labels.push(...caps.modalities);
  if (caps?.supportsToolCall) labels.push('tool-call');
  if (caps?.supportsFunctionCall) labels.push('function-call');
  if (caps?.supportsMultiTurn) labels.push('multi-turn');
  if (caps?.supportsStreaming) labels.push('streaming');
  if (caps?.supportsVision) labels.push('vision');
  return Array.from(new Set(labels));
}
