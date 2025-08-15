# Frontend Implementation Roadmap — GUI

This roadmap tracks the design alignment work for the GUI against the Figma mock.

## Phase: Mock Alignment (Week N)

- [x] Typography tokens: base 14px, h1/h2, h5, controls
- [x] Sidebar structure: Archived pill, Pinned/Older sections
- [x] Conversation cards: avatar/title/menu/preview/unread/timestamp
- [x] Header chips: active agents as chips, fallback when none
- [x] Available Agents: rows + status pills + count
- [x] Transcript bubbles + timestamp alignment
- [x] Composer polish: mention button size, disabled state
- [x] Devtools gating via `VITE_DEVTOOLS=true`
- [x] UI tests: ChatHistory (Archived + empty), ChatView header chips
- Spacing/radius/elevation audit and polish across components (planned)
- Accessibility pass (roles, labels for controls) (planned)
- Visual QA sweep vs mock (spacing, radii, shadows) (planned)

## Notes

- Devtools are hidden by default; enable with `VITE_DEVTOOLS=true` in dev.
- Further polish will be done alongside data wiring for pinned/archived.
