import { Preset, Agent } from "../types";

export const mockPresets: Preset[] = [
  {
    id: "preset-research-001",
    name: "Research Assistant",
    description: "Specialized in academic research, fact-checking, and data analysis",
    category: "research",
    model: "gpt-4",
    systemPrompt: "You are a research assistant specialized in academic research and fact-checking. You help users find reliable sources, analyze data, and provide evidence-based insights. Always cite your sources and maintain academic rigor.",
    parameters: {
      temperature: 0.3,
      maxTokens: 4000,
      topP: 0.9
    },
    tools: ["web_search", "arxiv", "scholar"],
    mcpTools: [
      {
        type: "stdio",
        name: "arxiv-search",
        version: "1.0.0",
        command: "node",
        args: ["/opt/mcp-tools/arxiv-server.js"],
        env: { "API_KEY": "demo" }
      } as any
    ],
    status: "active",
    createdAt: new Date(2024, 0, 15),
    updatedAt: new Date(2024, 1, 20),
    usageCount: 342,
    knowledgeDocuments: 24,
    knowledgeStats: {
      indexed: 24,
      vectorized: 18,
      totalSize: 2.4
    }
  },
  {
    id: "preset-code-002",
    name: "Code Assistant",
    description: "Expert in software development, debugging, and code optimization",
    category: "development",
    model: "claude-3-5-sonnet",
    systemPrompt: "You are a senior software engineer with expertise in multiple programming languages and frameworks. Help users write clean, efficient code, debug issues, and follow best practices. Provide detailed explanations and examples.",
    parameters: {
      temperature: 0.2,
      maxTokens: 8000,
      topP: 0.95
    },
    tools: ["code_execution", "git", "documentation"],
    mcpTools: [
      {
        type: "streamableHttp",
        name: "github-api",
        version: "2.1.0",
        url: "https://api.github.com/mcp",
        headers: { "Authorization": "Bearer demo-token" }
      } as any
    ],
    status: "active",
    createdAt: new Date(2024, 0, 10),
    updatedAt: new Date(2024, 1, 25),
    usageCount: 189,
    knowledgeDocuments: 8,
    knowledgeStats: {
      indexed: 8,
      vectorized: 8,
      totalSize: 1.2
    }
  },
  {
    id: "preset-content-003",
    name: "Content Writer",
    description: "Creative writing, content creation, and copywriting specialist",
    category: "creative",
    model: "gpt-4",
    systemPrompt: "You are a creative writing expert with a talent for engaging content creation. Help users craft compelling copy, creative stories, and marketing content. Focus on clarity, engagement, and brand voice consistency.",
    parameters: {
      temperature: 0.8,
      maxTokens: 6000,
      topP: 0.9
    },
    tools: ["grammar_check", "style_guide", "research"],
    mcpTools: [],
    status: "idle",
    createdAt: new Date(2024, 0, 5),
    updatedAt: new Date(2024, 1, 15),
    usageCount: 267,
    knowledgeDocuments: 15,
    knowledgeStats: {
      indexed: 15,
      vectorized: 12,
      totalSize: 1.8
    }
  },
  {
    id: "preset-analytics-004",
    name: "Data Analyzer",
    description: "Data analysis, visualization, and statistical insights",
    category: "analytics",
    model: "claude-3-haiku",
    systemPrompt: "You are a data scientist specialized in data analysis and visualization. Help users interpret data, create meaningful insights, and suggest actionable recommendations. Focus on statistical accuracy and clear communication.",
    parameters: {
      temperature: 0.1,
      maxTokens: 5000,
      topP: 0.8
    },
    tools: ["data_viz", "statistics", "python"],
    mcpTools: [
      {
        type: "websocket",
        name: "data-stream",
        version: "1.2.0",
        url: "ws://localhost:8080/data-mcp"
      } as any
    ],
    status: "inactive",
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 1, 10),
    usageCount: 45,
    knowledgeDocuments: 6,
    knowledgeStats: {
      indexed: 6,
      vectorized: 4,
      totalSize: 0.8
    }
  }
];

export const mockAgents: Agent[] = [
  {
    id: "agent-research-001",
    name: "Research Assistant",
    description: "Specialized in gathering and analyzing information",
    category: "research",
    status: "active",
    preset: "preset-research-001",
    usageCount: 342,
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24),
    tags: ["research", "analysis", "academic"]
  },
  {
    id: "agent-code-002", 
    name: "Code Assistant",
    description: "Expert in software development and debugging",
    category: "development",
    status: "active",
    preset: "preset-code-002",
    usageCount: 189,
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 12),
    tags: ["coding", "debugging", "software"]
  },
  {
    id: "agent-content-003",
    name: "Content Writer", 
    description: "Creative writing and content creation specialist",
    category: "creative",
    status: "idle",
    preset: "preset-content-003",
    usageCount: 267,
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 48),
    tags: ["writing", "content", "creative"]
  },
  {
    id: "agent-analytics-004",
    name: "Data Analyzer",
    description: "Data analysis and visualization expert", 
    category: "analytics",
    status: "inactive",
    preset: "preset-analytics-004",
    usageCount: 45,
    lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    tags: ["data", "analytics", "visualization"]
  }
];