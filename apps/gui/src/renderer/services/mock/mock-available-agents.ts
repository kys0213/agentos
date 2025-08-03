import { AvailableAgent } from '../../types/chat-types';

export const mockAvailableAgents: AvailableAgent[] = [
  {
    id: 'data-analyzer',
    name: 'Data Analyzer',
    preset: 'Data Analysis Expert',
    status: 'active',
    description: '데이터 분석과 시각화를 도와드립니다',
    icon: '📊',
    keywords: ['데이터', '분석', '차트', '그래프', '통계', 'csv', 'json', '시각화'],
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    preset: 'Development Helper',
    status: 'active',
    description: '코드 리뷰와 디버깅을 지원합니다',
    icon: '💻',
    keywords: ['코드', '프로그래밍', '개발', '버그', '리팩토링', 'javascript', 'python', 'react'],
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    preset: 'Writing Specialist',
    status: 'idle',
    description: '창의적인 글쓰기를 도와드립니다',
    icon: '✍️',
    keywords: ['글쓰기', '콘텐츠', '마케팅', '카피', '문서', '작성', '편집'],
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    preset: 'Research Specialist',
    status: 'active',
    description: '정보 수집과 분석을 전문으로 합니다',
    icon: '🔍',
    keywords: ['리서치', '조사', '정보', '분석', '자료', '검색', '팩트체크'],
  },
];

export const getAvailableAgents = (): AvailableAgent[] => {
  return mockAvailableAgents;
};

export const getAgentById = (id: string): AvailableAgent | undefined => {
  return mockAvailableAgents.find((agent) => agent.id === id);
};
