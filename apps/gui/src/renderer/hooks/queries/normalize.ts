import type { Message, MultiModalContent } from 'llm-bridge-spec';
import type { LlmManifest, LlmBridgeCapabilities } from 'llm-bridge-spec';

export function normalizeToArrayContent(m: Message): MultiModalContent[] {
  return m.content;
}

export function toCapabilityLabels(manifest: LlmManifest): string[] {
  const labels: string[] = [];
  const caps: LlmBridgeCapabilities = manifest.capabilities;
  if (Array.isArray(caps.modalities)) {
    labels.push(...caps.modalities);
  }
  if (caps.supportsToolCall) {
    labels.push('tool-call');
  }
  if (caps.supportsFunctionCall) {
    labels.push('function-call');
  }
  if (caps.supportsMultiTurn) {
    labels.push('multi-turn');
  }
  if (caps.supportsStreaming) {
    labels.push('streaming');
  }
  if (caps.supportsVision) {
    labels.push('vision');
  }
  return Array.from(new Set(labels));
}
