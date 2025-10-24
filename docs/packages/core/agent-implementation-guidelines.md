# Agent Implementation Guidelines

This document provides guidance for implementing agent functionality in the `@agentos/core` package while following the architecture outlined in [`agent-architecture.md`](./agent-architecture.md).

## Objectives

- Maintain **Single Source of Truth (SSOT)** for agent state
- Embrace **reactive programming** and event-driven flows
- Keep `core` free of external dependencies; implementations requiring libraries belong in separate packages

## Design Principles

1. **Event First**
   - 모든 상태 변경은 이벤트로 발행합니다.
   - `SimpleEventEmitter` 또는 호환 가능한 EventBus를 사용하여 변경을 구독할 수 있도록 합니다.
2. **Immutable Metadata**
   - 저장된 에이전트 메타데이터는 불변 구조로 다룹니다.
   - 업데이트 시 새 버전을 생성하고 `expectedVersion`으로 경쟁 상태를 방지합니다.
3. **Composable Services**
   - `AgentFactory`, `SessionService`, `AgentService`는 느슨하게 결합된 조합 가능한 모듈로 구현합니다.
   - 각 서비스는 인터페이스 기반으로 설계하여 어댑터 교체가 가능해야 합니다.
4. **Storage Strategy**
   - `core`에는 외부 의존성이 없는 `FileAgentMetadataRepository` 같은 기본 구현만 포함합니다.
   - SQLite/HTTP 등 추가 라이브러리가 필요한 저장소는 `@agentos/sqlite-storage`와 같이 별도 패키지로 제공하며 `@agentos/core`를 `peerDependency`로 선언합니다.
5. **React-style Flow**
   - 상태는 저장소 → 서비스 → UI로 단방향 흐름을 유지합니다.
   - UI는 이벤트 스트림을 구독하여 자동으로 상태를 동기화합니다.

## Recommended Implementation Steps

1. **AgentMetadataRepository 구현 확장**
   - 파일 기반 구현 예시를 참고하여 SQLite/HTTP 어댑터를 외부 패키지로 추가합니다.
2. **AgentFactory 및 AgentService 작성**
   - 에이전트 생성 로직과 퍼사드 서비스를 구현하여 외부 앱이 일관된 API를 사용하도록 합니다.
3. **SessionService 도입**
   - 세션 수명주기 관리와 이벤트 발행을 담당하며, 에이전트와 협력하여 SSOT를 유지합니다.
4. **EventBridge 정교화**
   - 에이전트/세션 이벤트를 중앙 버스로 전달하여 React 앱 또는 다른 소비자가 구독할 수 있도록 합니다.
5. **테스트 및 문서화**
   - 모든 공개 메서드에 대한 단위 테스트 작성
   - `docs/`에 사용 예시 및 API 레퍼런스 추가

## References

- [`agent-architecture.md`](./agent-architecture.md)
- [`agent-session-plan.md`](./plans/agent-session-plan.md)
- [Electron IPC Spec](../../../apps/gui/docs/rpc/SPEC_FULL.md)
