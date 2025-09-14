import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ModelManager, ModelManagerItem } from './ModelManager';
import {
  BRIDGE_QK,
  useCurrentBridge,
  useInstalledBridges,
  useSwitchBridge,
  useRegisterBridge,
} from '../../hooks/queries/use-bridge';
import { toCapabilityLabels } from '../../hooks/queries/normalize';

export interface ModelManagerContainerProps {
  reloadAgents: () => Promise<void>;
}

/**
 * Container that binds ModelManager to app-level data context (useAppData).
 * Keeps presentation (ModelManager) free of global concerns while allowing
 * future cross-feature reactions (e.g., agent/preset invalidation on bridge switch).
 */
export const ModelManagerContainer: React.FC<ModelManagerContainerProps> = ({ reloadAgents }) => {
  const queryClient = useQueryClient();
  const { data: installed = [], isLoading } = useInstalledBridges();
  const { data: current } = useCurrentBridge();
  const switchBridge = useSwitchBridge();
  const registerBridge = useRegisterBridge();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeIds });
    queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeList });
    queryClient.invalidateQueries({ queryKey: BRIDGE_QK.currentBridge });
  };

  const handleBridgeSwitch = async (_bridgeId: string) => {
    await reloadAgents();
  };
  const items: ModelManagerItem[] = useMemo(
    () =>
      installed.map(({ id, manifest }) => ({
        id,
        name: manifest.name,
        provider: manifest.language ?? id,
        isActive: current?.id === id,
        capabilities: toCapabilityLabels(manifest),
      })),
    [installed, current?.id]
  );

  const onSwitch = async (bridgeId: string) => {
    await switchBridge.mutateAsync(bridgeId);
    await handleBridgeSwitch(bridgeId);
    handleRefresh();
  };

  const onRegister = async (manifest: import('llm-bridge-spec').LlmManifest) => {
    await registerBridge.mutateAsync(manifest);
    handleRefresh();
  };

  return (
    <ModelManager
      items={items}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onSwitch={onSwitch}
      onRegister={onRegister}
    />
  );
};

export default ModelManagerContainer;
