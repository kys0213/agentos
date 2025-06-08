import { App, GenericMessageEvent } from '@slack/bolt';
import { McpRegistry } from '@agentos/core';
import { InMemoryLlmBridgeRegistry } from '@agentos/llm-bridge-runner';
import { Message } from 'llm-bridge-spec';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN || '',
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});

function isGenericMessageEvent(msg: unknown): msg is GenericMessageEvent {
  return !!msg && typeof (msg as GenericMessageEvent).text === 'string';
}

app.message(async ({ message, say }) => {
  const text = isGenericMessageEvent(message) ? message.text : '';

  // Placeholder: initialize AgentOS components
  const mcpRegistry = new McpRegistry();
  const llmBridgeRegistry = new InMemoryLlmBridgeRegistry();
  const messages: Message[] = [{ role: 'user', content: [{ contentType: 'text', value: text }] }];
  // TODO: Use agent from core with llmBridgeRegistry to process messages

  await say(`Echo: ${text}`);
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
