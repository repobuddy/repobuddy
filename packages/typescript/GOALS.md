## Goals

- `tsconfig` presets you extend: `tsconfig/monorepo`, a legacy variant without `extends` arrays, and building blocks
  grouped by TSConfig category.
- Build CommonJS beside ESM: `nodejs/package.cjs.json` and the `buddy ts` plugin.

## Non-goals

- Project-specific settings. No preset sets `lib`, `types`, `outDir`, or `rootDir`.
- A TypeScript peer dependency.
- A general `tsc` wrapper. `buddy ts build` takes no custom tsconfig path, extra `tsc` flags, or watch mode.
- A CommonJS entry for the plugin.
