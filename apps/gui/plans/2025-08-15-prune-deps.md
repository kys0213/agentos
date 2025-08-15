# GUI Dependencies Prune Plan — 2025-08-15

## 요구사항
- apps/gui/package.json의 실제 미사용 dependencies를 정리한다.
- 빌드/타입체크가 통과하도록 안전하게 제거한다.
- Git 워크플로우에 따라 브랜치/TODO 커밋을 수행한다.

## 기준
- 소스 `apps/gui/src/**`에서 import/require 흔적이 없는 패키지를 제거.
- 동적 의존(피어/런타임) 가능성 있는 항목은 보류.

## 후보 (미사용 확인)
- @chakra-ui/icons
- @modelcontextprotocol/sdk
- @types/react-virtualized-auto-sizer
- react-virtualized-auto-sizer
- react-window
- framer-motion
- kbar
- vaul
- electron-store
- class-variance-authority

## 보존 (사용 확인)
- Chakra UI core, Emotion, Radix UI 컴포넌트, lucide-react, cmdk, react-hook-form, tailwind-merge/clsx, @tanstack/react-query(+devtools), zod, electron, zustand, @agentos/core, llm-bridge-spec

## Todo
- [x] 의존성 사용 여부 코드 스캔
- [ ] package.json에서 미사용 deps 제거
- [ ] pnpm install 및 타입체크/빌드 확인

## 작업 순서
1) 후보 제거 → 2) 설치/타입체크 → 3) 빌드 검증 → 4) PR
