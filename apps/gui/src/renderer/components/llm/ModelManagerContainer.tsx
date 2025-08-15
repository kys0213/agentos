import React from 'react';
import { ModelManager } from './ModelManager';

export interface ModelManagerContainerProps {
  reloadAgents: () => Promise<void>;
}

/**
 * Container that binds ModelManager to app-level data context (useAppData).
 * Keeps presentation (ModelManager) free of global concerns while allowing
 * future cross-feature reactions (e.g., agent/preset invalidation on bridge switch).
 */
export const ModelManagerContainer: React.FC<ModelManagerContainerProps> = ({ reloadAgents }) => {
  const handleBridgeSwitch = async (_bridgeId: string) => {
    await reloadAgents();
  };
  return <ModelManager onBridgeSwitch={handleBridgeSwitch} />;
};

export default ModelManagerContainer;
