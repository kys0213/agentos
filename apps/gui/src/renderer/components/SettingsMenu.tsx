import { Button, HStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { PresetManager } from './preset/PresetManager';
import ColorModeToggle from './ColorModeToggle';
import LlmBridgeManager from './LlmBridgeManager';
import { MCPToolsManager } from './mcp/McpToolManager';

/**
 * TODO: 상태 변경시 저장하는 기능 추가
 */
interface SettingsMenuProps {
  onBridgesChange(): void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onBridgesChange }) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showBridges, setShowBridges] = useState(false);
  const [showMcpTools, setShowMcpTools] = useState(false);
  return (
    <HStack mb={2} spacing={2}>
      <Button size="sm" onClick={() => setShowPresets((p) => !p)}>
        Preset Manager
      </Button>
      <Button size="sm" onClick={() => setShowBridges((b) => !b)}>
        LLM Bridges
      </Button>
      <Button size="sm" onClick={() => setShowMcpTools((m) => !m)}>
        Tools
      </Button>
      <ColorModeToggle />
      {showPresets && <PresetManager />}
      {showBridges && <LlmBridgeManager onChange={onBridgesChange} />}
      {showMcpTools && <MCPToolsManager />}
    </HStack>
  );
};

export default SettingsMenu;
