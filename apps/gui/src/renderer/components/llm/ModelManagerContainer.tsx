import React from 'react';
import { useAppData } from '../../hooks/useAppData';
import { ModelManager } from './ModelManager';

/**
 * Container that binds ModelManager to app-level data context (useAppData).
 * Keeps presentation (ModelManager) free of global concerns while allowing
 * future cross-feature reactions (e.g., agent/preset invalidation on bridge switch).
 */
export const ModelManagerContainer: React.FC = () => {
  const { reloadAgents } = useAppData();

  // Bridge change may influence agents/presets behavior; perform minimal sync.
  const handleBridgeSwitch = async (_bridgeId: string) => {
    // Reload agents so dependent views reflect the new bridge if necessary
    await reloadAgents();
  };

  return <ModelManager onBridgeSwitch={handleBridgeSwitch} />;
};

export default ModelManagerContainer;
