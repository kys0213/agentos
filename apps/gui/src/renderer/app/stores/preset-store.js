import ElectronStore from 'electron-store';
export class PresetStore {
    constructor(options) {
        this.store = new ElectronStore({
            name: 'presets',
            defaults: { presets: [] },
            ...options,
        });
    }
    list() {
        return this.store.get('presets');
    }
    save(preset) {
        const presets = this.list().filter((p) => p.id !== preset.id);
        presets.push(preset);
        this.store.set('presets', presets);
    }
    delete(id) {
        const presets = this.list().filter((p) => p.id !== id);
        this.store.set('presets', presets);
    }
}
export async function loadPresets(store) {
    return store.list();
}
export async function savePreset(store, preset) {
    store.save(preset);
}
export async function deletePreset(store, id) {
    store.delete(id);
}
