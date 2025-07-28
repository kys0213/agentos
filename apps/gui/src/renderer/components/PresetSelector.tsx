import React from 'react';
import { Select } from '@chakra-ui/react';
import type { Preset } from '../types/core-types';

export interface PresetSelectorProps {
  presets: Preset[];
  value?: string;
  onChange(id: string): void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ presets, value, onChange }) => {
  return (
    <Select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      w="auto"
      size="sm"
      mr={{ base: 2, md: 3 }}
    >
      <option value="">(no preset)</option>
      {presets.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </Select>
  );
};

export default PresetSelector;
