import React, { useState } from 'react';
import { Button, HStack } from '@chakra-ui/react';
import ColorModeToggle from './ColorModeToggle';
import PresetManager from '../pages/PresetManager';
import LlmBridgeManager from './LlmBridgeManager';
import { LlmBridgeStore } from '../stores/llm-bridge-store';
import { BridgeManager } from '../utils/BridgeManager';

interface SettingsMenuProps {
  bridgeStore: LlmBridgeStore;
  manager: BridgeManager;
  onBridgesChange(): void;
}
const SettingsMenu: React.FC<SettingsMenuProps> = ({ bridgeStore, manager, onBridgesChange }) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showBridges, setShowBridges] = useState(false);
  return (
    <HStack mb={2} spacing={2}>
      <Button size="sm" onClick={() => setShowPresets((p) => !p)}>
        Preset Manager
      </Button>
      <Button size="sm" onClick={() => setShowBridges((b) => !b)}>
        LLM Bridges
      </Button>
      <ColorModeToggle />
      {showPresets && <PresetManager />}
      {showBridges && (
        <LlmBridgeManager onChange={onBridgesChange} />
      )}
    </HStack>
  );
};

export default SettingsMenu;
