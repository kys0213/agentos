import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
export interface LLMSettingsProps {
  currentBridge?: { id: string } | null;
  bridgeIds: string[];
  isLoading?: boolean;
  onSwitch: (bridgeId: string) => Promise<void> | void;
  switchError?: boolean;
}

/**
 * LLM 브릿지 설정 컴포넌트
 * - 현재 브릿지 표시 및 전환
 * - 브릿지 상태 확인
 * - 테스트 기능 (향후 구현)
 */
const LLMSettings: React.FC<LLMSettingsProps> = ({
  currentBridge,
  bridgeIds,
  isLoading,
  onSwitch,
  switchError,
}) => {
  const handleBridgeChange = async (bridgeId: string) => {
    if (bridgeId === currentBridge?.id) {
      return;
    }
    await onSwitch(bridgeId);
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading bridge information...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 현재 브릿지 정보 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Current Bridge</div>
            <div className="flex items-center gap-2 text-sm">
              <span>{currentBridge?.id || 'None'}</span>
              <Badge>Active</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 브릿지 선택 */}
      <Card className="p-4 space-y-2">
        <Label className="text-sm">Switch Bridge</Label>
        <div className="flex items-center gap-2">
          <Select onValueChange={(val) => handleBridgeChange(val)} value={currentBridge?.id || ''}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a bridge" />
            </SelectTrigger>
            <SelectContent>
              {bridgeIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 브릿지 테스트 (향후 구현) */}
      <Card className="p-4">
        <div className="text-sm text-muted-foreground mb-2">Quick Test (Coming Soon)</div>
        <Button size="sm" variant="outline" disabled>
          Test Current Bridge
        </Button>
      </Card>

      {/* 에러 표시 */}
      {switchError && (
        <div className="text-sm text-red-600">Failed to switch bridge. Please try again.</div>
      )}
    </div>
  );
};

export default LLMSettings;
