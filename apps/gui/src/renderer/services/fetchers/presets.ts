import { ServiceContainer } from '../../ipc/service-container';
import type { Preset, CreatePreset } from '@agentos/core';

export async function fetchPresets(): Promise<Preset[]> {
  const presetService = ServiceContainer.getOrThrow('preset');
  return await presetService.getAllPresets();
}

export async function fetchPresetById(id: string): Promise<Preset | null> {
  const presetService = ServiceContainer.getOrThrow('preset');
  return await presetService.getPreset(id);
}

export async function createPreset(data: CreatePreset): Promise<Preset> {
  const presetService = ServiceContainer.getOrThrow('preset');
  return await presetService.createPreset(data);
}

export async function updatePreset(id: string, data: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
  const presetService = ServiceContainer.getOrThrow('preset');
  return await presetService.updatePreset(id, data);
}

export async function deletePreset(id: string): Promise<Preset> {
  const presetService = ServiceContainer.getOrThrow('preset');
  return await presetService.deletePreset(id);
}

export async function duplicatePresetById(id: string): Promise<Preset> {
  const presetService = ServiceContainer.getOrThrow('preset');
  const src = await presetService.getPreset(id);
  if (!src) {
    throw new Error('Preset not found');
  }
  const copy: CreatePreset = {
    name: src.name + ' (Copy)',
    description: src.description,
    author: src.author,
    version: src.version,
    systemPrompt: src.systemPrompt,
    enabledMcps: src.enabledMcps,
    llmBridgeName: src.llmBridgeName,
    llmBridgeConfig: src.llmBridgeConfig,
    status: src.status,
    category: src.category,
  };
  return await presetService.createPreset(copy);
}
