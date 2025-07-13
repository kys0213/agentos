import React from 'react';
import { Preset } from '@agentos/core';

export interface PresetSelectorProps {
  presets: Preset[];
  value?: string;
  onChange(id: string): void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ presets, value, onChange }) => {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ marginRight: '8px' }}
    >
      <option value="">(no preset)</option>
      {presets.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
};

export default PresetSelector;
