import React from 'react';
import { useAppData } from '../../hooks/useAppData';
import { ModelManager } from './ModelManager';

/**
 * Container that binds ModelManager to app-level data context (useAppData).
 * Keeps presentation (ModelManager) free of global concerns while allowing
 * future cross-feature reactions (e.g., agent/preset invalidation on bridge switch).
 */
export const ModelManagerContainer: React.FC = () => {
  const appData = useAppData();
  // Currently, ModelManager manages its own React Query hooks for bridges.
  // We keep this container to align with preset containers and to enable
  // future interactions with appData (e.g., reload agents after switch).
  void appData; // placeholder usage to acknowledge the binding
  return <ModelManager />;
};

export default ModelManagerContainer;

