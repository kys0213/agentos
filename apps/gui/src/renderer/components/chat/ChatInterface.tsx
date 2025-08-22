import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Send,
  Bot,
  User,
  Settings,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  X,
  Minimize2,
} from 'lucide-react';
import type { MessageHistory } from '@agentos/core';
import MessageRenderer from './MessageRenderer';

interface ChatInterfaceProps {
  agentId: number;
  agentName: string;
  agentPreset: string;
  onClose: () => void;
  onMinimize: () => void;
}

export function ChatInterface({
  agentId: _agentId,
  agentName,
  agentPreset,
  onClose,
  onMinimize,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Readonly<MessageHistory>[]>([]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, _setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      return;
    }

    // TODO agent 와 대화하기

    setMessages([]);
    setInputMessage('');

    // typing 표시 고도화하기
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'agent':
        return <Bot className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getMessageBg = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-50 border-blue-200';
      case 'agent':
        return 'bg-green-50 border-green-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <Card className="w-96 h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">{agentName}</h3>
            <p className="text-xs text-muted-foreground">{agentPreset}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onMinimize}>
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.messageId} className="space-y-2">
            <div className={`p-3 rounded-lg border ${getMessageBg(message.role)}`}>
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{getMessageIcon(message.role)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium capitalize">{message.role}</span>
                    <span className="text-xs text-muted-foreground">
                      {message.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <MessageRenderer message={message} />
                </div>
              </div>
            </div>

            {message.role === 'assistant' && (
              <div className="flex gap-2 ml-6">
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ThumbsUp className="w-3 h-3 mr-1" />
                  Good
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ThumbsDown className="w-3 h-3 mr-1" />
                  Bad
                </Button>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bot className="w-4 h-4" />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
            <span className="text-sm">typing...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
