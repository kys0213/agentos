import { Message, Blocks, Elements } from 'slack-block-builder';
import { getSettingsBlocks } from '../settings-block';
import { KnownBlock } from '@slack/types';

test('getSettingsBlocks returns expected blocks', () => {
  const expected = Message()
    .blocks(
      Blocks.Section({ text: '*Agent Slack Bot Settings*' }).blockId('settings-header'),
      Blocks.Actions().elements(Elements.Button({ text: 'Close', value: 'close' }))
    )
    .getBlocks() as KnownBlock[];
  expect(getSettingsBlocks()).toEqual(expected);
});
