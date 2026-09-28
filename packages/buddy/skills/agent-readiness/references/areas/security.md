# Security (gate, not weight)

Security findings cap the level. They never subtract points, and a high score never offsets them.

## Checks

| Id | Caps at | Decided by |
| --- | --- | --- |
| `committed-secrets` | 1 | script: tracked `.env` and `.env.*` (not `.example`, `.sample`, `.template`), `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa`, `id_ed25519`, `credentials.json` |
| `mcp-literal-credentials` | 1 | script: an `env` entry in `.mcp.json`, `.cursor/mcp.json`, or `.vscode/mcp.json` whose key looks like a credential and whose value is not a `${VAR}` reference |
| `env-ignored` | 2 | script: `git check-ignore .env` |

## Re-judging a failure

- A tracked `*.key` or `*.pem` can be a test fixture. Open it: a fixture that says so, or a public key, is a pass. Say which.
- Never print a value. Name the file and the key.
- A real committed secret: the fix is to **rotate it first**. Untracking it or rewriting history does not un-leak it.

## Hand off, don't check

These belong to other skills. Name them in the report when they apply, and offer to run them:

| Concern | Owner |
| --- | --- |
| Harness allowlists (what an agent may run unprompted) | `review-permissions` |
| Branch protection, required CI before merge | `setup-github-repo` |
| Dependency release-age gate | `min-release-age` |
| Long-lived publish tokens | `setup-npm-trusted-publishing` |

## Report only

Session-start hooks and repo-configured MCP servers that pull outside content (issue bodies, fetched
pages) into the agent's context are a prompt-injection surface. Report them if you see them. Don't
block on them.
