import Store from 'electron-store';
import { Preset } from '@agentos/core';

export class PresetStore {
  private store: Store<{ presets: Preset[] }>;

  constructor(options?: Store.Options<{ presets: Preset[] }>) {
    this.store = new Store<{ presets: Preset[] }>({
      name: 'presets',
      defaults: { presets: [] },
      ...options,
    });
  }

  list(): Preset[] {
    return this.store.get('presets');
  }

  save(preset: Preset): void {
    const presets = this.list().filter((p) => p.id !== preset.id);
    presets.push(preset);
    this.store.set('presets', presets);
  }

  delete(id: string): void {
    const presets = this.list().filter((p) => p.id !== id);
    this.store.set('presets', presets);
  }
}

export async function loadPresets(store: PresetStore): Promise<Preset[]> {
  return store.list();
}

export async function savePreset(store: PresetStore, preset: Preset): Promise<void> {
  store.save(preset);
}

export async function deletePreset(store: PresetStore, id: string): Promise<void> {
  store.delete(id);
}
