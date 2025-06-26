import { Message, Blocks, Elements } from 'slack-block-builder';
import { KnownBlock } from '@slack/types';

export function getSettingsBlocks(): KnownBlock[] {
  return Message()
    .blocks(
      Blocks.Section({ text: '*Agent Slack Bot Settings*' }).blockId('settings-header'),
      Blocks.Actions().elements(Elements.Button({ text: 'Close', value: 'close' }))
    )
    .getBlocks() as KnownBlock[];
}
