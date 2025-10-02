import React from 'react';
import type { ReadonlyPreset } from '@agentos/core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface PresetSelectorProps {
  presets: ReadonlyPreset[];
  value?: string;
  onChange(id: string): void;
}

const NONE_OPTION_VALUE = '__none__';

const PresetSelector: React.FC<PresetSelectorProps> = ({ presets, value, onChange }) => {
  const handleChange = (nextValue: string) => {
    if (nextValue === NONE_OPTION_VALUE) {
      onChange('');
      return;
    }
    onChange(nextValue);
  };

  return (
    <Select value={value ?? NONE_OPTION_VALUE} onValueChange={handleChange}>
      <SelectTrigger className="w-full max-w-sm">
        <SelectValue placeholder="(no preset)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_OPTION_VALUE}>(no preset)</SelectItem>
        {Array.isArray(presets) &&
          presets.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              {preset.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

export default PresetSelector;
