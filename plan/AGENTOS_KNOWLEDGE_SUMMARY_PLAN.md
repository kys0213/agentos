# 작업계획서: AgentOS Knowledge Summary Document

## Requirements

### 성공 조건

- [x] 리포지터리의 핵심 철학과 목표를 명시한다.
- [x] 주요 구현 스펙과 기능 개요를 정확하게 요약한다.
- [x] GPT/Claude 프롬프트 주입에 적합한 구조(섹션/불릿)를 갖춘다.

### 사용 시나리오

- [x] 새 AI 에이전트가 레포 컨텍스트를 빠르게 이해할 때 참고한다.
- [x] 신규 기여자가 프로젝트 전반을 이해하고 작업 방향을 맞출 때 사용한다.

### 제약 조건

- [x] 기존 문서들과 모순 없이 정보를 통합해야 한다.
- [x] 유지보수를 고려해 중복 서술을 최소화하고 출처를 명확히 한다.

## Interface Sketch

```markdown
# AgentOS Knowledge Summary

- Mission & Philosophy
- Architecture Overview
- Key Features & Specifications
- Development Workflow & Principles
- References for Deep Dive
```

## Todo

- [x] 기존 문서(AGENTS.md, README.md, docs/ 등)에서 핵심 정보를 수집한다.
- [x] 최종 문서 구조를 확정하고 아웃라인을 작성한다.
- [x] 각 섹션 내용을 작성하고 정확성 검토를 수행한다.
- [x] 문서 어조/형식을 GPT 주입에 맞게 다듬는다.
- [x] 문서 파일을 적절한 경로에 저장하고 팀과 공유할 준비를 한다.
- [x] 테스트 작성 (단위 테스트) - 문서 작업으로 해당 없음.
- [x] 테스트 작성 (통합 테스트) - 문서 작업으로 해당 없음.
- [x] 문서 업데이트 - 본 작업이 해당.

## 작업 순서

1. **정보 수집**: 관련 문서 리서치 (완료 조건: 참고할 핵심 소스 리스트업).
2. **문서 초안**: 아웃라인/섹션 작성 (완료 조건: 드래프트 작성 완료).
3. **정제 및 검수**: 정확성/톤 확인 후 최종 저장 (완료 조건: 문서 저장 및 Todo 체크 완료).
