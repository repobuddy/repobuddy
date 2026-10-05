---
title: '@repobuddy/vitest/setup/browser'
description: The setup file browserTestPreset() adds, which reports the time zone as GMT.
---

`@repobuddy/vitest/setup/browser` makes `Intl.DateTimeFormat().resolvedOptions().timeZone` report `GMT` in browser
tests.

## Usage

`browserTestPreset()` adds it to `test.setupFiles` for you. Add it yourself only in a browser config that does not use
the preset:

```ts
export default defineConfig({
	test: { setupFiles: ['@repobuddy/vitest/setup/browser'] },
})
```

## Options

None. The file exports nothing.

## What it does

- Before the tests in each file (`beforeAll`), it spies on `Intl.DateTimeFormat.prototype.resolvedOptions` and returns
  the original options with `timeZone: 'GMT'`.
- After the tests in each file (`afterAll`), it calls `vi.restoreAllMocks()`.

## Behavior

- It changes only what `resolvedOptions()` returns. It does not change the time zone the browser uses to format dates.
- `vi.restoreAllMocks()` in `afterAll` also restores spies your own tests left in place at the end of the file.
- In Node.js, [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/) sets `process.env.TZ` instead.

## Examples

```ts
// a.spec.tsx, run by browserTestPreset()
it('reports GMT', () => {
	expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('GMT')
})
```

## Related

- [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/)
- [Run browser tests](/repobuddy/vitest/guides/browser-tests/)
