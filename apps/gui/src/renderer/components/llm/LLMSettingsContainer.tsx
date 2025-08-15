import React from 'react';
import LLMSettings from './LLMSettings';
import { useBridgeIds, useCurrentBridge, useSwitchBridge } from '../../hooks/queries/use-bridge';

const LLMSettingsContainer: React.FC = () => {
  const { data: currentBridge, isLoading: isLoadingCurrent } = useCurrentBridge();
  const { data: bridgeIds = [], isLoading: isLoadingIds } = useBridgeIds();
  const switchBridge = useSwitchBridge();

  const onSwitch = async (bridgeId: string) => {
    try {
      await switchBridge.mutateAsync(bridgeId);
    } catch (e) {
      // error surfaced in hooks via onError toasts/logs if configured
      // keep container thin
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  return (
    <LLMSettings
      currentBridge={currentBridge || null}
      bridgeIds={bridgeIds}
      isLoading={isLoadingCurrent || isLoadingIds}
      onSwitch={onSwitch}
      switchError={Boolean(switchBridge.isError)}
    />
  );
};

export default LLMSettingsContainer;
