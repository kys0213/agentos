# Pull Request

## 📋 변경 사항 요약 (Summary of Changes)

<!-- 이 PR에서 변경된 내용을 간단히 설명해주세요 -->

## 🎯 변경 이유 (Why)

<!-- 이 변경이 필요한 이유를 설명해주세요 -->

- [ ] 새 기능 추가 (New feature)
- [ ] 버그 수정 (Bug fix)
- [ ] 성능 개선 (Performance improvement)
- [ ] 리팩토링 (Refactoring)
- [ ] 문서 업데이트 (Documentation update)
- [ ] 기타 (Other):

## 🔧 변경 내용 (What Changed)

<!-- 구체적인 변경 사항들을 나열해주세요 -->

### 주요 변경사항

-

### API 변경사항 (있는 경우)

-

## 🧪 테스트 (Testing)

### 테스트 전략

- [ ] **코어 모듈**: 100% 커버리지 달성
- [ ] **도메인 모듈**: 블랙박스 테스트로 비즈니스 로직 검증
- [ ] **응용 계층**: 통합 테스트로 사용자 시나리오 검증

### 외부 의존성 처리

- [ ] 네트워크 통신은 mocking 처리됨
- [ ] 파일 시스템 접근은 mocking 처리됨
- [ ] 시간 의존적 로직은 fake timer 사용
- [ ] jest-mock-extended 사용하여 type-safe mocking 구현

### 테스트 실행 결과

```bash
# 테스트 실행 명령어와 결과를 여기에 붙여넣어주세요
pnpm test
```

## 📚 문서화 (Documentation)

- [ ] JSDoc 주석 추가/업데이트
- [ ] 한국어 설명 포함
- [ ] README 업데이트 (필요한 경우)
- [ ] API 문서 업데이트 (필요한 경우)
- [ ] 사용 예시 추가 (필요한 경우)

## ✅ 코드 품질 체크리스트 (Code Quality Checklist)

### 코드 스타일

- [ ] `pnpm lint` 통과
- [ ] `pnpm format` 적용
- [ ] SOLID 원칙 준수
- [ ] 클린 아키텍처 원칙 준수
- [ ] 순환 의존성 없음

### 타입 안전성

- [ ] `any` 타입 사용 최소화
- [ ] unknown 입력에 대한 타입 가드 적용
- [ ] 제네릭 활용

### 아키텍처 준수

- [ ] 계층별 역할 분리 준수
- [ ] 의존성 방향 올바름
- [ ] 단일 책임 원칙 준수

## 🔄 복잡도 관리 (Complexity Management)

- [ ] **단순함 우선**: 가장 단순한 해결책 적용
- [ ] **분할정복**: 복잡한 문제는 작은 단위로 분할하여 해결
- [ ] **계획서 작성**: 복잡한 변경사항은 사전 계획서 작성 후 진행

### 관련 계획서 (있는 경우)

- 계획서 링크:

## 🧩 변경 영향 범위 (Impact Analysis)

### 영향받는 모듈

- [ ] `packages/core`
- [ ] `apps/cli`
- [ ] `apps/gui`
- [ ] `apps/agent-slack-bot`
- [ ] 기타:

### Breaking Changes

- [ ] 이 PR은 breaking change를 포함하지 않습니다
- [ ] 이 PR은 breaking change를 포함합니다 (아래 설명 필요)

<!-- Breaking change가 있다면 설명해주세요 -->

## 🔗 관련 이슈/PR (Related Issues/PRs)

<!-- 관련된 이슈나 PR이 있다면 링크해주세요 -->

- Closes #
- Related to #

## 📝 추가 정보 (Additional Information)

<!-- 리뷰어가 알아야 할 추가 정보가 있다면 적어주세요 -->

---

## 리뷰어를 위한 체크포인트 (For Reviewers)

- [ ] 코드 변경사항이 요구사항을 충족하는가?
- [ ] 테스트 커버리지가 적절한가?
- [ ] 문서화가 충분한가?
- [ ] 아키텍처 원칙을 준수하는가?
- [ ] 성능에 부정적 영향은 없는가?
- [ ] 보안 이슈는 없는가?

## 배포 후 확인사항 (Post-deployment Checklist)

- [ ] 기능이 예상대로 동작하는가?
- [ ] 기존 기능에 영향이 없는가?
- [ ] 문서가 정확하게 업데이트되었는가?
