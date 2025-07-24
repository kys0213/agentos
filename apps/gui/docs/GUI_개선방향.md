AgentOS GUI 개선 및 신규 기능 계획서
문서 목적: AgentOS 프로젝트의 GUI를 개선하고 기능을 확장하기 위한 제안사항을 정리한 문서입니다. 이 문서는 팀 내부 및 이해관계자와 공유할 수 있는 자료로 사용됩니다.
1. 현행 GUI 구조 요약
주요 UI 구조
ChatApp.tsx는 메인 컴포넌트로서 세션 목록, 탭, LLM 브리지 선택, 프리셋 선택, MCP 설정을 관리합니다
raw.githubusercontent.com
.
세션 목록은 ChatSidebar에서 표시되며 새 세션 생성과 세션 오픈 기능만 지원합니다
raw.githubusercontent.com
.
메시지 영역은 ChatMessageList가 담당하며 사용자와 에이전트의 메시지를 단순 리스트 형태로 보여 줍니다
raw.githubusercontent.com
.
ChatInput은 입력창과 전송 버튼으로 구성되어 있습니다
raw.githubusercontent.com
.
관리 기능
프리셋은 PresetManager에서 목록화, 추가, 삭제만 가능합니다
raw.githubusercontent.com
.
LLM 브리지는 LlmBridgeManager에서 echo와 reverse 타입만 관리되며, 추가/삭제만 할 수 있습니다
raw.githubusercontent.com
.
MCP는 McpSettings에서 단일 설정만 입력할 수 있습니다
raw.githubusercontent.com
.
2. 개선 및 신규 기능 제안
2.1 메시지 UI 개선 (타임스탬프 및 말풍선)
Message 타입 확장: ChatMessageList.tsx의 Message 타입에 timestamp: Date를 추가하여 메시지 시간 정보를 저장한다
raw.githubusercontent.com
.
시간 기록: useChatSession.ts의 send 함수에서 메시지를 생성할 때 현재 시간을 함께 저장하도록 수정한다
raw.githubusercontent.com
.
말풍선 스타일: 메시지를 사용자와 에이전트 별로 좌우 정렬하고 배경색을 구분하여 표시한다. timestamp는 말풍선 상단 또는 하단에 작은 글씨로 보여 준다.
로딩 표시: 메시지 전송 중에는 스피너 혹은 “답변 생성 중…”을 표시하여 사용자의 대기 상황을 명확히 한다.
2.2 세션 이름 변경 및 삭제 기능
편집 UI 추가: ChatSidebar의 세션 항목에 연필 아이콘을 배치해 제목을 수정할 수 있는 모달 혹은 인라인 입력창을 띄운다.
저장 로직: 수정된 제목을 저장할 수 있도록 chatManager.renameSession(id, newTitle) 메서드를 구현하고 세션 목록을 갱신한다
raw.githubusercontent.com
.
세션 삭제: 세션 옆에 휴지통 아이콘을 추가해 chatManager.delete(id)를 실행하도록 하고, 삭제 후 목록을 새로고침한다.
2.3 MCP 관리 기능 확장
스토어 구조 변경: McpConfigStore를 배열 기반 스토어로 확장해 여러 MCP 설정을 저장/불러오기/삭제하도록 수정한다
raw.githubusercontent.com
.
목록 UI: McpList를 MCP 목록과 삭제/선택 기능까지 제공하도록 확장하고, 사용자는 활성 MCP를 선택할 수 있다.
설정 폼 개선: 타입별로 URL, 인증 토큰 등 추가 옵션을 표시하도록 폼을 개선한다
raw.githubusercontent.com
.
세션 적용: 새 세션 생성 시 선택된 MCP가 사용되도록 ChatApp.tsx에서 로직을 조정한다.
2.4 LLM 브리지 관리 확장
브리지 타입 추가: openai, anthropic 등의 실제 모델 브리지 타입을 선택 옵션에 추가한다
raw.githubusercontent.com
.
설정 입력: 브리지 타입에 따라 API 키, 모델명 등을 입력할 수 있는 동적 폼을 제공한다.
메타데이터 표시: 선택된 브리지의 getMetadata()를 호출해 모델 설명, 버전, 컨텍스트 윈도우 등을 UI에 표시한다.
새 브리지 클래스 구현: bridges/ 폴더에 API 호출 로직을 구현한 새로운 브리지 클래스를 추가하고, BridgeManager에 등록하는 기능을 작성한다.
2.5 프리셋 관리 강화
필드 확대: 프리셋 편집 UI에 이름뿐 아니라 설명, 시스템 프롬프트, 기본 브리지 등을 입력할 수 있는 폼을 추가한다
raw.githubusercontent.com
.
프리셋 적용 로직: 세션이 실행 중일 때 프리셋을 변경하면 즉시 적용되도록 ChatApp.tsx의 프리셋 처리 로직을 수정한다
raw.githubusercontent.com
.
2.6 대화 내역 저장/내보내기
Export 버튼: 현재 세션의 메시지를 JSON 또는 Markdown 형식으로 내보내는 버튼을 추가한다. Electron의 dialog.showSaveDialog와 파일 시스템 API를 사용하여 파일을 저장한다.
Import 기능: (추가 기능) 외부 파일로부터 이전 세션을 불러올 수 있는 기능을 구현한다.
2.7 메시지 검색 및 필터링
검색창 추가: ChatMessageList 상단에 검색창을 배치하여 특정 키워드가 포함된 메시지만 필터링하여 표시한다.
실시간 필터링: 검색어 입력 시 messages 배열을 필터링해 화면에 적용한다.
2.8 기타 UI/UX 개선
반응형 레이아웃: 모바일 환경에서 세션 목록이나 설정 메뉴가 오버레이로 나타나도록 Drawer 컴포넌트를 검토한다.
키보드 단축키: Enter는 전송, Shift+Enter는 줄바꿈 등 기본적인 단축키를 구현한다.
테마 다양화: theme.ts에서 제공하는 색상 팔레트를 확장하거나 사용자 지정 테마 기능을 추가한다.
3. 구현을 위한 Codex 지시 예시
아래는 실제 구현 단계에서 Codex에게 전달할 수 있는 예시 명령입니다.
// 1. Message 타입에 timestamp 추가
export interface Message {
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

// 2. send 함수에서 timestamp 기록
setMessages((prev) => [...prev, {
  sender: 'user',
  text,
  timestamp: new Date(),
}]);
…
setMessages((prev) => [...prev, {
  sender: 'agent',
  text: reply,
  timestamp: new Date(),
}]);

// 3. ChatMessageList 컴포넌트에서 말풍선 스타일 적용
<HStack key={idx} justify={m.sender === 'user' ? 'flex-end' : 'flex-start'}>
  <Box bg={m.sender === 'user' ? 'blue.50' : 'gray.100'} p={2} borderRadius="md">
    <Text fontSize="xs" color="gray.500">{m.timestamp.toLocaleTimeString()}</Text>
    <Text whiteSpace="pre-wrap">{m.text}</Text>
  </Box>
</HStack>
이와 같은 지시를 통해 Codex는 점진적으로 기능을 추가하고, 각 변경 사항을 테스트하며 안정적인 UI/UX를 구현할 수 있습니다.