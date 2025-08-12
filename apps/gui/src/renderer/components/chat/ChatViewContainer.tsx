import React, { useMemo, useState } from 'react';
import { useActiveAgents, useChatHistory, useMentionableAgents, useSendChatMessage } from '../../hooks/queries/use-chat';
import { ChatView } from './ChatView';

export const ChatViewContainer: React.FC = () => {
  const { data: mentionableAgents = [], status: mentionableStatus } = useMentionableAgents();
  const { data: activeAgents = [], status: activeStatus } = useActiveAgents();

  const initialAgentId = activeAgents[0]?.id ?? mentionableAgents[0]?.id;
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(initialAgentId);

  const { data: messages = [] } = useChatHistory(selectedAgentId);
  const sendMutation = useSendChatMessage(selectedAgentId);

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
      onNavigate={() => {}}
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


