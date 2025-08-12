import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../lib/query-client';

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const showDevtools =
    // Vite env preferred
    ((typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_DEVTOOLS === 'true') ||
      // Fallback to process.env for tests/build
      (typeof process !== 'undefined' && process.env?.VITE_DEVTOOLS === 'true')) &&
    // Only in dev mode
    ((typeof import.meta !== 'undefined' && (import.meta as any)?.env?.DEV) ||
      process.env.NODE_ENV === 'development');
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {showDevtools && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
};
