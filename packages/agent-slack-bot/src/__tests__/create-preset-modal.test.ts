import { Modal, Blocks, Elements, Bits } from 'slack-block-builder';
import { getCreatePresetModal } from '../settings-block';

/** Basic shape of ModalBuilder.buildToObject() */
interface View {
  type: string;
  title?: any;
  submit?: any;
  close?: any;
  blocks: any[];
  callback_id?: string;
}

test('getCreatePresetModal returns expected modal', () => {
  const bridges = ['@llm-bridge/mock'];
  const expected: View = Modal({ title: 'New Preset', submit: 'Save' })
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
        ),
      Blocks.Input({ label: 'MCP Type' })
        .blockId('mcpType')
        .element(
          Elements.StaticSelect({ placeholder: 'Select type' })
            .actionId('mcpType')
            .options([
              Bits.Option({ text: 'WebSocket', value: 'websocket' }),
              Bits.Option({ text: 'SSE', value: 'sse' }),
            ])
        ),
      Blocks.Input({ label: 'MCP URL' })
        .blockId('mcpUrl')
        .element(Elements.TextInput().actionId('mcpUrl'))
    )
    .buildToObject() as View;
  expect(getCreatePresetModal(bridges)).toEqual(expected);
});
