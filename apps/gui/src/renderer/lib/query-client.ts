import { QueryClient } from '@tanstack/react-query';

// React Query 클라이언트 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본 stale 시간: 30초
      staleTime: 30 * 1000,
      // 캐시 시간: 5분
      gcTime: 5 * 60 * 1000,
      // 에러 재시도: 1회
      retry: 1,
      // 윈도우 포커스 시 자동 refetch 비활성화 (Electron 환경)
      refetchOnWindowFocus: false,
      // 마운트 시 자동 refetch 활성화
      refetchOnMount: true,
    },
    mutations: {
      // 뮤테이션 에러 재시도: 0회
      retry: 0,
    },
  },
});

// 개발 환경에서만 DevTools 활성화
if (process.env.NODE_ENV === 'development') {
  // React Query DevTools는 컴포넌트에서 직접 import하여 사용
}
