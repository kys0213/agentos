import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useActiveAgents,
  useChatHistory,
  useMentionableAgents,
  useSendChatMessage,
} from '../../hooks/queries/use-chat';
import { ChatView } from './ChatView';
import { Button } from '../ui/button';
import type { AppSection } from '../../stores/store-types';

export const ChatViewContainer: React.FC<{ onNavigate?: (section: AppSection) => void }> = ({
  onNavigate,
}) => {
  const mentionableQuery = useMentionableAgents();
  const activeQuery = useActiveAgents();
  const mentionableAgents = mentionableQuery.data ?? [];
  const activeAgents = activeQuery.data ?? [];
  const isMentionablePending = mentionableQuery.isPending;
  const isActivePending = activeQuery.isPending;

  const initialAgentId = activeAgents[0]?.id ?? mentionableAgents[0]?.id;
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(initialAgentId);

  // Ensure selectedAgentId is set once agents load (prefer active)
  useEffect(() => {
    if (!selectedAgentId) {
      const next = activeAgents[0]?.id ?? mentionableAgents[0]?.id;
      if (next) {
        setSelectedAgentId(next);
      }
    }
  }, [selectedAgentId, activeAgents, mentionableAgents]);

  // If current selection is no longer available, switch to an available one
  useEffect(() => {
    if (selectedAgentId) {
      const stillExists =
        activeAgents.some((a) => a.id === selectedAgentId) ||
        mentionableAgents.some((a) => a.id === selectedAgentId);
      if (!stillExists) {
        const next = activeAgents[0]?.id ?? mentionableAgents[0]?.id;
        setSelectedAgentId(next);
      }
    }
  }, [selectedAgentId, activeAgents, mentionableAgents]);

  // Maintain sessionId per agent for consecutive turns
  const sessionIdMapRef = useRef<Map<string, string>>(new Map());
  const currentSessionId = selectedAgentId
    ? sessionIdMapRef.current.get(selectedAgentId)
    : undefined;

  const { data: messages = [] } = useChatHistory(selectedAgentId, currentSessionId);

  const sendMutation = useSendChatMessage(selectedAgentId, {
    sessionId: currentSessionId,
    onSessionId: (sid) => {
      if (selectedAgentId) {
        sessionIdMapRef.current.set(selectedAgentId, sid);
      }
    },
  });

  const loading = useMemo(
    () => isMentionablePending || isActivePending,
    [isMentionablePending, isActivePending]
  );

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading chat…</div>;
  }

  if (mentionableQuery.status === 'error' || activeQuery.status === 'error') {
    const err = (mentionableQuery.error as Error) || (activeQuery.error as Error);
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold">Failed to load agents</h2>
          <p className="text-sm text-red-600">{err?.message || 'Unknown error'}</p>
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={() => {
                mentionableQuery.refetch();
                activeQuery.refetch();
              }}
            >
              Retry
            </Button>
            <Button variant="outline" onClick={() => onNavigate?.('dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyAgents = mentionableAgents.length > 0 || activeAgents.length > 0;
  if (!hasAnyAgents) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold">No agents available</h2>
          <p className="text-sm text-muted-foreground">
            Create an agent to start chatting. You can always manage or update agents later.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => onNavigate?.('subagents')}>Create Agent</Button>
            <Button variant="outline" onClick={() => onNavigate?.('dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedAgentId) {
    return <div className="p-6 text-sm text-muted-foreground">Preparing chat…</div>;
  }

  return (
    <ChatView
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
