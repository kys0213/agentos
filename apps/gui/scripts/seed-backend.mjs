import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const argv = process.argv.slice(2);
let profileDir = null;
let mode = 'full';
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--profile' && argv[i + 1]) {
    profileDir = argv[++i];
  } else if (arg === '--mode' && argv[i + 1]) {
    mode = argv[++i];
  }
}

if (!profileDir) {
  console.error('[seed-backend] --profile <path> is required');
  process.exit(1);
}

(async () => {
  if (mode === 'mock') {
    console.log('[seed-backend] mock mode requested; skipping backend seed');
    return;
  }

  await seedLlmBridge(profileDir);
  await seedMcpTools(profileDir);
  const preset = await seedPresetDir(profileDir);
  await seedDefaultAgent(profileDir, preset);
  console.log('[seed-backend] seeding completed');
})();

async function seedLlmBridge(profileDir) {
  const { FileBasedLlmBridgeRegistry } = require('@agentos/core/llm');
  const { DependencyBridgeLoader } = require('llm-bridge-loader');

  const registry = new FileBasedLlmBridgeRegistry(profileDir, new DependencyBridgeLoader());

  let loaded;
  try {
    loaded = await registry.loadBridge('e2e-llm-bridge');
  } catch (error) {
    console.error('[seed-backend] Failed to load e2e bridge from dependencies', error);
    throw error;
  }

  const manifest = loaded?.manifest;
  if (!manifest) {
    console.error('[seed-backend] Loaded bridge did not expose a manifest');
    return;
  }

  const id = manifest.name ?? 'e2e-llm-bridge';

  const summaries = await registry.listSummaries();
  const exists = summaries.some((item) => item.id === id);

  if (!exists) {
    await registry.register(manifest, {}, { id });
  }

  const active = await registry.getActiveId();
  if (active !== id) {
    await registry.setActiveId(id);
  }
}

async function seedMcpTools(profileDir) {
  const toolsPath = path.join(profileDir, 'mcp-tools.json');
  const defaultTools = [
    {
      id: 'mcp_e2e_search_tool',
      name: 'E2E Search Tool',
      description: 'Mock MCP search tool for automated tests',
      version: '1.0.0',
      category: 'search',
      provider: 'E2E Suite',
      endpoint: 'mock://e2e-search',
      permissions: [],
      status: 'connected',
      usageCount: 0,
      config: {
        type: 'sse',
        name: 'e2e-search',
        version: '1.0.0',
      },
    },
  ];
  await fs.writeFile(toolsPath, JSON.stringify(defaultTools, null, 2), 'utf-8');
  const usagePath = path.join(profileDir, 'mcp-usage.json');
  await fs.writeFile(usagePath, JSON.stringify([], null, 2), 'utf-8');
}

async function seedPresetDir(profileDir) {
  const presetsDir = path.join(profileDir, 'presets');
  await fs.mkdir(presetsDir, { recursive: true });

  const presetPath = path.join(presetsDir, 'preset-e2e-default.json');
  try {
    const existing = await fs.readFile(presetPath, 'utf-8');
    return JSON.parse(existing);
  } catch {
    const now = new Date().toISOString();
    const preset = {
      id: 'preset-e2e-default',
      name: 'E2E Default Agent',
      description: 'Preset seeded for Electron E2E scenarios.',
      author: 'e2e-suite',
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      systemPrompt: 'You are a helpful researcher for automated QA.',
      enabledMcps: [
        {
          name: 'mcp_e2e_search_tool',
          enabledTools: [],
          enabledResources: [],
          enabledPrompts: [],
        },
      ],
      llmBridgeName: 'e2e-llm-bridge',
      llmBridgeConfig: {
        bridgeId: 'e2e-llm-bridge',
        model: 'e2e-mini',
        temperature: 0.7,
        maxTokens: 1024,
        topP: 0.9,
      },
      status: 'active',
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: {
        indexed: 0,
        vectorized: 0,
        totalSize: 0,
      },
      category: ['development'],
    };

    await fs.writeFile(presetPath, JSON.stringify(preset, null, 2), 'utf-8');
    return preset;
  }
}

async function seedDefaultAgent(profileDir, preset) {
  const agentsDir = path.join(profileDir, 'agents');
  await fs.mkdir(agentsDir, { recursive: true });

  const existingFiles = await fs.readdir(agentsDir);
  if (existingFiles.some((file) => file.endsWith('.json'))) {
    return;
  }

  const now = new Date().toISOString();
  const presetForAgent = {
    ...preset,
    createdAt: preset?.createdAt ?? now,
    updatedAt: preset?.updatedAt ?? now,
  };

  const agent = {
    id: 'agent-e2e-default',
    version: '1',
    name: 'E2E Default Agent',
    description: 'Default agent seeded for Electron E2E chat scenarios.',
    icon: '🤖',
    keywords: ['e2e', 'default', 'qa'],
    preset: presetForAgent,
    status: 'active',
    sessionCount: 0,
    usageCount: 0,
  };

  const agentPath = path.join(agentsDir, `${agent.id}.json`);
  await fs.writeFile(agentPath, JSON.stringify(agent, null, 2), 'utf-8');
}
