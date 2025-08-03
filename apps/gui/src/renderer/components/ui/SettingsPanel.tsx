import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { X, Bot, Server, Palette, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUIState, useUIActions } from '../../stores/app-store';
import { useCurrentBridge, useBridgeIds, useSwitchBridge } from '../../hooks/queries/use-bridge';
import { useContextBridge } from '../../hooks/useContextBridge';

/**
 * 우측에서 슬라이드되는 설정 패널
 * - 모달 → 사이드 패널 전환으로 컨텍스트 보존
 * - 채팅 영역 절대 침범 금지
 * - Framer Motion 기반 부드러운 애니메이션
 */
const SettingsPanel: React.FC = () => {
  const { activeView } = useUIState();
  const { setActiveView } = useUIActions();
  const { backToChat, context } = useContextBridge();
  const [activeTab, setActiveTab] = useState('llm');
  
  const isOpen = activeView === 'settings';

  const handleClose = () => {
    // Context Bridge를 통한 자연스러운 복귀
    backToChat();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 (옵션, 채팅 영역 클릭 시 닫기용) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-30"
            onClick={handleClose}
          />

          {/* 설정 패널 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 border-l border-gray-200 flex flex-col"
          >
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Close settings"
                data-testid="close-settings"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 패널 컨텐츠 - Tabs */}
            <div className="flex-1 overflow-hidden">
              <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                {/* Tab List */}
                <Tabs.List className="flex border-b border-gray-200 bg-gray-50 px-6">
                  <Tabs.Trigger
                    value="llm"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 transition-colors"
                    data-testid="llm-tab"
                  >
                    <Bot className="w-4 h-4" />
                    LLM Bridge
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="mcp"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 transition-colors"
                    data-testid="mcp-tab"
                  >
                    <Server className="w-4 h-4" />
                    MCP Servers
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="presets"
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 transition-colors"
                    data-testid="presets-tab"
                  >
                    <Palette className="w-4 h-4" />
                    Presets
                  </Tabs.Trigger>
                </Tabs.List>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto">
                  <Tabs.Content value="llm" className="p-6 space-y-6">
                    <LLMBridgeSettings />
                  </Tabs.Content>

                  <Tabs.Content value="mcp" className="p-6 space-y-6">
                    <MCPSettings />
                  </Tabs.Content>

                  <Tabs.Content value="presets" className="p-6 space-y-6">
                    <PresetSettings />
                  </Tabs.Content>
                </div>
              </Tabs.Root>
            </div>

            {/* 하단 액션 */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              {/* 컨텍스트 정보 표시 */}
              {context && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    {context.fromView === 'chat' && context.chatSessionId 
                      ? `Returning to chat session: ${context.chatSessionId.slice(0, 8)}...`
                      : `Returning to ${context.fromView}`
                    }
                  </p>
                </div>
              )}
              
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                data-testid="back-to-chat"
              >
                <span>Back to {context?.fromView === 'chat' ? 'Chat' : 'Previous View'}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// LLM Bridge 설정 컴포넌트
const LLMBridgeSettings: React.FC = () => {
  const { data: currentBridge, isLoading: currentBridgeLoading } = useCurrentBridge();
  const { data: bridgeIds = [], isLoading: bridgeIdsLoading } = useBridgeIds();
  const { mutate: switchBridge, isPending: isSwitching } = useSwitchBridge();
  const { backToChat } = useContextBridge();
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleBridgeSwitch = (bridgeId: string) => {
    switchBridge(bridgeId, {
      onSuccess: () => {
        setTestResult({ success: true, message: `Successfully switched to ${bridgeId}` });
        
        // 2초 후 자동으로 채팅으로 복귀하면서 변경 사항 알림
        setTimeout(() => {
          backToChat({
            bridgeChanged: true,
            bridgeName: bridgeId
          });
        }, 2000);
      },
      onError: (error) => {
        setTestResult({ 
          success: false, 
          message: `Failed to switch: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    });
  };

  const handleQuickTest = async () => {
    if (!testMessage.trim()) return;
    
    try {
      // TODO: Implement actual test message sending
      setTestResult({ success: true, message: 'Test message sent successfully!' });
      setTestMessage('');
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  if (currentBridgeLoading || bridgeIdsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading bridge configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">LLM Bridge Configuration</h3>
        
        {/* Current Bridge Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Connected to {currentBridge?.config?.name || 'Unknown Bridge'}
            </span>
          </div>
          <p className="text-sm text-green-600 mt-1">Ready to chat</p>
        </div>

        {/* Bridge Selection */}
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bridge
          </label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={currentBridge?.id || ''}
            onChange={(e) => handleBridgeSwitch(e.target.value)}
            disabled={isSwitching}
          >
            {bridgeIds.map((bridgeId) => (
              <option key={bridgeId} value={bridgeId}>
                {bridgeId.charAt(0).toUpperCase() + bridgeId.slice(1)}
                {currentBridge?.id === bridgeId ? ' (Current)' : ''}
              </option>
            ))}
          </select>
          {isSwitching && (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">Switching bridge...</span>
            </div>
          )}
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className={`border rounded-lg p-4 ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}

        {/* Quick Test */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Test</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter test message..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickTest()}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="test-message-input"
            />
            <button 
              onClick={handleQuickTest}
              disabled={!testMessage.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              data-testid="test-bridge-button"
            >
              Test Bridge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// MCP 설정 컴포넌트
const MCPSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">MCP Server Management</h3>
        
        {/* Connected Servers */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">File System Server</p>
                <p className="text-xs text-gray-500">localhost:8080</p>
              </div>
            </div>
            <button className="text-red-600 hover:text-red-700 text-sm">Remove</button>
          </div>
        </div>

        {/* Add New Server */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Add New Server</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Server name..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Server URL..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              Add Server
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preset 설정 컴포넌트
const PresetSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preset Management</h3>
        
        {/* Available Presets */}
        <div className="space-y-3 mb-4">
          <div className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Code Review</p>
                <p className="text-xs text-gray-500">Optimized for code analysis</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm">Apply</button>
            </div>
          </div>
          <div className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Creative Writing</p>
                <p className="text-xs text-gray-500">Enhanced creativity settings</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm">Apply</button>
            </div>
          </div>
        </div>

        {/* Create New Preset */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Create New Preset</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Preset name..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Preset description..."
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
              Create Preset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;