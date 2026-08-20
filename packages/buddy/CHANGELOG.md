# repobuddy

## 1.5.0

### Minor Changes

- 9c753c8: Add the `review-permissions` skill: audit what an agent harness is allowed to do, rank each grant by what it actually permits, and propose a tighter, consolidated configuration.
  
  It reads permissions across Claude Code, Cursor CLI, Codex CLI, Copilot CLI, Gemini CLI, and OpenCode — allowlists, approval modes, sandboxes, trusted folders, writable roots, hooks, and MCP servers — since an allowlist means nothing underneath a mode that skips the check. The bundled `scan-permissions.mjs` collects and grades; the skill supplies the repo context and never widens a grant or edits a config without an approved diff.

## 1.4.0

### Minor Changes

- 3e8fae7: Ship the public agent skills as a universal plugin.
  
  The five public skills (`create-issue`, `merge-dep-prs`, `setup-github-pages`, `setup-github-repo`,
  `setup-npm-trusted-publishing`) move from the repository root into this package and are now published
  in the npm tarball, alongside a canonical `plugin.json` on the Agent Plugins Specification v1.0.0 and
  derived manifests for Claude Code, Cursor, and Codex. Copilot CLI reads the canonical manifest directly.
- 0bdd5fc: Add the `to-question` skill.
  
  It words a technical question, design discussion, or decision request for the platform you are about
  to paste it into — Slack, Jira, Linear, Asana, GitHub, GitLab, email, or a Markdown baseline for
  anything unlisted — and runs a bundled checker over the draft so dialect mistakes surface before the
  paste, not after. It composes and hands off; filing the item itself stays with `create-issue`.
- 42e0417: Add the `code-review` skill. Reviews a change set through three named engineering lenses — Linus, Uncle Bob, and Fowler — running each pass independently and reporting where the verdicts split rather than averaging them into one score.

### Patch Changes

- cf42353: Publish the `templates` directory. The `files` allowlist named `template` (singular), which matched nothing on disk, so no template file was included in the published package.

## 1.3.2

### Patch Changes

- 4e55a09: Rename the `ts` source folder to `src`.

  The published source folder is now `src` instead of `ts`. The public API and all
  export specifiers are unchanged; only the shipped file paths differ (relevant to
  JSR consumers, which resolve `./src/...` instead of `./ts/...`).

## 1.3.1

### Patch Changes

- 5bce37c: fix bin path

## 1.3.0

### Minor Changes

- bd113cc: Add `bd` as alias of `buddy`

## 1.2.0

### Minor Changes

- 030b32d: Update `clibuilder` to 9.0

## 1.1.0

### Minor Changes

- 3e394fb: Add `templates/.editorconfig`.
  Remove extra files in the distribution.

## 1.0.2

### Patch Changes

- 76dac3b: update readme

## 1.0.1

### Patch Changes

- 75de779: Update clibuilder
- 81dc7e2: Update `clibuilder`

## 1.0.0

### Major Changes

- 3835d89: Initial release.

  It is an plugin CLI.
  Commands will be added by other packages.
