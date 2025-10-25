# Stepper Tabs Usage

`StepperTabs` is the shared presenter for multi-step flows (agent creation, MCP tool creation,
custom tool builder). It renders the header/back button, an optional badge, and tab-based step
navigation, while exposing hooks for per-step enablement and primary actions.

## API

| Prop | Description |
|------|-------------|
| `steps` | Array of `{ id, label, icon? }` describing the step order. |
| `currentStep` | The active `id` from `steps`. Usually stored in component state. |
| `onStepChange(stepId)` | Invoked when a user selects another step. Perform navigation validation here. |
| `isStepEnabled?(stepId)` | Optional guard to disable navigation to certain steps. |
| `backLabel`, `onBack` | Render a back button in the header when supplied. |
| `badge` | Optional `{ label, icon }` badge (used for status such as “Step 2 of 4”). |
| `actionLabel`, `onAction`, `actionDisabled`, `actionProps` | Controls the primary action button in the header. |

Children must be wrapped in `StepperTabContent`:

```tsx
<StepperTabs
  steps={stepConfigs}
  currentStep={activeTab}
  onStepChange={handleTabChange}
  isStepEnabled={isStepUnlocked}
>
  <StepperTabContent stepId="overview">
    {...}
  </StepperTabContent>
  <StepperTabContent stepId="settings">
    {...}
  </StepperTabContent>
</StepperTabs>
```

### Integration Notes

- Navigation hooks such as `useAppNavigation` should expose the `currentStep`/`setActiveSection`
  values used by StepperTabs. Returning booleans from `isStepEnabled` prevents accidental jumps to
  locked steps.
- For QA, ensure creation flows exercise `onStepChange` and the header action. The renderer tests
  should validate both the navigation callbacks and the derived state (e.g., enabling the final
  step only after prerequisites are satisfied).
- For floating chat/manager entry points, update `useAppNavigation` / `useChatState` to toggle the
  appropriate `creating…` flags so that StepperTabs-based flows show the correct initial step.
