import React from 'react';
import { useSettingsState, useSettingsActions, useUIActions } from '../../stores/app-store';
import LLMSettingsContainer from '../llm/LLMSettingsContainer';
import PresetSettings from '../preset/PresetSettings';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const SettingsContainer: React.FC = () => {
  const settingsState = useSettingsState();
  const settingsActions = useSettingsActions();
  const uiActions = useUIActions();

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage model bridges, presets, and upcoming MCP integrations from a single place.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => uiActions.setActiveView('chat')}>
            Back to Chat
          </Button>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">LLM Bridge Configuration</h2>
          <LLMSettingsContainer />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Preset Configuration</h2>
          <PresetSettings />
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">MCP Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Detailed MCP setup lives in the Management &gt; Tools view. Use the quick toggles
                below to preview forthcoming actions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => settingsActions.toggleMcpSettings()}>
                MCP Settings
              </Button>
              <Button size="sm" variant="outline" onClick={() => settingsActions.toggleMcpList()}>
                View MCP List
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {settingsState.showMcpSettings && (
              <Card className="border-dashed">
                <div className="p-4 text-sm text-muted-foreground">
                  MCP settings management will live in the redesigned Tool Manager. Use that surface
                  for live configuration once the migration completes.
                </div>
              </Card>
            )}

            {settingsState.showMcpList && (
              <Card className="border-dashed">
                <div className="p-4 text-sm text-muted-foreground">
                  MCP registrations, permissions, and status are available in the Tool Manager view.
                  This panel will link there after the redesign.
                </div>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsContainer;
