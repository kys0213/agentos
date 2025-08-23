import React from 'react';
import { VStack, HStack, Text, Button, Box } from '@chakra-ui/react';
import { usePresets } from '../../hooks/queries/use-presets';
import { useSettingsState, useSettingsActions } from '../../stores/app-store';
import PresetSelector from './PresetSelector';

/**
 * 프리셋 설정 컴포넌트
 * - 현재 선택된 프리셋 표시
 * - 프리셋 변경
 * - 프리셋 관리 (향후 구현)
 */
const PresetSettings: React.FC = () => {
  const settingsState = useSettingsState();
  const settingsActions = useSettingsActions();
  const { data: presets = [], isLoading } = usePresets();

  const handleChangePreset = (presetId: string) => {
    settingsActions.setSelectedPreset(presetId);
  };

  if (isLoading) {
    return <Text>Loading presets...</Text>;
  }

  const currentPreset = presets.find((p) => p.id === settingsState.selectedPresetId);

  return (
    <VStack align="stretch" spacing={4}>
      {/* 현재 프리셋 정보 */}
      <Box p={4} bg="gray.50" borderRadius="md">
        <Text fontWeight="semibold" mb={2}>
          Current Preset
        </Text>
        {currentPreset && (
          <VStack align="start" spacing={1}>
            <Text>
              <strong>Name:</strong> {currentPreset.name}
            </Text>
            <Text>
              <strong>Description:</strong> {currentPreset.description || 'No description'}
            </Text>
          </VStack>
        )}
        {!currentPreset && <Text color="gray.500">No preset selected</Text>}
      </Box>

      {/* 프리셋 선택 */}
      <PresetSelector
        presets={presets}
        value={settingsState.selectedPresetId}
        onChange={handleChangePreset}
      />

      {/* 프리셋 관리 (향후 구현) */}
      <Box p={3} bg="gray.50" borderRadius="md">
        <Text fontSize="sm" color="gray.600" mb={2}>
          Preset Management (Coming Soon)
        </Text>
        <HStack spacing={2}>
          <Button size="sm" isDisabled colorScheme="blue" variant="outline">
            Create New
          </Button>
          <Button size="sm" isDisabled colorScheme="green" variant="outline">
            Edit Current
          </Button>
          <Button size="sm" isDisabled colorScheme="red" variant="outline">
            Delete
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
};

export default PresetSettings;
