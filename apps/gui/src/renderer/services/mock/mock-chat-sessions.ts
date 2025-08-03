import { ChatSession } from '../../types/chat-types';

export const mockChatSessions: ChatSession[] = [
  {
    id: '1',
    title: '데이터 분석 요청',
    lastMessage: 'CSV 파일의 매출 트렌드 분석을 완료했습니다.',
    timestamp: new Date('2024-01-15T14:30:00'),
    agentName: 'Data Analyzer',
    agentPreset: 'Data Analysis Expert',
    messageCount: 12,
    isPinned: true,
  },
  {
    id: '2',
    title: 'React 컴포넌트 리팩토링',
    lastMessage: '코드 구조를 개선한 버전을 제안드립니다.',
    timestamp: new Date('2024-01-15T11:20:00'),
    agentName: 'Code Assistant',
    agentPreset: 'Development Helper',
    messageCount: 8,
  },
  {
    id: '3',
    title: '블로그 포스트 작성',
    lastMessage: 'AI와 개발자의 협업에 대한 글쓰기를 도와드렸습니다.',
    timestamp: new Date('2024-01-14T16:45:00'),
    agentName: 'Content Writer',
    agentPreset: 'Writing Specialist',
    messageCount: 15,
  },
  {
    id: '4',
    title: 'API 설계 리뷰',
    lastMessage: 'RESTful API 설계 가이드라인에 따른 개선사항을 정리했습니다.',
    timestamp: new Date('2024-01-14T09:15:00'),
    agentName: 'Code Assistant',
    agentPreset: 'Development Helper',
    messageCount: 6,
  },
  {
    id: '5',
    title: '시장 조사 분석',
    lastMessage: '경쟁사 분석 리포트를 완성했습니다.',
    timestamp: new Date('2024-01-13T14:20:00'),
    agentName: 'Research Assistant',
    agentPreset: 'Research Specialist',
    messageCount: 18,
    isArchived: false,
  },
];

export const getChatSessions = (): ChatSession[] => {
  return mockChatSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getChatSessionById = (id: string): ChatSession | undefined => {
  return mockChatSessions.find((session) => session.id === id);
};
