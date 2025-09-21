import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Preset } from '@agentos/core';
import type { LlmManifest } from 'llm-bridge-spec';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { ServiceContainer } from '../../../shared/di/service-container';
import { AlertCircle } from 'lucide-react';

export interface BridgeModelSettingsProps {
  config: Preset['llmBridgeConfig'] | undefined;
  onChange: (updates: Partial<Preset>) => void;
  showModel?: boolean;
  showParameters?: boolean;
}

interface BridgeInfo {
  id: string;
  manifest: LlmManifest;
}

export const BridgeModelSettings: React.FC<BridgeModelSettingsProps> = ({
  config,
  onChange,
  showModel = true,
  showParameters = true,
}) => {
  const cfg = config ?? {};
  const bridgeId = cfg.bridgeId as string | undefined;
  const currentModel = cfg.model as string | undefined;

  // 설치된 Bridge 목록 조회
  const {
    data: bridges = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bridges', 'list'],
    queryFn: async (): Promise<BridgeInfo[]> => {
      const bridgeService = ServiceContainer.getOrThrow('bridge');
      const bridgeIds = await bridgeService.getBridgeIds();

      const bridgesWithConfig = await Promise.all(
        bridgeIds.map(async (id) => {
          const manifest = await bridgeService.getBridgeConfig(id);
          return manifest ? { id, manifest } : null;
        })
      );

      return bridgesWithConfig.filter((b): b is BridgeInfo => b !== null);
    },
    staleTime: 60_000, // 1분간 캐시
  });

  // 선택된 Bridge 정보
  const selectedBridge = useMemo(() => {
    if (!bridgeId) {
      return null;
    }
    return bridges.find((b) => b.id === bridgeId);
  }, [bridgeId, bridges]);

  useEffect(() => {
    if (bridges.length === 0) {
      if (bridgeId) {
        onChange({
          llmBridgeConfig: {
            ...cfg,
            bridgeId: undefined,
            model: undefined,
          },
        });
      }
      return;
    }
    const hasSelected = bridgeId && bridges.some((b) => b.id === bridgeId);
    if (!hasSelected) {
      const [firstBridge] = bridges;
      if (!firstBridge) {
        return;
      }
      const nextModel = firstBridge.manifest.models?.[0]?.name;
      onChange({
        llmBridgeConfig: {
          ...cfg,
          bridgeId: firstBridge.id,
          model: nextModel ?? currentModel,
        },
      });
    }
  }, [bridges, bridgeId, currentModel, cfg, onChange]);

  // 사용 가능한 모델 목록
  const availableModels = useMemo(() => {
    if (!selectedBridge) {
      return [];
    }
    return selectedBridge.manifest.models || [];
  }, [selectedBridge]);

  // 지원되는 파라미터 확인 (현재는 모든 파라미터 표시)
  const supportedParams = useMemo(() => {
    // TODO: Bridge manifest에서 지원 파라미터 정보가 추가되면 구현
    return { temperature: true, maxTokens: true, topP: true };
  }, [selectedBridge]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        {showParameters && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load LLM bridges: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (bridges.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No LLM bridges are installed. Please install a bridge to configure AI models.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bridge 선택 */}
      <div className="space-y-2">
        <Label>LLM Bridge</Label>
        <Select
          value={cfg.bridgeId as string}
          onValueChange={(value) =>
            onChange({
              llmBridgeConfig: {
                ...cfg,
                bridgeId: value,
                // Bridge 변경 시 모델 초기화
                model: undefined,
              },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an LLM bridge" />
          </SelectTrigger>
          <SelectContent>
            {bridges.map((bridge) => (
              <SelectItem key={bridge.id} value={bridge.id}>
                {bridge.manifest.name} ({bridge.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBridge && selectedBridge.manifest.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {selectedBridge.manifest.description}
          </p>
        )}
      </div>

      {/* Model 선택 */}
      {showModel && selectedBridge && (
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={cfg.model as string}
            onValueChange={(value) => onChange({ llmBridgeConfig: { ...cfg, model: value } })}
            disabled={availableModels.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableModels.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              No models available for the selected bridge
            </p>
          )}
        </div>
      )}

      {/* Parameters */}
      {showParameters && selectedBridge && (
        <div className="space-y-6">
          {supportedParams.temperature && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">
                  {(cfg.temperature as number) ?? 0.7}
                </span>
              </div>
              <Slider
                value={[(cfg.temperature as number) ?? 0.7]}
                onValueChange={([value]) =>
                  onChange({ llmBridgeConfig: { ...cfg, temperature: value } })
                }
                max={2}
                min={0}
                step={0.1}
              />
            </div>
          )}

          {supportedParams.maxTokens && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Tokens</Label>
                <span className="text-sm text-muted-foreground">
                  {(cfg.maxTokens as number) ?? 1024}
                </span>
              </div>
              <Slider
                value={[(cfg.maxTokens as number) ?? 1024]}
                onValueChange={([value]) =>
                  onChange({ llmBridgeConfig: { ...cfg, maxTokens: value } })
                }
                max={4096}
                min={256}
                step={256}
              />
            </div>
          )}

          {supportedParams.topP && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Top P</Label>
                <span className="text-sm text-muted-foreground">{(cfg.topP as number) ?? 0.9}</span>
              </div>
              <Slider
                value={[(cfg.topP as number) ?? 0.9]}
                onValueChange={([value]) => onChange({ llmBridgeConfig: { ...cfg, topP: value } })}
                max={1}
                min={0}
                step={0.1}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BridgeModelSettings;
