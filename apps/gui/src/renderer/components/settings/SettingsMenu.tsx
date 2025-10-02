import React, { useState } from 'react';
import { PresetManager } from '../preset/PresetManager';
import ColorModeToggle from '../common/ColorModeToggle';
import { MCPToolsManager } from '../mcp/McpToolManager';
import { Button } from '../ui/button';

/**
 * TODO: 상태 변경시 저장하는 기능 추가
 */
interface SettingsMenuProps {}

const SettingsMenu: React.FC<SettingsMenuProps> = () => {
  const [showPresets, setShowPresets] = useState(false);
  const [showMcpTools, setShowMcpTools] = useState(false);
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setShowPresets((p) => !p)}>
        Preset Manager
      </Button>
      <Button variant="outline" size="sm" onClick={() => setShowMcpTools((m) => !m)}>
        Tools
      </Button>
      <ColorModeToggle />
      {showPresets && <PresetManager />}
      {showMcpTools && <MCPToolsManager />}
    </div>
  );
};

export default SettingsMenu;
