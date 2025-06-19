import React, { useEffect, useState } from 'react';
import { BridgeManager } from './BridgeManager';
import EchoBridge from './bridges/EchoBridge';
import ReverseBridge from './bridges/ReverseBridge';
import { LlmBridgeStore, LlmBridgeConfig } from './llm-bridge-store';

export interface LlmBridgeManagerProps {
  store: LlmBridgeStore;
  manager: BridgeManager;
  onChange?(): void;
}

const LlmBridgeManager: React.FC<LlmBridgeManagerProps> = ({ store, manager, onChange }) => {
  const [bridges, setBridges] = useState<LlmBridgeConfig[]>([]);
  const [id, setId] = useState('');
  const [type, setType] = useState<'echo' | 'reverse'>('echo');

  useEffect(() => {
    setBridges(store.list());
  }, [store]);

  const handleAdd = () => {
    if (!id) return;
    const config: LlmBridgeConfig = { id, type };
    store.save(config);
    const BridgeCtor = type === 'echo' ? EchoBridge : ReverseBridge;
    manager.register(id, new BridgeCtor());
    setBridges(store.list());
    setId('');
    onChange && onChange();
  };

  const handleDelete = (bridgeId: string) => {
    store.delete(bridgeId);
    setBridges(store.list());
    onChange && onChange();
  };

  return (
    <div style={{ padding: '8px' }}>
      <h3>LLM Bridges</h3>
      <ul>
        {bridges.map((b) => (
          <li key={b.id}>
            {b.id} ({b.type}) <button onClick={() => handleDelete(b.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '8px' }}>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Bridge id" />
        <select value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="echo">echo</option>
          <option value="reverse">reverse</option>
        </select>
        <button onClick={handleAdd}>Add</button>
      </div>
    </div>
  );
};

export default LlmBridgeManager;
