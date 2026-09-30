# Security (gate, not weight)

Security findings cap the level. They never subtract points, and a high score never offsets them.

## Checks

| Id | Caps at | Decided by |
| --- | --- | --- |
| `committed-secrets` | 1 | script: tracked `.env` and `.env.*` (not `.example`, `.sample`, `.template`), `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa`, `id_ed25519`, `credentials.json` |
| `mcp-literal-credentials` | 1 | script: an `env` entry in `.mcp.json`, `.cursor/mcp.json`, or `.vscode/mcp.json` whose key looks like a credential and whose value is not a `${VAR}` reference |
| `env-ignored` | 2 | script: `git check-ignore .env` |

## Report-only checks

These are security checks, but not gates: a failure is listed and ranked, and never caps the level.
Each hands its fix to the skill that owns it.

| Id | Decided by | Owner |
| --- | --- | --- |
| `pinned-actions` | script: every `uses:` in `.github/workflows/*.yml` is a local path, a GitHub-owned action (`actions/*`, `github/*`), or pinned to a 40-character commit SHA (`docker://` needs an `@sha256:` digest). Reusable workflows count. | `setup-github-repo` |
| `workflow-permissions` | script: each workflow declares a top-level `permissions:`, or every job under `jobs:` declares its own | `setup-github-repo` |
| `release-age-gate` | script: the detected package manager's setting is present and above zero: pnpm `minimumReleaseAge` in `pnpm-workspace.yaml`, Yarn `npmMinimalAgeGate` in `.yarnrc.yml`, npm `min-release-age` in `.npmrc`, bun `minimumReleaseAge` in `bunfig.toml`. `n/a` without a JavaScript package manager. | `min-release-age` |

The workflow checks read lines, not parsed YAML. A workflow built with anchors or flow-style mappings
can be misread: open the file before handing off a failure. An absent release-age setting fails even
where the package manager has a default (pnpm 11+ and Yarn 4.10+ default to a day), because the gate
then depends on which version runs the install.

## Re-judging a failure

- A tracked `*.key` or `*.pem` can be a test fixture. Open it: a fixture that says so, or a public key, is a pass. Say which.
- Never print a value. Name the file and the key.
- A real committed secret: the fix is to **rotate it first**. Untracking it or rewriting history does not un-leak it.

## Hand off, don't check

These belong to other skills. Name them in the report when they apply, and offer to run them:

| Concern | Owner |
| --- | --- |
| Harness allowlists (what an agent may run unprompted) | `review-permissions` |
| Branch protection, required CI before merge (needs the GitHub API) | `setup-github-repo` |
| Long-lived publish tokens | `setup-npm-trusted-publishing` |

## Report only

Hooks that run at session start or on each prompt, and repo-configured MCP servers, can pull outside
content (issue bodies, fetched pages) into the agent's context: a prompt-injection surface. The script
lists them in `injectionSurface`, and never scores them:

- `hooks`: `SessionStart`/`UserPromptSubmit` (Claude Code, `.claude/settings*.json`), `SessionStart`/`BeforeAgent`
  (Gemini CLI, `.gemini/settings.json`), `sessionStart`/`beforeSubmitPrompt` (Cursor, `.cursor/hooks.json`),
  and `sessionStart`/`userPromptSubmitted` (Copilot, `.github/hooks/*.json`), each with its command
- `mcpServers`: every server in `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json`, with its command or URL

Judge each one: read the command or script, or what the server serves. Name in the report the ones that
fetch untrusted content, and what they fetch. A hook that prints a local file is not a surface. Don't
block on them, and don't lower the level.
