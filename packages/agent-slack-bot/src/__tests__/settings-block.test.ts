import { Message, Blocks, Elements, Bits } from 'slack-block-builder';
import { getSettingsBlocks } from '../settings-block';
import { KnownBlock } from '@slack/types';

interface PresetSummary {
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
}

test('getSettingsBlocks returns expected blocks', () => {
  const presets: PresetSummary[] = [
    { id: 'p1', name: 'Preset1', description: '', updatedAt: new Date() },
  ];
  const expected = Message()
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
  expect(getSettingsBlocks(presets)).toEqual(expected);
});
