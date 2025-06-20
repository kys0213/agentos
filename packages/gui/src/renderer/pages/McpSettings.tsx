import React from 'react';
import { McpConfig } from '@agentos/core';

export interface McpSettingsProps {
  initial?: McpConfig;
  onSave(config: McpConfig): void;
}

const McpSettings: React.FC<McpSettingsProps> = ({ initial, onSave }) => {
  const [type, setType] = React.useState<McpConfig['type']>(initial?.type ?? 'stdio');
  const [name, setName] = React.useState(initial?.name ?? '');
  const [version, setVersion] = React.useState(initial?.version ?? '');

  const [command, setCommand] = React.useState(initial?.type === 'stdio' ? initial.command : '');
  const [args, setArgs] = React.useState(
    initial?.type === 'stdio' && initial.args ? initial.args.join(' ') : ''
  );
  const [url, setUrl] = React.useState(
    initial && initial.type !== 'stdio' ? (initial as any).url : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let config: McpConfig;
    if (type === 'stdio') {
      config = {
        type,
        name,
        version,
        command,
        args: args ? args.split(' ') : [],
      };
    } else {
      config = {
        ...(type === 'streamableHttp' || type === 'websocket' || type === 'sse' ? { url } : {}),
        type,
        name,
        version,
      } as McpConfig;
    }
    onSave(config);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '8px' }}>
      <div>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as McpConfig['type'])}>
            <option value="stdio">stdio</option>
            <option value="streamableHttp">streamableHttp</option>
            <option value="websocket">websocket</option>
            <option value="sse">sse</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Name <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Version <input value={version} onChange={(e) => setVersion(e.target.value)} />
        </label>
      </div>
      {type === 'stdio' && (
        <>
          <div>
            <label>
              Command <input value={command} onChange={(e) => setCommand(e.target.value)} />
            </label>
          </div>
          <div>
            <label>
              Args
              <input
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="--flag value"
              />
            </label>
          </div>
        </>
      )}
      {type !== 'stdio' && (
        <div>
          <label>
            URL <input value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
        </div>
      )}
      <button type="submit">Save</button>
    </form>
  );
};

export default McpSettings;
