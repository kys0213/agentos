import React from 'react';
import { BridgeManager } from './BridgeManager';
import EchoBridge from './bridges/EchoBridge';
import ReverseBridge from './bridges/ReverseBridge';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

const manager = new BridgeManager();
manager.register('echo', new EchoBridge());
manager.register('reverse', new ReverseBridge());

const ChatApp: React.FC = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [bridgeId, setBridgeId] = React.useState(manager.getCurrentId()!);
  const endRef = React.useRef<HTMLDivElement>(null);

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
      const llmResponse = await manager
        .getCurrentBridge()
        .invoke({ messages: [{ role: 'user', content: { contentType: 'text', value: trimmed } }] });
      const content = llmResponse.content;
      const text = content.contentType === 'text' ? String(content.value) : '';
      setMessages((prev) => [...prev, { sender: 'agent', text }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { sender: 'agent', text: 'Error executing task' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <label htmlFor="bridge">LLM Bridge: </label>
        <select
          id="bridge"
          value={bridgeId}
          onChange={async (e) => {
            const id = e.target.value;
            await manager.switchBridge(id);
            setBridgeId(id);
          }}
        >
          {manager.getBridgeIds().map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
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
        <button onClick={handleSend} disabled={busy}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatApp;
