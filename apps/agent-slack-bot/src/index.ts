import { App, GenericMessageEvent, StaticSelectAction } from '@slack/bolt';
import path from 'path';
import { FileBasedPresetRepository } from '@agentos/core';
import { getSettingsBlocks } from './settings-block';
import { PresetService } from './preset-service';
import { FileBasedChannelPresetStore } from './channel-preset-store';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN || '',
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});

const presetRepo = new FileBasedPresetRepository(path.join(__dirname, '..', 'presets'));
const channelPresetStore = new FileBasedChannelPresetStore(
  path.join(__dirname, '..', 'channel-presets')
);
const presetService = new PresetService(presetRepo, channelPresetStore);
const userPresets = new Map<string, string>();

function isGenericMessageEvent(msg: unknown): msg is GenericMessageEvent {
  return !!msg && typeof (msg as GenericMessageEvent).text === 'string';
}

app.command('/agentos-settings', async ({ ack, body, client }) => {
  await ack();
  const presets = await presetService.list();
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'settings-modal',
      title: { type: 'plain_text', text: 'AgentOS Settings' },
      blocks: getSettingsBlocks(presets),
    },
  });
});

app.action('preset-change', async ({ ack, body, action }) => {
  await ack();
  const select = action as StaticSelectAction;
  if (select.selected_option) {
    userPresets.set(body.user.id, select.selected_option.value);
  }
});

app.message(async ({ message, say }) => {
  const text: string = isGenericMessageEvent(message) ? message.text || '' : '';
  const userId = isGenericMessageEvent(message) ? message.user : undefined;
  const channel = isGenericMessageEvent(message) ? message.channel : undefined;

  let preset = 'none';
  if (channel) {
    preset = (await presetService.getActivePreset(channel)) ?? 'none';
  }
  if (userId && userPresets.has(userId)) {
    preset = userPresets.get(userId) as string;
  }

  // Placeholder: initialize AgentOS components
  // (reserved for future integration)
  // const mcpRegistry = new McpRegistry();
  // const llmBridgeLoader = new DependencyBridgeLoader();
  // const messages: Message[] = [
  //   {
  //     role: 'user',
  //     content: [{ contentType: 'text', value: text }],
  //   },
  // ];
  // TODO: Use agent from core with llmBridgeRegistry to process messages

  await say(`Echo: ${text} (preset: ${preset})`);
});

export async function start(port = 3000) {
  await app.start(port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
}

if (require.main === module) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
