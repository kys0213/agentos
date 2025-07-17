# GUI Styling Guide

This document summarizes how styling is handled in the GUI.

- Chakra UI provides the base components and theming.
- The application theme is defined in `src/renderer/theme.ts`.
- Color mode can be toggled from the settings menu via the sun/moon button.
- Use Chakra UI's responsive props (`base`, `md`, etc.) to ensure layouts adapt to window size.
- Prefer Chakra components over raw HTML elements for consistency.
- The `PresetSelector` component uses `Select` with responsive props.
- The bridge selector in `ChatApp` uses `FormControl` and `FormLabel` for better consistency.
