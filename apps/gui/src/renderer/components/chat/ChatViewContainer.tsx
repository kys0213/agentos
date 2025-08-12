import React, { useMemo, useRef, useState } from 'react';
import {
  useActiveAgents,
  useChatHistory,
  useMentionableAgents,
  useSendChatMessage,
} from '../../hooks/queries/use-chat';
import { ChatView } from './ChatView';
import type { AppSection } from '../../stores/store-types';

export const ChatViewContainer: React.FC<{ onNavigate?: (section: AppSection) => void }> = ({
  onNavigate,
}) => {
  const { data: mentionableAgents = [], status: mentionableStatus } = useMentionableAgents();
  const { data: activeAgents = [], status: activeStatus } = useActiveAgents();

  const initialAgentId = activeAgents[0]?.id ?? mentionableAgents[0]?.id;
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(initialAgentId);

  const { data: messages = [] } = useChatHistory(selectedAgentId);

  // Maintain sessionId per agent for consecutive turns
  const sessionIdMapRef = useRef<Map<string, string>>(new Map());
  const currentSessionId = selectedAgentId
    ? sessionIdMapRef.current.get(selectedAgentId)
    : undefined;

  const sendMutation = useSendChatMessage(selectedAgentId, {
    sessionId: currentSessionId,
    onSessionId: (sid) => {
      if (selectedAgentId) sessionIdMapRef.current.set(selectedAgentId, sid);
    },
  });

  const loading = useMemo(
    () => mentionableStatus === 'pending' || activeStatus === 'pending',
    [mentionableStatus, activeStatus]
  );

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading chat…</div>;
  }

  return (
    <ChatView
      agents={mentionableAgents}
      mentionableAgents={mentionableAgents}
      activeAgents={activeAgents}
      onNavigate={onNavigate ?? (() => {})}
      messages={messages}
      selectedAgentId={selectedAgentId}
      onSelectAgent={setSelectedAgentId}
      onSendMessage={(text, mentionedAgents) =>
        sendMutation.mutate({ text, mentionedAgentIds: mentionedAgents.map((a) => a.id) })
      }
    />
  );
};

export default ChatViewContainer;
