import React from 'react';
import { EchoAgent } from './EchoAgent';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

const ChatApp: React.FC = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const agentRef = React.useRef<EchoAgent>();
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    agentRef.current = new EchoAgent();
    agentRef.current.initialize().catch((err) => console.error(err));
  }, []);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');

    try {
      setBusy(true);
      const response = await agentRef.current!.execute(trimmed);
      setMessages((prev) => [...prev, { sender: 'agent', text: response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { sender: 'agent', text: 'Error executing task' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '8px' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: '8px' }}>
            <strong>{m.sender === 'user' ? 'You' : 'Agent'}:</strong> {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message"
          style={{ width: '80%' }}
          disabled={busy}
        />
        <button onClick={handleSend} disabled={busy}>Send</button>
      </div>
    </div>
  );
};

export default ChatApp;
