import React from 'react';
import { McpConfig } from '@agentos/core';

export interface McpListProps {
  mcps: McpConfig[];
  onClose(): void;
}

const McpList: React.FC<McpListProps> = ({ mcps, onClose }) => {
  return (
    <div style={{ padding: '8px' }}>
      <button onClick={onClose} style={{ marginBottom: '8px' }}>
        Close
      </button>
      {mcps.length === 0 ? (
        <div>No MCPs configured.</div>
      ) : (
        <ul>
          {mcps.map((mcp, idx) => (
            <li key={idx}>
              <strong>{mcp.name}</strong> ({mcp.type})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default McpList;
