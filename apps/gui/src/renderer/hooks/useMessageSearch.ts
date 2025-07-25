import { useMemo } from 'react';
import { Message } from '../components/ChatMessageList';

export default function useMessageSearch(messages: Message[], term: string): Message[] {
  return useMemo(() => {
    if (!term) return messages;
    const lower = term.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(lower));
  }, [messages, term]);
}
