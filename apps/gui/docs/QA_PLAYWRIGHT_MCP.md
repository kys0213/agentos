# Playwright MCP QA 가이드

최신 GUI 디자인과 Figma 시안을 동일하게 유지하려면 Playwright MCP 도구를 활용해 핵심 플로우를 정기적으로 검증합니다. 아래 절차는 로컬 개발 서버(`http://localhost:5173`) 기준입니다.

## 준비

1. 패키지 설치 후 GUI 앱을 실행합니다.
   ```bash
   pnpm install
   pnpm --filter @agentos/apps-gui dev # localhost:5173
   ```
2. 별도의 터미널에서 시나리오별로 Playwright MCP를 실행합니다. 예를 들어 대시보드 정렬을 확인하려면 다음과 같이 실행합니다.
   ```bash
   npx -y @playwright/mcp@latest \
     apps/gui/mcp/scenarios/dashboard.mcp.ts \
     --baseUrl http://localhost:5173 \
     --output apps/gui/mcp/output/dashboard
   ```

## 기본 시나리오

| 시나리오 | 설명 |
| --- | --- |
| `dashboard-alignment` | Dashboard 메트릭/Agent Activity 카드가 디자인 SSOT와 동일한지 캡처 + 비교 |
| `chat-agent-flow` | 멀티에이전트 탭에서 멘션 가능한 에이전트 목록 노출, 메시지 전송 플로우 QA |
| `manager-empty-states` | SubAgent/MCP/Tool Builder EmptyState가 최신 카피 및 스타일을 사용하는지 확인 |

각 시나리오는 `apps/gui/mcp/scenarios/<name>.mcp.ts` 파일로 제공되며, 실행 시 `--output` 플래그에 지정한 디렉터리에 스크린샷과 로그가 생성됩니다.

## 새 시나리오 추가

1. `apps/gui/mcp/scenarios/` 디렉터리에 `<name>.mcp.ts` 파일을 추가합니다.
2. `export default` 함수 안에서 필요한 Playwright 스텝을 작성합니다.
3. 아래 형식으로 시나리오를 실행합니다.
   ```bash
   npx -y @playwright/mcp@latest apps/gui/mcp/scenarios/<name>.mcp.ts \
     --baseUrl http://localhost:5173 \
     --output apps/gui/mcp/output/<name>
   ```

## 노하우

- **기록 보존**: CI에서 MCP를 실행하면 `apps/gui/mcp/output` 전체를 아티팩트로 업로드해 UI 드리프트를 빠르게 파악할 수 있습니다.
- **Figma 비교**: 결과 스크린샷과 `https://party-mind-53553550.figma.site/`를 나란히 보면서 색상/간격 차이를 확인하십시오.
- **실패시 가이드**: 실패한 스텝은 로그에 CSS 셀렉터와 원인(예: `Locator didn't match visible elements`)을 남깁니다. 해당 컴포넌트의 renderer 구현과 design/샌드박스 컴포넌트를 비교해 수정합니다.

Playwright MCP는 GUI/프론트엔드 QA의 SSOT로 사용되므로, 주요 UI 변경 전에 반드시 시나리오를 업데이트하고 검증 결과를 공유하세요.
