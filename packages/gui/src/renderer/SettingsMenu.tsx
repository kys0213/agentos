import React, { useState } from 'react';
import PresetManager from './PresetManager';

const SettingsMenu: React.FC = () => {
  const [showPresets, setShowPresets] = useState(false);
  return (
    <div style={{ marginBottom: '8px' }}>
      <button onClick={() => setShowPresets((p) => !p)}>Preset Manager</button>
      {showPresets && <PresetManager />}
    </div>
  );
};

export default SettingsMenu;
