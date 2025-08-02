import React, { useEffect, useState } from 'react';
import { Box, Button, HStack, Input, Select, Text, VStack } from '@chakra-ui/react';
import { Services } from '../bootstrap';
import type { LlmBridgeConfig } from '../types/core-types';

export interface LlmBridgeManagerProps {
  onChange?(): void;
}

const LlmBridgeManager: React.FC<LlmBridgeManagerProps> = ({ onChange }) => {
  const [bridgeIds, setBridgeIds] = useState<string[]>([]);
  const [currentBridge, setCurrentBridge] = useState<{
    id: string;
    config: LlmBridgeConfig;
  } | null>(null);
  const [id, setId] = useState('');
  const [type, setType] = useState<'openai' | 'anthropic' | 'local' | 'custom'>('custom');

  const bridgeService = Services.getBridge();

  useEffect(() => {
    const loadBridges = async () => {
      try {
        const [ids, current] = await Promise.all([
          bridgeService.getBridgeIds(),
          bridgeService.getCurrentBridge(),
        ]);
        setBridgeIds(ids);
        setCurrentBridge(current);
      } catch (error) {
        console.error('Failed to load bridges:', error);
      }
    };

    void loadBridges();
  }, [bridgeService]);

  const handleAdd = async () => {
    if (!id) return;

    try {
      const config: LlmBridgeConfig = {
        name: id,
        type,
        apiUrl: type === 'local' ? 'http://localhost:8080' : undefined,
        apiKey: type !== 'local' ? 'your-api-key' : undefined,
      };

      await bridgeService.register(id, config);

      // Refresh bridge list
      const [ids, current] = await Promise.all([
        bridgeService.getBridgeIds(),
        bridgeService.getCurrentBridge(),
      ]);
      setBridgeIds(ids);
      setCurrentBridge(current);
      setId('');

      onChange && onChange();
    } catch (error) {
      console.error('Failed to add bridge:', error);
    }
  };

  const handleDelete = async (bridgeId: string) => {
    try {
      // Note: unregisterBridge method needs to be implemented in BridgeService
      // await bridgeService.unregisterBridge(bridgeId);

      // For now, just refresh the list
      const [ids, current] = await Promise.all([
        bridgeService.getBridgeIds(),
        bridgeService.getCurrentBridge(),
      ]);
      setBridgeIds(ids);
      setCurrentBridge(current);

      onChange && onChange();
    } catch (error) {
      console.error('Failed to delete bridge:', error);
    }
  };

  return (
    <Box p={2}>
      <Text fontWeight="bold" mb={2}>
        LLM Bridges
      </Text>
      <VStack align="start" spacing={2} as="ul" listStyleType="disc" pl={4}>
        {Array.isArray(bridgeIds)
          ? bridgeIds.map((bridgeId) => (
              <HStack as="li" key={bridgeId} spacing={2}>
                <Text>
                  {bridgeId} {currentBridge?.id === bridgeId ? '(current)' : ''}
                </Text>
                <Button size="xs" onClick={() => handleDelete(bridgeId)}>
                  Delete
                </Button>
              </HStack>
            ))
          : []}
      </VStack>
      <HStack mt={2} spacing={2}>
        <Input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Bridge id"
          size="sm"
        />
        <Select
          value={type}
          onChange={(e) => setType(e.target.value as 'openai' | 'anthropic' | 'local' | 'custom')}
          size="sm"
          w="auto"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="local">Local</option>
          <option value="custom">Custom</option>
        </Select>
        <Button size="sm" onClick={handleAdd} colorScheme="brand">
          Add
        </Button>
      </HStack>
    </Box>
  );
};

export default LlmBridgeManager;
