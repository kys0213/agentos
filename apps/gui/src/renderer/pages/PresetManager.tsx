import React, { useEffect, useState } from 'react';
import { Box, Button, Input, List, ListItem, Text, VStack } from '@chakra-ui/react';
import type { Preset } from '../types/core-types';
import { PresetStore, loadPresets, savePreset, deletePreset } from '../stores/preset-store';

const store = new PresetStore();

const emptyPreset = (): Preset => ({
  id: Date.now().toString(),
  name: '',
  description: '',
  author: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  version: '1.0.0',
  systemPrompt: '',
  enabledMcps: [],
  llmBridgeName: '',
  llmBridgeConfig: {},
});

const PresetManager: React.FC = () => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [current, setCurrent] = useState<Preset>(emptyPreset());

  useEffect(() => {
    loadPresets(store).then(setPresets);
  }, []);

  const handleSave = async () => {
    await savePreset(store, { ...current, updatedAt: new Date() });
    setCurrent(emptyPreset());
    setPresets(await loadPresets(store));
  };

  const handleDelete = async (id: string) => {
    await deletePreset(store, id);
    setPresets(await loadPresets(store));
  };

  return (
    <Box p={2}>
      <Text fontWeight="bold" mb={2}>
        Presets
      </Text>
      <List spacing={1} styleType="disc" pl={4}>
        {presets.map((p) => (
          <ListItem key={p.id}>
            {p.name}{' '}
            <Button size="xs" onClick={() => handleDelete(p.id)}>
              Delete
            </Button>
          </ListItem>
        ))}
      </List>
      <VStack mt={2} spacing={2} align="start">
        <Input
          value={current.name}
          onChange={(e) => setCurrent({ ...current, name: e.target.value })}
          placeholder="Preset name"
          size="sm"
        />
        <Button size="sm" onClick={handleSave} colorScheme="brand">
          Add
        </Button>
      </VStack>
    </Box>
  );
};

export default PresetManager;
