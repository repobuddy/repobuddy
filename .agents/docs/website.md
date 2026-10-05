# Documentation site

`website/` (Astro + Starlight), served at `https://repobuddy.github.io/repobuddy/`.

- The sidebar is declared explicitly in `website/astro.config.ts`; a new page needs an entry there or it ships
  unreachable. Sidebar entries take bare slugs; internal Markdown links carry the base path
  (`/repobuddy/jest/presets/ts-esm/`).
- Each package has a section under `website/src/content/docs/<section>/` (`jest`, `vitest`, `biome`, `typescript`,
  `test`, `cli`): an overview, task guides, and one reference page per preset, export, or command. Each public skill
  has a page under `skills/`.
- When a package's presets, exports, options, or commands change, update the matching reference page from the source,
  not from the readme, and the overview's Support section when a peer range or supported environment changes.
