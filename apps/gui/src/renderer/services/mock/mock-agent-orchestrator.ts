import { Agent, AgentMetadata } from '@agentos/core';

export class MockAgentOrchestrator {
  /**
   * 메인 에이전트 (오케스트레이터) 정보
   */
  static getMainAgent() {
    return {
      id: 'main-orchestrator',
      name: 'AgentOS',
      preset: 'General Assistant & Orchestrator',
      status: 'active',
      description: '질문을 분석하고 적절한 전문 에이전트를 선택합니다',
      icon: '🧠',
    };
  }

  /**
   * 에이전트별 응답 생성
   */
  getAgentResponse(agentId: string, message: string): string {
    const responses = {
      'data-analyzer': [
        '데이터를 분석해보겠습니다. 어떤 형태의 데이터인지 알려주세요.',
        '통계적 분석이나 시각화가 필요하시군요. 구체적인 요구사항을 설명해주세요.',
        '데이터 패턴을 찾는 데 도움을 드릴 수 있습니다.',
      ],
      'code-assistant': [
        '코드를 검토해보겠습니다. 어떤 언어나 프레임워크를 사용하고 계신가요?',
        '성능 최적화나 보안 검토가 필요하시군요. 코드를 공유해주세요.',
        '버그 해결이나 리팩토링에 도움을 드릴 수 있습니다.',
      ],
      'content-writer': [
        '창의적인 글쓰기를 도와드리겠습니다. 어떤 스타일의 콘텐츠가 필요하신가요?',
        '문서 작성이나 편집에 도움을 드릴 수 있습니다.',
        '브랜딩이나 마케팅 콘텐츠 제작을 지원하겠습니다.',
      ],
      'research-assistant': [
        '정보를 조사해보겠습니다. 어떤 주제에 대해 알고 싶으신가요?',
        '신뢰할 수 있는 출처를 바탕으로 자료를 정리해드리겠습니다.',
        '팩트 체크나 심층 분석이 필요한 부분을 알려주세요.',
      ],
    };

    const agentResponses = responses[agentId as keyof typeof responses] || ['도움을 드리겠습니다!'];
    return agentResponses[Math.floor(Math.random() * agentResponses.length)];
  }

  /**
   * 메인 에이전트의 직접 응답
   */
  getDirectResponse(query: string): string {
    const responses = [
      '네, 도움이 되도록 최선을 다하겠습니다. 구체적인 내용을 알려주시면 더 정확한 답변을 드릴 수 있어요.',
      '좋은 질문이네요! 이에 대해 자세히 설명해드리겠습니다.',
      '이 주제에 대해 도움을 드릴 수 있습니다. 더 구체적인 요구사항이 있으시면 알려주세요.',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Available Agent를 Active Agent로 변환
   */
  convertToActiveAgent(agent: Agent): Agent {
    return {
      id: agent.id,
      name: agent.name,
      preset: agent.preset,
      status: agent.status,
      description: agent.description,
      icon: agent.icon,
      sessionCount: 0,
      run: () => Promise.resolve({ messages: [], sessionId: '' }),
      keywords: [],
    };
  }

  /**
   * 에이전트 색상 반환
   */
  getAgentColor(agentMetadata: AgentMetadata): string {
    const colors = {
      'data-analyzer': 'bg-blue-500',
      'code-assistant': 'bg-green-500',
      'content-writer': 'bg-purple-500',
      'research-assistant': 'bg-orange-500',
      'main-orchestrator': 'bg-gradient-to-br from-blue-500 to-purple-600',
    };
    return colors[agentMetadata.name as keyof typeof colors] || 'bg-gray-500';
  }
}
