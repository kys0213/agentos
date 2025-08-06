import { ChatSessionMetadata } from '@agentos/core';

export const mockChatSessions: ChatSessionMetadata[] = [
  {
    sessionId: '1',
    title: '데이터 분석 요청',
    recentMessages: [
      {
        messageId: '1',
        role: 'assistant',
        agentMetadata: {
          id: 'data-analyzer',
          name: 'Data Analyzer',
          description: 'Data Analyzer',
          icon: '🔍',
          keywords: ['data', 'analysis', 'csv', 'trend'],
        },
        isCompressed: false,
        content: {
          contentType: 'text',
          value: 'CSV 파일의 매출 트렌드 분석을 완료했습니다.',
        },
        createdAt: new Date('2024-01-15T14:30:00'),
      },
    ],
    totalMessages: 12,
    totalUsage: {
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
    },
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
    joinedAgents: [
      {
        id: 'data-analyzer',
        name: 'Data Analyzer',
        description: 'Data Analyzer',
        icon: '🔍',
        keywords: ['data', 'analysis', 'csv', 'trend'],
      },
    ],
  },
  {
    sessionId: '2',
    title: 'React 컴포넌트 리팩토링',
    recentMessages: [
      {
        messageId: '1',
        role: 'assistant',
        agentMetadata: {
          id: 'code-assistant',
          name: 'Code Assistant',
          description: 'Code Assistant',
          icon: '🔍',
          keywords: ['code', 'refactor', 'improvement'],
        },
        isCompressed: false,
        content: {
          contentType: 'text',
          value: '코드 구조를 개선한 버전을 제안드립니다.',
        },
        createdAt: new Date('2024-01-15T14:30:00'),
      },
    ],
    totalMessages: 12,
    totalUsage: {
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
    },
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
    joinedAgents: [
      {
        id: 'code-assistant',
        name: 'Code Assistant',
        description: 'Code Assistant',
        icon: '🔍',
        keywords: ['code', 'refactor', 'improvement'],
      },
    ],
  },
  {
    sessionId: '3',
    title: '블로그 포스트 작성',
    recentMessages: [
      {
        messageId: '1',
        role: 'assistant',
        agentMetadata: {
          id: 'content-writer',
          name: 'Content Writer',
          description: 'Content Writer',
          icon: '🔍',
          keywords: ['content', 'writing', 'marketing', 'copywriting'],
        },
        isCompressed: false,
        content: {
          contentType: 'text',
          value: 'AI와 개발자의 협업에 대한 글쓰기를 도와드렸습니다.',
        },
        createdAt: new Date('2024-01-15T14:30:00'),
      },
    ],
    totalMessages: 12,
    totalUsage: {
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
    },
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
    joinedAgents: [
      {
        id: 'content-writer',
        name: 'Content Writer',
        description: 'Content Writer',
        icon: '🔍',
        keywords: ['content', 'writing', 'marketing', 'copywriting'],
      },
    ],
  },
  {
    sessionId: '4',
    title: 'API 설계 리뷰',
    recentMessages: [
      {
        messageId: '1',
        role: 'assistant',
        agentMetadata: {
          id: 'code-assistant',
          name: 'Code Assistant',
          description: 'Code Assistant',
          icon: '🔍',
          keywords: ['code', 'refactor', 'improvement'],
        },
        isCompressed: false,
        content: {
          contentType: 'text',
          value: 'RESTful API 설계 가이드라인에 따른 개선사항을 정리했습니다.',
        },
        createdAt: new Date('2024-01-15T14:30:00'),
      },
    ],
    totalMessages: 12,
    totalUsage: {
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
    },
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
    joinedAgents: [
      {
        id: 'code-assistant',
        name: 'Code Assistant',
        description: 'Code Assistant',
        icon: '🔍',
        keywords: ['code', 'refactor', 'improvement'],
      },
    ],
  },
  {
    sessionId: '5',
    title: '시장 조사 분석',
    recentMessages: [
      {
        messageId: '1',
        role: 'assistant',
        agentMetadata: {
          id: 'research-assistant',
          name: 'Research Assistant',
          description: 'Research Assistant',
          icon: '🔍',
          keywords: ['research', 'analysis', 'report', 'fact-checking'],
        },
        isCompressed: false,
        content: {
          contentType: 'text',
          value: '경쟁사 분석 리포트를 완성했습니다.',
        },
        createdAt: new Date('2024-01-15T14:30:00'),
      },
    ],
    totalMessages: 12,
    totalUsage: {
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
    },
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
    joinedAgents: [
      {
        id: 'research-assistant',
        name: 'Research Assistant',
        description: 'Research Assistant',
        icon: '🔍',
        keywords: ['research', 'analysis', 'report', 'fact-checking'],
      },
    ],
  },
];

export const getChatSessions = (): ChatSessionMetadata[] => {
  return mockChatSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getChatSessionById = (id: string): ChatSessionMetadata | undefined => {
  return mockChatSessions.find((session) => session.sessionId === id);
};
