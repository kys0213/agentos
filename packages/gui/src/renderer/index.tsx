import React from 'react';
import ReactDOM from 'react-dom/client';
import { Agent } from '@agentos/core';

const App: React.FC = () => {
  const [result, setResult] = React.useState<string>('');
  const [task, setTask] = React.useState<string>('');

  const handleExecute = async () => {
    try {
      const agent = new Agent({
        name: 'default',
        version: '1.0.0',
      });
      await agent.initialize();
      const response = await agent.execute(task);
      setResult(response);
    } catch (error) {
      console.error('Error:', error);
      setResult('Error executing task');
    }
  };

  return (
    <div>
      <h1>AgentOS GUI</h1>
      <div>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter task"
        />
        <button onClick={handleExecute}>Execute</button>
      </div>
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
