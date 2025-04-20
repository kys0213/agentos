import { Agent } from '@agentos/core';
import { LLMClient } from '@agentos/llm-bridge';
import { LLMConfig } from '@agentos/shared';

async function main() {
  // Example LLM configuration
  const llmConfig: LLMConfig = {
    provider: 'openai',
    model: 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY || '',
  };

  // Initialize LLM client
  const llmClient = new LLMClient(llmConfig);

  // Initialize agent
  const agent = new Agent({
    name: 'playground-agent',
    version: '1.0.0',
    description: 'A test agent for the playground',
  });

  try {
    await agent.initialize();
    const result = await agent.execute('Hello, world!');
    console.log('Agent response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
