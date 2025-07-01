import { Message, Blocks, Elements, Bits } from 'slack-block-builder';
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
        Elements.Button({ text: 'Close', value: 'close' })
      )
    )
    .getBlocks() as KnownBlock[];
}
