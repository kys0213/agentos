import React from 'react';
import { Box, Button, VStack, HStack, Text } from '@chakra-ui/react';
import { useSettingsState, useSettingsActions, useUIActions } from '../../stores/app-store';
import { useMcpConfigs, useConnectMcp } from '../../hooks/queries/use-mcp';
import LLMSettings from '../llm/LLMSettings';
import PresetSettings from '../preset/PresetSettings';
import type { McpConfig } from '@agentos/core';

/**
 * 설정 컨테이너 컴포넌트
 * - 모든 설정 관련 UI와 로직 관리
 * - LLM 브릿지, 프리셋, MCP 설정 포함
 * - ChatApp.tsx에서 설정 관련 로직 분리
 */
const SettingsContainer: React.FC = () => {
  const settingsState = useSettingsState();
  const settingsActions = useSettingsActions();
  const uiActions = useUIActions();

  // React Query 데이터
  const { data: mcpConfigs = [] } = useMcpConfigs();
  const connectMcpMutation = useConnectMcp();

  // MCP 설정 저장 핸들러
  const handleSaveMcp = async (config: McpConfig) => {
    try {
      await connectMcpMutation.mutateAsync(config);
      settingsActions.toggleMcpSettings();
    } catch (error) {
      console.error('Failed to save MCP config:', error);
    }
  };

  return (
    <Box p={4} h="100%" overflow="auto">
      <VStack align="stretch" spacing={6}>
        {/* 설정 헤더 */}
        <HStack justify="space-between" align="center">
          <Text fontSize="2xl" fontWeight="bold">
            Settings
          </Text>
          <Button size="sm" onClick={() => uiActions.setActiveView('chat')}>
            Back to Chat
          </Button>
        </HStack>

        {/* LLM 브릿지 설정 */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            LLM Bridge Configuration
          </Text>
          <LLMSettings />
        </Box>

        {/* 프리셋 설정 */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            Preset Configuration
          </Text>
          <PresetSettings />
        </Box>

        {/* MCP 설정 */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            MCP Configuration
          </Text>

          <VStack align="stretch" spacing={3}>
            <HStack>
              <Button
                onClick={() => settingsActions.toggleMcpSettings()}
                size="sm"
                colorScheme="blue"
              >
                MCP Settings
              </Button>

              <Button onClick={() => settingsActions.toggleMcpList()} size="sm" variant="outline">
                View MCP List
              </Button>
            </HStack>

            {/* MCP 설정 모달/패널 */}
            {settingsState.showMcpSettings && (
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Text>MCP Settings coming soon - use Management section</Text>
              </Box>
            )}

            {/* MCP 목록 */}
            {settingsState.showMcpList && (
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Text>MCP List coming soon - use Management section</Text>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SettingsContainer;
