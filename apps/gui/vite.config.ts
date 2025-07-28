import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // public 디렉토리를 정적 리소스로 사용
  publicDir: 'public',

  // Renderer 프로세스를 위한 브라우저 환경 설정
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/app/index.tsx'),
      output: {
        entryFileNames: 'bundle.js',
        format: 'es',
      },
      // Renderer는 브라우저 환경이므로 external 설정 제거
      // 모든 의존성이 번들에 포함되어야 함
    },
    // 브라우저 환경을 타겟으로 설정
    target: 'es2020',
    minify: process.env.NODE_ENV === 'production',
  },

  // 브라우저 환경을 위한 Node.js polyfill 설정
  define: {
    global: 'globalThis',
  },

  // 개발 서버 설정
  server: {
    port: 5173,
  },

  // 해석 설정
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
