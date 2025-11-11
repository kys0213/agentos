import React, { useEffect, useRef } from 'react';
import LLMSettings from './LLMSettings';
import { useBridgeIds, useCurrentBridge, useSwitchBridge } from '../../hooks/queries/use-bridge';
import { useToast } from '../ui/use-toast';

const LLMSettingsContainer: React.FC = () => {
  const { data: currentBridge, isLoading: isLoadingCurrent } = useCurrentBridge();
  const { data: bridgeIds = [], isLoading: isLoadingIds } = useBridgeIds();
  const switchBridge = useSwitchBridge();
  const { toast } = useToast();
  const emptyToastShownRef = useRef(false);
  const isReady = !isLoadingCurrent && !isLoadingIds;

  const onSwitch = async (bridgeId: string) => {
    if (!bridgeId) {
      toast({
        variant: 'destructive',
        title: 'Select an LLM bridge',
        description: 'Choose a bridge before switching.',
      });
      return;
    }
    if (bridgeId === currentBridge?.id) {
      return;
    }
    try {
      await switchBridge.mutateAsync(bridgeId);
      toast({
        title: 'Bridge switched',
        description: `${bridgeId} is now active.`,
      });
    } catch (e) {
      const description = e instanceof Error ? e.message : 'Failed to switch bridge.';
      toast({
        variant: 'destructive',
        title: 'Failed to switch bridge',
        description,
      });
      console.error(e);
    }
  };

  useEffect(() => {
    if (isReady && bridgeIds.length === 0 && !emptyToastShownRef.current) {
      toast({
        variant: 'destructive',
        title: 'No LLM bridges found',
        description: 'Register a bridge before configuring LLM settings.',
      });
      emptyToastShownRef.current = true;
    }

    if (bridgeIds.length > 0) {
      emptyToastShownRef.current = false;
    }
  }, [bridgeIds, isReady, toast]);

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
