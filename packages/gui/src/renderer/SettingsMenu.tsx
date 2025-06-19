import React, { useState } from 'react';
import PresetManager from './PresetManager';
import LlmBridgeManager from './LlmBridgeManager';
import { LlmBridgeStore } from './llm-bridge-store';
import { BridgeManager } from './BridgeManager';

interface SettingsMenuProps {
  bridgeStore: LlmBridgeStore;
  manager: BridgeManager;
  onBridgesChange(): void;
}
const SettingsMenu: React.FC<SettingsMenuProps> = ({ bridgeStore, manager, onBridgesChange }) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showBridges, setShowBridges] = useState(false);
  return (
    <div style={{ marginBottom: '8px' }}>
      <button onClick={() => setShowPresets((p) => !p)}>Preset Manager</button>
      <button onClick={() => setShowBridges((b) => !b)}>LLM Bridges</button>
      {showPresets && <PresetManager />}
      {showBridges && (
        <LlmBridgeManager store={bridgeStore} manager={manager} onChange={onBridgesChange} />
      )}
    </div>
  );
};

export default SettingsMenu;
