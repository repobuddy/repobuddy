## Goals

- Configure Vitest through Vite plugins: `nodeTestPreset()` for Node.js or a simulated DOM, `browserTestPreset()`
  for a real browser through Playwright.

## Non-goals

- Older Vitest majors. A project on Vitest 4 stays on `@repobuddy/vitest` 2.x.
- Browser providers other than Playwright, such as WebdriverIO.
- Visual or screenshot testing.
- Installing browsers.
- A CommonJS build.

## Rejected directions

- **`ts/` as a source folder** (#642, reverted in #644). It is not a common convention, and the shared presets
  should not bless it. Projects move their sources to `src/`.
