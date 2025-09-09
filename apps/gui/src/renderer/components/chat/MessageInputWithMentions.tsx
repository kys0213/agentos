import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Send, AtSign } from 'lucide-react';
import { AgentMetadata } from '@agentos/core';

interface MessageInputWithMentionsProps {
  mentionableAgents: AgentMetadata[];
  onSendMessage: (message: string, mentionedAgents: AgentMetadata[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInputWithMentions({
  mentionableAgents,
  onSendMessage,
  placeholder = 'Type a message... (Use @ to mention agents)',
  disabled = false,
}: MessageInputWithMentionsProps) {
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedAgents, setMentionedAgents] = useState<AgentMetadata[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionStartRef = useRef<number>(-1);

  const filteredAgents = mentionableAgents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      agent.keywords?.some((keyword) => keyword.toLowerCase().includes(mentionQuery.toLowerCase()))
  );

  // Handle input changes and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    setMessage(value);

    // Check for @ mention
    const textBeforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      mentionStartRef.current = cursorPosition - mentionMatch[0].length;

      setMentionQuery(query);
      setSelectedMentionIndex(0);

      // Calculate position for mention dropdown
      const textarea = textareaRef.current;
      if (textarea) {
        const rect = textarea.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }

      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredAgents.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedMentionIndex((prev) => (prev < filteredAgents.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : filteredAgents.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredAgents[selectedMentionIndex]) {
            selectAgent(filteredAgents[selectedMentionIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowMentions(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Select an agent from mention dropdown
  const selectAgent = (agent: AgentMetadata) => {
    const beforeMention = message.slice(0, mentionStartRef.current);
    const afterMention = message.slice(textareaRef.current?.selectionStart || 0);
    const newMessage = beforeMention + `@${agent.name} ` + afterMention;

    setMessage(newMessage);
    setShowMentions(false);

    // Add to mentioned agents if not already included
    if (!mentionedAgents.find((a) => a.id === agent.id)) {
      setMentionedAgents((prev) => [...prev, agent]);
    }

    // Focus back to textarea
    textareaRef.current?.focus();

    // Set cursor position after the mention
    setTimeout(() => {
      const newCursorPos = beforeMention.length + agent.name.length + 2; // +2 for @ and space
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Send message
  const handleSend = () => {
    if (message.trim()) {
      // Extract mentioned agents from the message
      const mentionRegex = /@(\w+)/g;
      const matches = [...message.matchAll(mentionRegex)];
      const currentMentions = matches
        .map((match) =>
          mentionableAgents.find((agent) =>
            agent.name.toLowerCase().includes(match[1].toLowerCase())
          )
        )
        .filter((agent) => agent !== undefined);

      onSendMessage(message.trim(), currentMentions);
      setMessage('');
      setMentionedAgents([]);
      setShowMentions(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  return (
    <div className="relative">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none pr-12"
            style={{ paddingRight: '3rem' }}
          />

          {/* @ hint button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 p-1 h-6 w-6"
            onClick={() => {
              const textarea = textareaRef.current;
              if (textarea) {
                const cursorPos = textarea.selectionStart;
                const newMessage = message.slice(0, cursorPos) + '@' + message.slice(cursorPos);
                setMessage(newMessage);
                textarea.focus();
                setTimeout(() => {
                  textarea.setSelectionRange(cursorPos + 1, cursorPos + 1);
                }, 0);
              }
            }}
            title="Mention an agent"
          >
            <AtSign className="w-3 h-3" />
          </Button>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="sm"
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </Button>
      </div>

      {/* Simple mention autocomplete without external component */}
      {showMentions && filteredAgents.length > 0 && (
        <div
          className="absolute z-50 w-full mt-2 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            position: 'fixed',
            top: mentionPosition.top,
            left: mentionPosition.left,
            width: textareaRef.current?.offsetWidth || 'auto',
          }}
        >
          {filteredAgents.slice(0, 5).map((agent, index) => (
            <div
              key={agent.id}
              className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${
                index === selectedMentionIndex ? 'bg-accent' : ''
              }`}
              onClick={() => selectAgent(agent)}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {agent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-gray-500">{agent.keywords?.join(', ')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show mentioned agents */}
      {mentionedAgents.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Mentioned:</span>
          {mentionedAgents.map((agent) => (
            <span
              key={agent.id}
              className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded"
            >
              @{agent.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
