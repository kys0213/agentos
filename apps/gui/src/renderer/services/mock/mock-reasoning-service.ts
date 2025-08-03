import { ReasoningStep } from '../../types/chat-types';
import { mockAvailableAgents } from './mock-available-agents';

export class MockReasoningService {
  /**
   * 질문을 분석하여 적절한 에이전트를 찾고 리즈닝 스텝을 생성
   */
  analyzeQueryWithSteps(
    query: string,
    activeAgentIds: string[]
  ): {
    matchedAgents: string[];
    steps: ReasoningStep[];
  } {
    const lowerQuery = query.toLowerCase();
    const steps: ReasoningStep[] = [];

    // Step 1: Query Analysis
    steps.push({
      id: 'analysis',
      type: 'analysis',
      title: '질문 분석',
      content: `사용자 질문: "${query}"\n질문의 핵심 의도와 필요한 전문 영역을 파악중입니다.`,
      isCompleted: true,
    });

    // Step 2: Keyword Matching
    const foundKeywords: { [agentId: string]: string[] } = {};
    const activeAgents = mockAvailableAgents.filter((agent) => activeAgentIds.includes(agent.id));

    activeAgents.forEach((agent) => {
      const matchedKeywords = agent.keywords.filter((keyword) =>
        lowerQuery.includes(keyword.toLowerCase())
      );
      if (matchedKeywords.length > 0) {
        foundKeywords[agent.id] = matchedKeywords;
      }
    });

    steps.push({
      id: 'keyword-matching',
      type: 'keyword-matching',
      title: '키워드 매칭',
      content:
        Object.keys(foundKeywords).length > 0
          ? `발견된 전문 영역:\n${Object.entries(foundKeywords)
              .map(([agentId, keywords]) => {
                const agent = mockAvailableAgents.find((a) => a.id === agentId);
                return `• ${agent?.name}: ${keywords.join(', ')}`;
              })
              .join('\n')}`
          : '특정 전문 영역 키워드가 감지되지 않았습니다. 일반적인 질문으로 분류됩니다.',
      data: foundKeywords,
      isCompleted: true,
    });

    // Step 3: Agent Selection
    const matchedAgents = Object.keys(foundKeywords);
    let selectionReason = '';

    if (matchedAgents.length === 0) {
      selectionReason = '전문 영역이 특정되지 않아 메인 어시스턴트가 직접 응답합니다.';
    } else if (matchedAgents.length === 1) {
      const agent = mockAvailableAgents.find((a) => a.id === matchedAgents[0]);
      selectionReason = `${agent?.name}의 전문성이 가장 적합하다고 판단되어 해당 에이전트를 배정합니다.`;
    } else {
      const agentNames = matchedAgents
        .map((id) => mockAvailableAgents.find((a) => a.id === id)?.name)
        .join(', ');
      selectionReason = `여러 전문 영역이 관련되어 ${agentNames}의 협업이 필요합니다.`;
    }

    steps.push({
      id: 'agent-selection',
      type: 'agent-selection',
      title: '에이전트 선택',
      content: selectionReason,
      data: { selectedAgents: matchedAgents },
      isCompleted: true,
    });

    // Step 4: Conclusion
    steps.push({
      id: 'conclusion',
      type: 'conclusion',
      title: '결론',
      content:
        matchedAgents.length > 0
          ? `${matchedAgents.length}개의 전문 에이전트가 순차적으로 응답을 제공합니다.`
          : '메인 어시스턴트가 직접 응답을 제공합니다.',
      isCompleted: true,
    });

    return { matchedAgents, steps };
  }
}
