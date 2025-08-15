import React from 'react';
import {
  Select,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Button,
  Text,
  Box,
  Badge,
} from '@chakra-ui/react';
export interface LLMSettingsProps {
  currentBridge?: { id: string } | null;
  bridgeIds: string[];
  isLoading?: boolean;
  onSwitch: (bridgeId: string) => Promise<void> | void;
}

/**
 * LLM 브릿지 설정 컴포넌트
 * - 현재 브릿지 표시 및 전환
 * - 브릿지 상태 확인
 * - 테스트 기능 (향후 구현)
 */
const LLMSettings: React.FC<LLMSettingsProps> = ({
  currentBridge,
  bridgeIds,
  isLoading,
  onSwitch,
}) => {
  const handleBridgeChange = async (bridgeId: string) => {
    if (bridgeId === currentBridge?.id) return;
    await onSwitch(bridgeId);
  };

  if (isLoading) {
    return <Text>Loading bridge information...</Text>;
  }

  return (
    <VStack align="stretch" spacing={4}>
      {/* 현재 브릿지 정보 */}
      <Box p={4} bg="gray.50" borderRadius="md">
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontWeight="semibold">Current Bridge</Text>
            <HStack>
              <Text>{currentBridge?.id || 'None'}</Text>
              <Badge colorScheme="green" size="sm">
                Active
              </Badge>
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* 브릿지 선택 */}
      <FormControl>
        <FormLabel>Switch Bridge</FormLabel>
        <HStack>
          <Select
            value={currentBridge?.id || ''}
            onChange={(e) => handleBridgeChange(e.target.value)}
            placeholder="Select a bridge"
          >
            {bridgeIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </Select>
        </HStack>
      </FormControl>

      {/* 브릿지 테스트 (향후 구현) */}
      <Box p={3} bg="gray.50" borderRadius="md">
        <Text fontSize="sm" color="gray.600" mb={2}>
          Quick Test (Coming Soon)
        </Text>
        <Button size="sm" isDisabled colorScheme="blue" variant="outline">
          Test Current Bridge
        </Button>
      </Box>

      {/* 에러 표시 */}
      {switchBridgeMutation.isError && (
        <Text color="red.500" fontSize="sm">
          Failed to switch bridge. Please try again.
        </Text>
      )}
    </VStack>
  );
};

export default LLMSettings;
