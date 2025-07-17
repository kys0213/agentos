# GUI Styling Plan

## Requirements

### 성공 조건

- [x] Provide a consistent UI theme using Chakra UI
- [x] All major components adopt Chakra UI components
- [ ] Support dark and light mode switching

### 사용 시나리오

- [x] User launches the GUI and sees the new theme applied
- [ ] User toggles dark/light mode from settings
- [ ] Layout remains responsive across window sizes

### 제약 조건

- [x] Keep the existing React + Electron structure
- [x] Avoid breaking current functionality while refactoring styles
- [x] Limit additional dependencies to Chakra UI and its peers

## Interface Sketch

```typescript
// apps/gui/src/renderer/theme.ts
export const theme: ThemeConfig;

// apps/gui/src/renderer/app/index.tsx
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '../theme';

ReactDOM.createRoot(el).render(
  <ChakraProvider theme={theme}>
    <ChatApp />
  </ChakraProvider>
);
```

## Todo

- [x] Add `@chakra-ui/react` and `@chakra-ui/icons` to dependencies
- [x] Create a global theme with color palette and dark mode config
- [x] Wrap the application with `ChakraProvider`
- [x] Replace inline styles with Chakra UI components (Button, Flex, etc.)
- [ ] Unit test theme initialization and dark mode toggle
- [x] Run `pnpm lint` and `pnpm test`
- [ ] Update documentation with styling guidelines

## 작업 순서

1. **Setup**: Install Chakra UI and create `theme.ts` (완료 조건: build succeeds)
2. **Integrate**: Apply `ChakraProvider` in entry point and convert key layouts (완료 조건: GUI renders with Chakra theme)
3. **Refactor**: Migrate remaining components to Chakra UI (완료 조건: consistent look)
4. **Test**: Add theme-related tests and run lint/tests (완료 조건: all checks pass)
5. **Docs**: Document theming usage (완료 조건: updated docs)
