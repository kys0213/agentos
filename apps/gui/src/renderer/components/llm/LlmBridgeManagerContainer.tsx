import React from 'react';
import LlmBridgeManager from './LlmBridgeManager';
import {
  useBridgeIds,
  useCurrentBridge,
  useRegisterBridge,
  useUnregisterBridge,
} from '../../hooks/queries/use-bridge';
import type { LlmManifest } from 'llm-bridge-spec';

const LlmBridgeManagerContainer: React.FC = () => {
  const { data: bridgeIds = [] } = useBridgeIds();
  const { data: currentBridge } = useCurrentBridge();
  const registerBridge = useRegisterBridge();
  const unregisterBridge = useUnregisterBridge();

  const onRegister = async (manifest: LlmManifest) => {
    await registerBridge.mutateAsync(manifest);
  };

  const onUnregister = async (id: string) => {
    await unregisterBridge.mutateAsync(id);
  };

  return (
    <LlmBridgeManager
      bridgeIds={bridgeIds}
      currentBridge={currentBridge || null}
      onRegister={onRegister}
      onUnregister={onUnregister}
    />
  );
};

export default LlmBridgeManagerContainer;
