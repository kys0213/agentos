import React, { useState } from 'react';
import type { LlmManifest } from 'llm-bridge-spec';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface LlmBridgeManagerProps {
  bridgeIds: string[];
  currentBridge?: { id: string } | null;
  onRegister: (manifest: LlmManifest) => Promise<void> | void;
  onUnregister: (id: string) => Promise<void> | void;
}

const LlmBridgeManager: React.FC<LlmBridgeManagerProps> = ({
  bridgeIds,
  currentBridge,
  onRegister,
  onUnregister,
}) => {
  const [id, setId] = useState('');
  const [type, setType] = useState<'openai' | 'anthropic' | 'local' | 'custom'>('custom');

  const handleAdd = async () => {
    if (!id) return;

    try {
      const config: LlmManifest = {
        schemaVersion: '1.0.0',
        name: id,
        language: 'typescript',
        entry: 'index.ts',
        configSchema: {
          type: 'object',
          properties: {},
        },
        capabilities: {
          modalities: [],
          supportsToolCall: true,
          supportsFunctionCall: true,
          supportsMultiTurn: true,
          supportsStreaming: true,
          supportsVision: true,
        },
        description: '',
      };
      await onRegister(config);
      setId('');
    } catch (error) {
      console.error('Failed to add bridge:', error);
    }
  };

  const handleDelete = async (bridgeId: string) => {
    try {
      await onUnregister(bridgeId);
    } catch (error) {
      console.error('Failed to delete bridge:', error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-base font-semibold">LLM Bridges</div>
      <Card className="p-4 space-y-2">
        <div className="space-y-1">
          {Array.isArray(bridgeIds) && bridgeIds.length > 0 ? (
            <ul className="list-disc pl-5 text-sm">
              {bridgeIds.map((bridgeId) => (
                <li key={bridgeId} className="flex items-center gap-2">
                  <span>
                    {bridgeId} {currentBridge?.id === bridgeId ? '(current)' : ''}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(bridgeId)}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No bridges installed</div>
          )}
        </div>
      </Card>

      <Card className="p-4 flex items-end gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="bridge-id" className="text-sm">
            Bridge id
          </Label>
          <Input
            id="bridge-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Bridge id"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} className="ml-auto">
          Add
        </Button>
      </Card>
    </div>
  );
};

export default LlmBridgeManager;
