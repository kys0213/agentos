import { AgentMetadata, MessageHistory } from '@agentos/core';
import { Bot, Brain, ChevronRight, Copy, Sparkles, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import React from 'react';
import { MessageRecord } from '../../types/core-types';
import {
  parseMessageContent,
  parseMessagePreview,
  ParseableMessage,
} from '../../utils/message-parser';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export interface MessageRendererProps {
  message: ParseableMessage;
  mode?: 'full' | 'preview' | 'compact';
  showTimestamp?: boolean;
  showActions?: boolean;
  showAgentBadge?: boolean;
  availableAgents?: Array<{ id: string; name: string; icon: string }>;
  mainAgent?: { id: string; name: string; icon: string };
  onOrchestrationToggle?: (messageId: string) => void;
  orchestrationSteps?: MessageHistory[];
  isOrchestrationExpanded?: boolean;
  getAgentColor?: (agent: AgentMetadata) => string;
  className?: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({
  message,
  mode = 'full',
  showTimestamp = true,
  showActions = false,
  showAgentBadge = false,
  availableAgents = [],
  mainAgent,
  onOrchestrationToggle,
  orchestrationSteps,
  isOrchestrationExpanded = false,
  getAgentColor,
  className = '',
}) => {
  const getMessageIcon = (role: string, agentMetadata?: AgentMetadata) => {
    if (role === 'assistant' && agentMetadata) {
      const agentColor = getAgentColor?.(agentMetadata) || 'bg-gray-500';
      const isMainAgent = agentMetadata.id === mainAgent?.id;
      const agentIcon = isMainAgent
        ? mainAgent.icon
        : availableAgents.find((a) => a.id === agentMetadata.id)?.icon || '🤖';

      return (
        <div className={`w-6 h-6 ${agentColor} rounded-full flex items-center justify-center`}>
          <span className="text-xs text-white">{agentIcon}</span>
        </div>
      );
    }

    switch (role) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'assistant':
        return <Bot className="w-4 h-4" />;
      case 'system':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getMessageBg = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-blue-50 border-blue-200';
      case 'assistant':
        return 'bg-green-50 border-green-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50';
    }
  };

  const getDisplayName = (role: string, agentMetadata?: AgentMetadata) => {
    if (role === 'assistant' && agentMetadata) {
      return agentMetadata.name;
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatTimestamp = (date: Date) => {
    if (mode === 'compact' || mode === 'preview') {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'now';
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    }
    return date.toLocaleString();
  };

  const getMessageContent = () => {
    if (mode === 'preview') {
      return parseMessagePreview(message, 80);
    }
    return parseMessageContent(message);
  };

  const messageTimestamp = 'createdAt' in message ? message.createdAt : message.timestamp;
  const messageId = (message as MessageHistory).messageId || (message as MessageRecord).id;
  const agentMetadata = (message as MessageHistory).agentMetadata;

  // Preview mode - simplified rendering for ChatHistory
  if (mode === 'preview') {
    const content = getMessageContent();
    return (
      <div className={`text-xs text-gray-600 line-clamp-2 leading-relaxed ${className}`}>
        {content}
        {showAgentBadge && agentMetadata && (
          <Badge variant="secondary" className="text-xs font-medium ml-2">
            {agentMetadata.name}
          </Badge>
        )}
      </div>
    );
  }

  // Compact mode - single line
  if (mode === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getMessageIcon(message.role, agentMetadata)}
        <span className="text-sm truncate flex-1">{getMessageContent()}</span>
        {showTimestamp && messageTimestamp && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTimestamp(messageTimestamp)}
          </span>
        )}
      </div>
    );
  }

  // Full mode - complete message rendering
  const hasOrchestrationSteps =
    message.role === 'assistant' &&
    agentMetadata?.id === mainAgent?.id &&
    orchestrationSteps &&
    orchestrationSteps.length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`p-4 rounded-lg border ${getMessageBg(message.role)} max-w-4xl ${
          message.role === 'user' ? 'ml-auto' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getMessageIcon(message.role, agentMetadata)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {getDisplayName(message.role, agentMetadata)}
              </span>
              {showTimestamp && messageTimestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(messageTimestamp)}
                </span>
              )}
            </div>
            <p className="text-sm whitespace-pre-line">{getMessageContent()}</p>

            {/* Orchestration Steps */}
            {hasOrchestrationSteps && onOrchestrationToggle && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOrchestrationToggle(messageId)}
                  className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  {isOrchestrationExpanded ? 'Hide reasoning steps' : 'Show reasoning steps'}
                  <ChevronRight
                    className={`w-3 h-3 ml-1 transition-transform ${
                      isOrchestrationExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </Button>

                {isOrchestrationExpanded && (
                  <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="mt-4 space-y-3">
                      {orchestrationSteps.map((step, index) => (
                        <div key={step.messageId} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step.role === 'assistant' ? 'bg-green-100' : 'bg-gray-100'
                              }`}
                            >
                              <Brain className="w-4 h-4 text-blue-500" />
                            </div>
                            {index < orchestrationSteps.length - 1 && (
                              <div className="w-0.5 h-4 bg-gray-300 mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium">{step.role}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {parseMessageContent(step)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Actions */}
      {showActions && message.role === 'assistant' && (
        <div className="flex gap-2 ml-12">
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <ThumbsUp className="w-3 h-3 mr-1" />
            Good
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <ThumbsDown className="w-3 h-3 mr-1" />
            Bad
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageRenderer;
