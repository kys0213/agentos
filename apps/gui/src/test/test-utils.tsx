import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function withProviders(children: React.ReactNode) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
