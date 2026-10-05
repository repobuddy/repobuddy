## Goals

- One `preset` line per project, chosen by language (TypeScript or JavaScript), module format (ESM or CommonJS),
  and environment (Node.js or jsdom).
- A combination no preset covers is composed from the exported `configs` and `fields`, not added as a preset.

## Non-goals

- Environments other than `node` and `jsdom`, such as `happy-dom` or a real browser.
- A Babel preset. `js-esm` leaves Jest's default `babel-jest` in place.
- More presets for variants such as `ts-jest` for ESM, or JavaScript in jsdom.

## Rejected directions

- **Electron presets** (`@kayahr/jest-electron-runner`). Removed.
- **`buddy jest init` and `buddy jest up`** (#26, #27). Closed as not planned.
- **A plugin to choose perf and stress suites** (#108). Closed as not planned. Load tests run through
  `configs.nodeLoad`.
