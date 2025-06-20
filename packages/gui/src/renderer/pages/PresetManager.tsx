import React, { useEffect, useState } from 'react';
import { Preset } from '@agentos/core';
import { PresetStore, loadPresets, savePreset, deletePreset } from '../stores/preset-store';

const store = new PresetStore();

const emptyPreset = (): Preset => ({
  id: Date.now().toString(),
  name: '',
  description: '',
  author: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  version: '1.0.0',
  systemPrompt: '',
  enabledMcps: [],
  llmBridgeName: '',
  llmBridgeConfig: {},
});

const PresetManager: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [current, setCurrent] = useState<Preset>(emptyPreset());

  useEffect(() => {
    loadPresets(store).then(setPresets);
  }, []);

  const handleSave = async () => {
    await savePreset(store, { ...current, updatedAt: new Date() });
    setCurrent(emptyPreset());
    setPresets(await loadPresets(store));
  };

  const handleDelete = async (id: string) => {
    await deletePreset(store, id);
    setPresets(await loadPresets(store));
  };

  return (
    <div style={{ padding: '8px' }}>
      <h3>Presets</h3>
      <ul>
        {presets.map((p) => (
          <li key={p.id}>
            {p.name} <button onClick={() => handleDelete(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '8px' }}>
        <input
          value={current.name}
          onChange={(e) => setCurrent({ ...current, name: e.target.value })}
          placeholder="Preset name"
        />
        <button onClick={handleSave}>Add</button>
      </div>
    </div>
  );
};

export default PresetManager;
