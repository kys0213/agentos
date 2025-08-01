import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Select } from '@chakra-ui/react';
const PresetSelector = ({ presets, value, onChange }) => {
  return _jsxs(Select, {
    value: value ?? '',
    onChange: (e) => onChange(e.target.value),
    w: 'auto',
    size: 'sm',
    mr: { base: 2, md: 3 },
    children: [
      _jsx('option', { value: '', children: '(no preset)' }),
      (presets || []).map((p) => _jsx('option', { value: p.id, children: p.name }, p.id)),
    ],
  });
};
export default PresetSelector;
