import { useMemo } from 'react';
export default function useMessageSearch(messages, term) {
    return useMemo(() => {
        if (!term)
            return messages;
        const lower = term.toLowerCase();
        return messages.filter((m) => m.text.toLowerCase().includes(lower));
    }, [messages, term]);
}
