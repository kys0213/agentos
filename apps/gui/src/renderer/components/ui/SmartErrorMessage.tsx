import React from 'react';
import { AlertCircle, Settings, Wrench } from 'lucide-react';
import { useErrorToSettingsLink } from '../../hooks/useContextBridge';

/**
 * 스마트 에러 메시지 컴포넌트
 * 에러 내용을 분석하여 자동으로 해결 방법 제안
 */

interface Message {
  id: string;
  content: string;
  type: 'error' | 'warning' | 'info';
  timestamp: number;
}

interface SmartErrorMessageProps {
  message: Message;
  className?: string;
}

const SmartErrorMessage: React.FC<SmartErrorMessageProps> = ({ message, className = '' }) => {
  const { getErrorActions } = useErrorToSettingsLink();

  if (message.type !== 'error') {
    // 에러가 아닌 경우 기본 메시지 표시
    return (
      <div className={`message ${message.type} ${className}`}>
        <p>{message.content}</p>
      </div>
    );
  }

  const errorActions = getErrorActions(message.content);

  return (
    <div className={`border-l-4 border-red-500 bg-red-50 p-4 rounded-md ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800 mb-1">Error Occurred</h4>
          <p className="text-sm text-red-700 mb-3">{message.content}</p>

          {/* 자동 생성된 해결 액션들 */}
          {errorActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-red-800">Suggested Actions:</p>
              <div className="flex flex-wrap gap-2">
                {errorActions.map((action, index) => {
                  const isDestructive = action.variant === 'destructive';
                  const btnClass = isDestructive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-100 text-red-800 hover:bg-red-200';
                  const IconComp = isDestructive ? Wrench : Settings;
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${btnClass}`}
                      data-testid={`error-action-${index}`}
                    >
                      <IconComp className="w-3 h-3" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 일반적인 해결 방법 제안 */}
          {errorActions.length === 0 && (
            <div className="mt-2">
              <p className="text-xs text-red-600">
                Try checking your settings or contact support if the issue persists.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 다양한 에러 유형별 예시 컴포넌트
 */
export const ErrorExamples = {
  MCPError: () => (
    <SmartErrorMessage
      message={{
        id: '1',
        content: 'MCP server connection failed: Could not connect to localhost:8080',
        type: 'error',
        timestamp: Date.now(),
      }}
    />
  ),

  BridgeError: () => (
    <SmartErrorMessage
      message={{
        id: '2',
        content: 'LLM Bridge error: Invalid API configuration for Claude bridge',
        type: 'error',
        timestamp: Date.now(),
      }}
    />
  ),

  AuthError: () => (
    <SmartErrorMessage
      message={{
        id: '3',
        content: 'Authentication failed: API key is invalid or expired',
        type: 'error',
        timestamp: Date.now(),
      }}
    />
  ),

  PresetError: () => (
    <SmartErrorMessage
      message={{
        id: '4',
        content: 'Preset "Code Review" could not be loaded: Configuration is corrupted',
        type: 'error',
        timestamp: Date.now(),
      }}
    />
  ),

  GenericError: () => (
    <SmartErrorMessage
      message={{
        id: '5',
        content: 'An unexpected error occurred while processing your request',
        type: 'error',
        timestamp: Date.now(),
      }}
    />
  ),
};

export default SmartErrorMessage;
