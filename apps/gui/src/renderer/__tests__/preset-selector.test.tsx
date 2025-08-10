import React from 'react';
import renderer from 'react-test-renderer';
import PresetSelector from '../components/preset/PresetSelector';
import { Preset } from '@agentos/core';

describe('PresetSelector', () => {
  const presets: Preset[] = [
    {
      id: '1',
      name: 'p1',
      description: '',
      author: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      systemPrompt: '',
      enabledMcps: [],
      llmBridgeName: '',
      llmBridgeConfig: {},
    },
  ];

  it('renders options', () => {
    const component = renderer.create(
      <PresetSelector presets={presets} value="" onChange={() => {}} />
    );
    const options = component.root.findAllByType('option');
    expect(options.length).toBe(2); // includes empty option
  });
});
