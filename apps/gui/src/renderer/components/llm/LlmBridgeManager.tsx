import { Box, Button, HStack, Input, Select, Text, VStack } from '@chakra-ui/react';
import type { LlmManifest } from 'llm-bridge-spec';
import React, { useEffect, useState } from 'react';

import { useBridgeIds, useCurrentBridge, useRegisterBridge, useUnregisterBridge } from '../../hooks/queries/use-bridge';

export interface LlmBridgeManagerProps {
  onChange?(): void;
}

const LlmBridgeManager: React.FC<LlmBridgeManagerProps> = ({ onChange }) => {
  const { data: bridgeIds = [] } = useBridgeIds();
  const { data: currentBridge } = useCurrentBridge();
  const [id, setId] = useState('');
  const [type, setType] = useState<'openai' | 'anthropic' | 'local' | 'custom'>('custom');
  const registerBridge = useRegisterBridge();
  const unregisterBridge = useUnregisterBridge();

  useEffect(() => {}, []);

  const handleAdd = async () => {
    if (!id) return;

    try {
      const config: LlmManifest = {
        schemaVersion: '1.0.0',
        name: id,
        language: 'typescript',
        entry: 'index.ts',
        configSchema: {
          type: 'object',
          properties: {},
        },
        capabilities: {
          modalities: [],
          supportsToolCall: true,
          supportsFunctionCall: true,
          supportsMultiTurn: true,
          supportsStreaming: true,
          supportsVision: true,
        },
        description: '',
      };

      await registerBridge.mutateAsync(config);
      setId('');

      onChange && onChange();
    } catch (error) {
      console.error('Failed to add bridge:', error);
    }
  };

  const handleDelete = async (bridgeId: string) => {
    try {
      await unregisterBridge.mutateAsync(bridgeId);

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
