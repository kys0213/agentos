import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, Input, Select, Text, VStack } from '@chakra-ui/react';
import { BridgeManager } from '../utils/BridgeManager';
import EchoBridge from '../bridges/EchoBridge';
import ReverseBridge from '../bridges/ReverseBridge';
import { LlmBridgeStore, LlmBridgeConfig } from '../stores/llm-bridge-store';

export interface LlmBridgeManagerProps {
  store: LlmBridgeStore;
  manager: BridgeManager;
  onChange?(): void;
}

const LlmBridgeManager: React.FC<LlmBridgeManagerProps> = ({ store, manager, onChange }) => {
  const [bridges, setBridges] = useState<LlmBridgeConfig[]>([]);
  const [id, setId] = useState('');
  const [type, setType] = useState<'echo' | 'reverse'>('echo');

  useEffect(() => {
    setBridges(store.list());
  }, [store]);

  const handleAdd = () => {
    if (!id) return;
    const config: LlmBridgeConfig = { id, type };
    store.save(config);
    const BridgeCtor = type === 'echo' ? EchoBridge : ReverseBridge;
    manager.register(id, new BridgeCtor());
    setBridges(store.list());
    setId('');
    onChange && onChange();
  };

  const handleDelete = (bridgeId: string) => {
    store.delete(bridgeId);
    setBridges(store.list());
    onChange && onChange();
  };

  return (
    <Box p={2}>
      <Text fontWeight="bold" mb={2}>
        LLM Bridges
      </Text>
      <VStack align="start" spacing={2} as="ul" listStyleType="disc" pl={4}>
        {bridges.map((b) => (
          <HStack as="li" key={b.id} spacing={2}>
            <Text>
              {b.id} ({b.type})
            </Text>
            <Button size="xs" onClick={() => handleDelete(b.id)}>
              Delete
            </Button>
          </HStack>
        ))}
      </VStack>
      <HStack mt={2} spacing={2}>
        <Input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Bridge id"
          size="sm"
        />
        <Select value={type} onChange={(e) => setType(e.target.value as any)} size="sm" w="auto">
          <option value="echo">echo</option>
          <option value="reverse">reverse</option>
        </Select>
        <Button size="sm" onClick={handleAdd} colorScheme="brand">
          Add
        </Button>
      </HStack>
    </Box>
  );
};

export default LlmBridgeManager;
