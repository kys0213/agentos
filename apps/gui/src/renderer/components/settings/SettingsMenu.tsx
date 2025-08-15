import { Button, HStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { PresetManager } from '../preset/PresetManager';
import ColorModeToggle from '../common/ColorModeToggle';
import { MCPToolsManager } from '../mcp/McpToolManager';

/**
 * TODO: 상태 변경시 저장하는 기능 추가
 */
interface SettingsMenuProps {}

const SettingsMenu: React.FC<SettingsMenuProps> = () => {
  const [showPresets, setShowPresets] = useState(false);
  const [showMcpTools, setShowMcpTools] = useState(false);
  return (
    <HStack mb={2} spacing={2}>
      <Button size="sm" onClick={() => setShowPresets((p) => !p)}>
        Preset Manager
      </Button>
      <Button size="sm" onClick={() => setShowMcpTools((m) => !m)}>
        Tools
      </Button>
      <ColorModeToggle />
      {showPresets && <PresetManager />}
      {showMcpTools && <MCPToolsManager />}
    </HStack>
  );
};

export default SettingsMenu;
