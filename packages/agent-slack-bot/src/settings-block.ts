import { Message, Blocks, Elements, Bits, Modal } from 'slack-block-builder';
import { KnownBlock } from '@slack/types';

export interface PresetSummary {
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
}

export function getSettingsBlocks(presets: PresetSummary[]): KnownBlock[] {
  return Message()
    .blocks(
      Blocks.Section({ text: '*Agent Slack Bot Settings*' }).blockId('settings-header'),
      Blocks.Actions().elements(
        Elements.StaticSelect({ placeholder: 'Select Preset' })
          .actionId('preset-change')
          .options(presets.map((p) => Bits.Option({ text: p.name, value: p.id }))),
        Elements.Button({ text: 'Create Preset', value: 'open' }).actionId('preset-create'),
        Elements.Button({ text: 'Edit MCP', value: 'open' }).actionId('mcp-settings'),
        Elements.Button({ text: 'Close', value: 'close' })
      )
    )
    .getBlocks() as KnownBlock[];
}

export function getCreatePresetModal(bridges: string[]) {
  return Modal({ title: 'New Preset', submit: 'Save' })
    .callbackId('preset-create-modal')
    .blocks(
      Blocks.Input({ label: 'Name' })
        .blockId('name')
        .element(Elements.TextInput().actionId('name')),
      Blocks.Input({ label: 'System Prompt' })
        .blockId('prompt')
        .element(Elements.TextInput({ multiline: true }).actionId('prompt')),
      Blocks.Input({ label: 'LLM Bridge' })
        .blockId('bridge')
        .element(
          Elements.StaticSelect({ placeholder: 'Select Bridge' })
            .actionId('bridge')
            .options(bridges.map((b) => Bits.Option({ text: b, value: b })))
        )
    )
    .buildToObject();
}

export function getMcpSettingsModal() {
  return Modal({ title: 'MCP Settings', submit: 'Save' })
    .callbackId('mcp-settings-modal')
    .blocks(
      Blocks.Input({ label: 'Type' })
        .blockId('type')
        .element(
          Elements.StaticSelect({ placeholder: 'Select type' })
            .actionId('type')
            .options([
              Bits.Option({ text: 'WebSocket', value: 'websocket' }),
              Bits.Option({ text: 'SSE', value: 'sse' }),
            ])
        ),
      Blocks.Input({ label: 'URL' }).blockId('url').element(Elements.TextInput().actionId('url'))
    )
    .buildToObject();
}
