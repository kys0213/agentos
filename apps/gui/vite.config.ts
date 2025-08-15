import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development' || process.env.NODE_ENV === 'development';
  const enableDevtools = env.VITE_DEVTOOLS === 'true' || process.env.VITE_DEVTOOLS === 'true';

  return {
    base: './',
    plugins: [react()],

    // public 디렉토리를 정적 리소스로 사용
    publicDir: 'public',

    // Renderer 프로세스를 위한 브라우저 환경 설정
    build: {
      outDir: 'dist/renderer',
      sourcemap: true,
      rollupOptions: {
        input: 'index.html',
        output: {
          entryFileNames: 'bundle.js',
          format: 'iife',
        },
        // Renderer는 브라우저 환경이므로 external 설정 제거
        // 모든 의존성이 번들에 포함되어야 함
      },
      // 브라우저 환경을 타겟으로 설정
      target: 'es2020',
      minify: process.env.NODE_ENV === 'production',
    },

    // 브라우저 환경을 위한 Node.js polyfill 및 환경변수 주입
    define: {
      global: 'globalThis',
      // process.env 객체를 브라우저에서도 사용할 수 있도록 주입
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.VITE_APP_ENV': JSON.stringify(process.env.VITE_APP_ENV || 'auto'),
      // 빌드 타임에 환경 정보 주입
      __APP_ENV__: JSON.stringify({
        buildTarget: process.env.BUILD_TARGET || 'electron',
        nodeEnv: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      }),
      // Compile-time flags for clean branching in code
      __DEV__: JSON.stringify(isDev),
      __DEVTOOLS__: JSON.stringify(isDev && enableDevtools),
    },

    // 개발 서버 설정
    server: {
      port: 5173,
      host: 'localhost',
      strictPort: true, // 포트 고정 실패 시 에러 발생
      cors: true,
      origin: 'http://localhost:5173',
    },

    // 해석 설정
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };
});
