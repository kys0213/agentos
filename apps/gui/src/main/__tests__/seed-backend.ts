import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { FileBasedLlmBridgeRegistry } from '@agentos/core/llm';
import { DependencyBridgeLoader } from 'llm-bridge-loader';

type SeedMode = 'full' | 'mock';

export interface SeedOptions {
  profileDir: string;
  mode: SeedMode;
}

const nodeProcess = process as NodeJS.Process;

export interface McpTool {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  provider: string;
  endpoint: string;
  permissions: string[];
  status: 'connected' | 'disconnected';
  usageCount: number;
  config: {
    type: 'sse' | string;
    name: string;
    version: string;
  };
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  systemPrompt: string;
  enabledMcps: Array<{
    name: string;
    enabledTools: string[];
    enabledResources: string[];
    enabledPrompts: string[];
  }>;
  llmBridgeName: string;
  llmBridgeConfig: {
    bridgeId: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  status: 'active' | 'inactive';
  usageCount: number;
  knowledgeDocuments: number;
  knowledgeStats: {
    indexed: number;
    vectorized: number;
    totalSize: number;
  };
  category: string[];
}

export interface AgentSeedPayload {
  id: string;
  version: string;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
  preset: Preset;
  status: 'active' | 'inactive';
  sessionCount: number;
  usageCount: number;
}

export async function seedBackend(options: SeedOptions): Promise<void> {
  const { profileDir, mode } = options;

  if (mode === 'mock') {
    console.log('[seed-backend] mock mode requested; skipping backend seed');
    return;
  }

  await seedLlmBridge(profileDir);
  await seedMcpTools(profileDir);
  const preset = await seedPresetDir(profileDir);
  await seedDefaultAgent(profileDir, preset);
  console.log('[seed-backend] seeding completed');
}

async function seedLlmBridge(profileDir: string): Promise<void> {
  const registry = new FileBasedLlmBridgeRegistry(profileDir, new DependencyBridgeLoader());

  let loaded: Awaited<ReturnType<typeof registry.loadBridge>> | undefined;
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

async function seedMcpTools(profileDir: string): Promise<void> {
  const toolsPath = path.join(profileDir, 'mcp-tools.json');
  const defaultTools: McpTool[] = [
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

async function seedPresetDir(profileDir: string): Promise<Preset> {
  const presetsDir = path.join(profileDir, 'presets');
  await fs.mkdir(presetsDir, { recursive: true });

  const presetPath = path.join(presetsDir, 'preset-e2e-default.json');
  try {
    const existing = await fs.readFile(presetPath, 'utf-8');
    return JSON.parse(existing) as Preset;
  } catch {
    const now = new Date().toISOString();
    const preset: Preset = {
      id: 'preset-e2e-default',
      name: 'E2E Default Agent',
      description: 'Preset seeded for Electron E2E scenarios.',
      author: 'e2e-suite',
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      systemPrompt: 'You are a helpful researcher for automated QA.',
      enabledMcps: [],
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

async function seedDefaultAgent(profileDir: string, preset: Preset): Promise<void> {
  const agentsDir = path.join(profileDir, 'agents');
  await fs.mkdir(agentsDir, { recursive: true });

  const existingFiles = await fs.readdir(agentsDir);
  if (existingFiles.some((file) => file.endsWith('.json'))) {
    return;
  }

  const now = new Date().toISOString();
  const presetForAgent: Preset = {
    ...preset,
    createdAt: preset?.createdAt ?? now,
    updatedAt: preset?.updatedAt ?? now,
  };

  const agent: AgentSeedPayload = {
    id: 'agent-e2e-default',
    version: '1',
    name: 'E2E Default Agent',
    description: 'Default agent seeded for Electron E2E chat scenarios.',
    icon: '🤖',
    keywords: ['e2e', 'default', 'qa'],
    preset: {
      ...presetForAgent,
      enabledMcps: [],
    },
    status: 'active',
    sessionCount: 0,
    usageCount: 0,
  };

  const agentPath = path.join(agentsDir, `${agent.id}.json`);
  await fs.writeFile(agentPath, JSON.stringify(agent, null, 2), 'utf-8');
}

export function parseArguments(argv: string[]): SeedOptions {
  let profileDir: string | null = null;
  let mode: SeedMode = 'full';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--profile' && argv[i + 1]) {
      profileDir = argv[++i];
    } else if (arg === '--mode' && argv[i + 1]) {
      const nextMode = argv[++i] as SeedMode;
      mode = nextMode;
    }
  }

  if (!profileDir) {
    throw new Error('[seed-backend] --profile <path> is required');
  }

  return { profileDir, mode };
}

export async function runSeedCli(argv: string[] = nodeProcess.argv.slice(2)): Promise<void> {
  const options = parseArguments(argv);
  await seedBackend(options);
}
