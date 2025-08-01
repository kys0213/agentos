import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Button, HStack } from '@chakra-ui/react';
import ColorModeToggle from './ColorModeToggle';
import PresetManager from '../pages/PresetManager';
import LlmBridgeManager from './LlmBridgeManager';
const SettingsMenu = ({ bridgeStore, manager, onBridgesChange }) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showBridges, setShowBridges] = useState(false);
  return _jsxs(HStack, {
    mb: 2,
    spacing: 2,
    children: [
      _jsx(Button, {
        size: 'sm',
        onClick: () => setShowPresets((p) => !p),
        children: 'Preset Manager',
      }),
      _jsx(Button, {
        size: 'sm',
        onClick: () => setShowBridges((b) => !b),
        children: 'LLM Bridges',
      }),
      _jsx(ColorModeToggle, {}),
      showPresets && _jsx(PresetManager, {}),
      showBridges &&
        _jsx(LlmBridgeManager, { store: bridgeStore, manager: manager, onChange: onBridgesChange }),
    ],
  });
};
export default SettingsMenu;
