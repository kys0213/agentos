# 백로그: NestJS ↔ Electron IPC 어댑터

상태: Backlog (아이디어 확정, 착수 대기)
우선순위: 중

## 목적

- 메인 프로세스 구조를 NestJS IoC/모듈 시스템으로 정리하여 유지보수성/테스트 용이성 향상
- Electron IPC를 NestJS의 Transport/Adapter로 래핑해 도메인 모듈(Agent/Bridge/Preset/MCP/Chat)을 느슨하게 결합

## 성공 기준

- [ ] NestJS 부팅(메인 프로세스)으로 모듈·의존성 주입 및 라이프사이클 관리
- [ ] Electron IPC 채널을 NestJS Controller/Handler로 매핑하는 Adapter 동작
- [ ] 기존 IPC 스펙(AgentOsAPI) 호환 유지, 타입 세이프
- [ ] 테스트 환경에서 InMemory/Mock 교체가 컨테이너 바인딩만으로 가능

## 범위

- Adapter: `ElectronIpcAdapter`(NestJS INestApplication과 IPC 바인딩)
- Modules(초기): AgentModule, PresetModule, BridgeModule, ChatModule, MCPModule
- Providers: Repository/Manager/Service/ConfigProvider(경로, devtools), Logger

## 초안 아키텍처

```ts
// bootstrap (main)
const app = await NestFactory.create(AppModule, { logger });
const ipcAdapter = new ElectronIpcAdapter(ipcMain);
app.useWebSocketAdapter?.(ipcAdapter as any); // 또는 app.useAdapter(ipcAdapter)
ipcAdapter.bind(app, {
  // route -> channel 바인딩 규칙
  prefix: '',
});
await app.init();

// adapter (개념)
class ElectronIpcAdapter /* implements AbstractHttpAdapter? */ {
  constructor(private readonly ipc: IpcMain) {}
  bind(app: INestApplication, opts: { prefix: string }) {
    // Controller 메타데이터 스캔 → ipcMain.handle('agent:chat', handler)
  }
}

// controller (예)
@Controller('agent')
export class AgentController {
  constructor(private svc: AgentService) {}
  @IpcHandle('chat')
  chat(@Payload() body: { id: string; messages: UserMessage[]; options?: AgentExecuteOptions }) {
    return this.svc.execute(body.id, body.messages, body.options);
  }
}
```

## 제약/리스크

- Electron + NestJS 생명주기 통합 및 종료 시그널 처리 필요
- 데코레이터 메타데이터 리플렉션 비용/번들 크기 증가 고려
- Adapter 자체 테스트 전략 수립 필요(메타데이터 스캔↔채널 바인딩)

## Todo (하위 작업)

- [ ] 리서치: 기존 커뮤니티 어댑터/패턴 검토(Inversify/NestJS + Electron 사례)
- [ ] 스파이크: 최소 Adapter 프로토타입(단일 채널 바인딩, 에코 핸들러)
- [ ] 모듈화: Agent/Preset 2개 모듈로 축소 PoC
- [ ] 설정 주입: userData 경로/flags ConfigProvider화
- [ ] 마이그레이션 전략 문서화(점진 전환: IPC 핸들러 → Nest Controller)
- [ ] 성능/번들 크기 점검

## 완료 정의(DoD)

- PoC 브랜치에서 Models/Settings 흐름 정상 동작
- 타입체크/빌드 통과, 기본 시나리오 수동 검증(Playwright MCP)
- 문서: 아키텍처 개요/마이그레이션 가이드 추가

## 참고

- 앱 현재 상태: File 기반 저장소 + SimpleAgent 경로로 type-safe 동작, 배열 계약 보장
- 차기 목표: IoC로 모듈 경계/생명주기/에러 매핑 표준화
