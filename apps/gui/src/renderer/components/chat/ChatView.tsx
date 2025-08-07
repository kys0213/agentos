import React from 'react';
import { AppModeState } from '../../types/chat-types';

interface ChatViewProps {
  onNavigate: (section: AppModeState['activeSection']) => void;
}

/**
 * ChatView Component
 * 
 * This component is currently being refactored to work with the new
 * Core-based MCP system. The previous implementation relied on mock
 * services that have been removed during code cleanup.
 * 
 * TODO: Integrate with actual ChatService and MCP system
 */
const ChatView: React.FC<ChatViewProps> = ({ onNavigate }) => {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <div className="p-8 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Chat Feature Under Development
          </h2>
          <p className="text-gray-600 mb-4">
            The chat functionality is being refactored to integrate with the new MCP Core system.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This feature will be available soon with improved performance and reliability.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Available Features:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => onNavigate('tools')}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                MCP Tools Management
              </button>
              <button
                onClick={() => onNavigate('presets')}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
              >
                Preset Management
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="px-4 py-2 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;