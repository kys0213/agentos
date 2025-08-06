import { Agent } from '@agentos/core';
import type { Preset } from '../../types/core-types';

// Mock Preset objects
const mockPresets: Record<string, Preset> = {
  dataAnalysis: {
    id: 'data-analysis-preset',
    name: 'Data Analysis Expert',
    description: 'Expert in data analysis and visualization',
    author: 'System',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: '1.0.0',
    systemPrompt: 'You are a data analysis expert. Help users analyze and visualize data.',
    llmBridgeName: 'default',
    llmBridgeConfig: { model: 'gpt-4', temperature: 0.1 },
  },
  development: {
    id: 'development-preset',
    name: 'Development Helper',
    description: 'Expert in software development and debugging',
    author: 'System',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: '1.0.0',
    systemPrompt: 'You are a software development expert. Help users with coding and debugging.',
    llmBridgeName: 'default',
    llmBridgeConfig: { model: 'gpt-4', temperature: 0.2 },
  },
  writing: {
    id: 'writing-preset',
    name: 'Writing Specialist',
    description: 'Expert in creative writing and content creation',
    author: 'System',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: '1.0.0',
    systemPrompt:
      'You are a writing specialist. Help users with creative writing and content creation.',
    llmBridgeName: 'default',
    llmBridgeConfig: { model: 'gpt-4', temperature: 0.7 },
  },
  research: {
    id: 'research-preset',
    name: 'Research Specialist',
    description: 'Expert in research and information analysis',
    author: 'System',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: '1.0.0',
    systemPrompt:
      'You are a research specialist. Help users with information gathering and analysis.',
    llmBridgeName: 'default',
    llmBridgeConfig: { model: 'gpt-4', temperature: 0.3 },
  },
};

export const mockAvailableAgents: Agent[] = [
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    preset: mockPresets.dataAnalysis,
    status: 'active',
    description: '데이터 분석과 시각화를 도와드립니다',
    icon: '📊',
    keywords: ['데이터', '분석', '차트', '그래프', '통계', 'csv', 'json', '시각화'],
    sessionCount: 0,
    run: () => Promise.resolve({ messages: [], sessionId: '' }),
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    preset: mockPresets.development,
    status: 'active',
    description: '코드 리뷰와 디버깅을 지원합니다',
    icon: '💻',
    keywords: ['코드', '프로그래밍', '개발', '버그', '리팩토링', 'javascript', 'python', 'react'],
    sessionCount: 0,
    run: () => Promise.resolve({ messages: [], sessionId: '' }),
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    preset: mockPresets.writing,
    status: 'idle',
    description: '창의적인 글쓰기를 도와드립니다',
    icon: '✍️',
    keywords: ['글쓰기', '콘텐츠', '마케팅', '카피', '문서', '작성', '편집'],
    sessionCount: 0,
    run: () => Promise.resolve({ messages: [], sessionId: '' }),
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    preset: mockPresets.research,
    status: 'active',
    description: '정보 수집과 분석을 전문으로 합니다',
    icon: '🔍',
    keywords: ['리서치', '조사', '정보', '분석', '자료', '검색', '팩트체크'],
    sessionCount: 0,
    run: () => Promise.resolve({ messages: [], sessionId: '' }),
  },
];

export const getAvailableAgents = (): Agent[] => {
  return mockAvailableAgents;
};

export const getAgentById = (id: string): Agent | undefined => {
  return mockAvailableAgents.find((agent) => agent.id === id);
};
