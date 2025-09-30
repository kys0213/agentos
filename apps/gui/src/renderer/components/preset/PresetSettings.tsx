import React from 'react';
import { usePresets } from '../../hooks/queries/use-presets';
import { useSettingsState, useSettingsActions } from '../../stores/app-store';
import PresetSelector from './PresetSelector';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

const PresetSettings: React.FC = () => {
  const settingsState = useSettingsState();
  const settingsActions = useSettingsActions();
  const { data: presets = [], isLoading } = usePresets();

  const handleChangePreset = (presetId: string) => {
    settingsActions.setSelectedPreset(presetId);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading presets…</p>;
  }

  const currentPreset = presets.find((p) => p.id === settingsState.selectedPresetId);
  let presetContent: React.ReactNode;
  if (currentPreset) {
    presetContent = (
      <dl className="space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium text-muted-foreground">Name:</dt>
          <dd className="text-foreground">{currentPreset.name}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-muted-foreground">Description:</dt>
          <dd className="text-foreground">{currentPreset.description ?? 'No description'}</dd>
        </div>
      </dl>
    );
  } else {
    presetContent = <p className="text-sm text-muted-foreground">No preset selected</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">Current Preset</h3>
          {presetContent}
        </div>
      </Card>

      <PresetSelector
        presets={presets}
        value={settingsState.selectedPresetId}
        onChange={handleChangePreset}
      />

      <Card className="border-dashed p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Preset management (coming soon)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled>
              Create New
            </Button>
            <Button size="sm" variant="outline" disabled>
              Edit Current
            </Button>
            <Button size="sm" variant="outline" disabled>
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PresetSettings;
