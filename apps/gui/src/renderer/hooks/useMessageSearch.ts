import { useMemo } from 'react';

// Lightweight local type for search filtering
export type SearchableMessage = { text: string };

export default function useMessageSearch(
  messages: SearchableMessage[],
  term: string
): SearchableMessage[] {
  return useMemo(() => {
    if (!term) {
      return messages;
    }
    const lower = term.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(lower));
  }, [messages, term]);
}
