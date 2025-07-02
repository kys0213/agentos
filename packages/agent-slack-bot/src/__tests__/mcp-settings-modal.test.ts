import { Modal, Blocks, Elements, Bits } from 'slack-block-builder';
import { getMcpSettingsModal } from '../settings-block';

interface View {
  type: string;
  blocks: any[];
  callback_id?: string;
  title?: any;
  submit?: any;
}

test('getMcpSettingsModal returns expected modal', () => {
  const expected: View = Modal({ title: 'MCP Settings', submit: 'Save' })
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
    .buildToObject() as View;
  expect(getMcpSettingsModal()).toEqual(expected);
});
