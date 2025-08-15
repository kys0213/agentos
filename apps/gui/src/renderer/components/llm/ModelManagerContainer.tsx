import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ModelManager } from './ModelManager';
import { BRIDGE_QK } from '../../hooks/queries/use-bridge';

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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeIds });
    queryClient.invalidateQueries({ queryKey: BRIDGE_QK.bridgeList });
    queryClient.invalidateQueries({ queryKey: BRIDGE_QK.currentBridge });
  };

  const handleBridgeSwitch = async (_bridgeId: string) => {
    await reloadAgents();
  };
  return <ModelManager onBridgeSwitch={handleBridgeSwitch} onRefresh={handleRefresh} />;
};

export default ModelManagerContainer;
