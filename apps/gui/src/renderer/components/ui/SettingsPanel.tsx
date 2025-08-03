import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * 우측에서 슬라이드되는 설정 패널 (임시 간소화)
 * - store 의존성 제거하여 무한 렌더링 방지
 * - Week 2 UX 기능 테스트 후 복원 예정
 */
const SettingsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // 임시로 로컬 상태 사용

  const handleClose = () => {
    setIsOpen(false);
    console.log('Settings panel closed - temporarily using local state');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
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
              duration: 0.3,
            }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 border-l border-gray-200 flex flex-col"
          >
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Settings (Week 2 UX Testing)</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Close settings"
                data-testid="close-settings"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 간소화된 컨텐츠 */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800">Debugging Mode</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Settings panel is temporarily simplified to prevent infinite rendering issues.
                    All store dependencies have been removed.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Mock Settings Sections</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      🤖 LLM Bridge Settings
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      🔌 MCP Connections
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      🎨 Presets & Templates
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
