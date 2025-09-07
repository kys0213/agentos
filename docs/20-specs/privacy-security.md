# Privacy & Security Policy (Directional Draft)

> 상태: 방향성 초안. 실제 기본값/정책 항목은 운영 요구사항에 따라 조정될 수 있습니다.

로컬 퍼스트 + 배치 수집 원칙 하에서 개인정보/보안을 보장하기 위한 정책 방향을 제시합니다.

## 동의 모델(Consent)

- 기본값: 수집 비활성화(opt-out). 명시적 옵트인 시에만 전송
- 범위(scope): `meta_only | anonymized | full_denied`
  - meta_only: 토큰 수/지연/오류/라우팅 등 메타만 수집, 본문 금지
  - anonymized: 본문에서 PII 제거/치환 후 수집(허용목록 기반)
  - full_denied: 어떤 본문도 외부 전송 금지(로컬에만 보관)

## 허용목록/마스킹 규칙(YAML 예시)

```yaml
privacy:
  mode: anonymized
  allowlist:
    - session_id
    - agent_id
    - route
    - model
    - tokens_in
    - tokens_out
    - latency_ms
    - error_code
  redaction:
    patterns:
      - name: email
        regex: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
        replace: "<EMAIL>"
      - name: phone
        regex: "\+?[0-9][0-9\- ]{7,}" 
        replace: "<PHONE>"
```

## 보존/권리

- 보존 기간: 메타 180일, 익명화 본문 90일(예시). 만료 후 자동 삭제
- 삭제/정정 요청: 로컬/중앙 각각 지원. 수집 식별자(ack_id/batch_id) 기준 삭제

## 암호화/비밀 관리

- 전송: TLS 1.2+ 필수. HSTS 권장
- 저장: 로컬 at-rest 암호화(키체인/OS 보안 스토리지 연동 옵션)
- 시크릿: 앱/수집기/서버에서 Secret Vault 연동(환경변수 최소화)

## 도구 권한 모델(MCP/Tool)

- RBAC: 역할/스코프 기반 권한(파일/네트워크/OS 호출 제한)
- 위험 툴 require-approval(휴먼 루프): 고위험 작업은 RACP 승인 경로 필수

## 프롬프트 주입 방어

- 시스템/툴 정책 분리, 신뢰도 라벨링(출처/컨텍스트 표시)
- 컨텍스트 최소화/출처 소개, 모델에 금칙(시스템) 주입
- 외부 문서 삽입 시 sanitize(스크립트/마크다운 위험 패턴 정리)
