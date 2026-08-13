---
name: setup-npm-trusted-publishing
description: Use this skill when configuring npm trusted publishing (OIDC) for a package, an org, or every org you own.
---

# Setup npm Trusted Publishing

Configure npm trusted publishers so GitHub Actions publishes via OIDC and `NPM_TOKEN` can be retired. Apply when a release pipeline authenticates with a long-lived npm token, or when a token has expired and broken publishing.

## When to use

- A release workflow publishes with `NPM_TOKEN` and you want to remove the token
- Publishing fails with `E401 Unauthorized - GET .../-/whoami` (expired token)
- Rolling OIDC across many packages at once
- Repos live under a personal namespace, where there is no org-level secret scope and every repo needs its own token copy

Not for: adding OIDC support to a release workflow file, or configuring GitHub-side permissions. Do those first — this skill only registers the npm-side trust.

## Prerequisites

| Requirement | Check |
| --- | --- |
| npm >= 11.15.0 | `npm --version` |
| Logged in to npm | `npm whoami` |
| Account-level 2FA | required; granular tokens that bypass 2FA are rejected |
| `gh` authenticated | `gh auth status` |
| Workflow already declares `id-token: write` | on the publishing job |
| Package already exists on the registry | trust cannot be pre-registered |

## Step 1 — Choose scope

Ask the user which applies; do not assume.

| Scope | Flags |
| --- | --- |
| One package | `--package <name> --repo <owner/name>` |
| One repo, all its packages | `--repo <owner/name>` |
| One organization or user | `--org <login>` |
| Every org plus the user's own repos | `--all-orgs` |

`--org` and `--all-orgs` cover source repos only; forks belong to someone else to publish.

## Step 2 — Plan

```bash
node_major=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
SKILL_DIR=$(npx skills path setup-npm-trusted-publishing 2>/dev/null || echo "$HOME/.agents/skills/setup-npm-trusted-publishing")
RUN="npx tsx"; [ "$node_major" -ge 23 ] && RUN=node
$RUN "$SKILL_DIR/scripts/npm-trust.mts" plan --org <login> --verbose
```

Writes `.github/npm-trust-plan.json` and prints a JSON ack. **Do not parse stdout for the plan** — read the artifact:

```bash
jq '[.rows[] | select(.action == "configure")] | length' .github/npm-trust-plan.json
jq -r '.rows[] | "\(.action)\t\(.package)\t\(.repo)/\(.workflow)"' .github/npm-trust-plan.json
```

Row actions: `configure`, `already-configured`, `not-published`, `private`.

## Step 3 — Review the plan before applying

Check each against the user's intent:

- **Package count exceeds repo count** — expected. Trust is per package name, so a monorepo publishing four packages needs four rows.
- **`workflow` names the caller** — npm validates the entry-point workflow (`release.yml`), never the reusable workflow it delegates to. A row naming a reusable workflow will authenticate and then be rejected at publish time.
- **`not-published` rows** — the package must exist on the registry first. Drop them or publish once with a token.
- **`private` rows** — repo publishes nothing; confirm that matches expectation rather than a mis-detected workspace layout.

Show the user the `configure` rows and confirm before applying.

## Step 4 — Apply

Applying needs a 2FA code. One success opens a window of roughly five minutes / eighty packages, so a batch runs under a single authentication.

```bash
$RUN "$SKILL_DIR/scripts/npm-trust.mts" apply --otp=<6-digit code> --verbose
```

The script stops on the first `EOTP`/`E401`/`E403` rather than repeating an auth failure across the list. On `EOTP`, get a fresh code and re-run — completed rows are skipped.

### `E409` is not a failure

`npm trust github` POSTs to `/-/package/<name>/trust`, so **`E409` means a trusted publisher already exists for that package** — the desired end state. The script reports these as `EXISTS` and counts them in `alreadyConfigured`, not `failed`.

`plan` cannot pre-detect this and will always say `configure`: reading the current config needs `npm trust list`, which requires an OTP, and `plan` deliberately takes none. So a partly-configured set surfaces as a burst of `E409`s on the first apply. Expect it; do not treat it as broken.

What it does *not* tell you is whether the existing entry matches what you intended. A publisher pointing at a different repo or workflow filename still returns `E409`, and the mismatch only appears at publish time as an auth failure. Verify before trusting it:

```bash
npm trust list <package> --otp=<6-digit code>
```

To repoint an existing entry, revoke first — registering does not update in place:

```bash
npm trust revoke <package> --id=<trust-id> --otp=<code>
```

If npm answers with a browser URL rather than accepting `--otp`, the account uses web-based 2FA. Run one `npm trust github …` directly in an interactive terminal, authenticate in the browser to open the window, then re-run apply.

## Step 5 — Verify

```bash
npm trust list <package>
```

Confirm repository, workflow filename, and `publish` permission. Then confirm the next release publishes without `NPM_TOKEN` before deleting any secret.

## Step 6 — Retire the token (separate, deliberate)

Only after a release has published through OIDC:

1. Delete `NPM_TOKEN` from repo secrets (`gh secret delete NPM_TOKEN --repo <owner/name>`).
2. Optionally set **Require two-factor authentication and disallow tokens** in the package's Publishing access settings.

Step 2 is a one-way narrowing that breaks every remaining token-based publish for that package. Never bundle it with Step 4.

## Anti-patterns

- Passing `--otp <code>` with a space — `npm trust github` takes a positional package name and consumes the value, failing with `Unknown positional argument`. Use `--otp=<code>`.
- Using the reusable workflow filename in `--file` instead of the caller.
- Treating trust as per repo — it is per package name, one config per package.
- Re-running against a package that already has a publisher; that errors rather than updating. Use `npm trust revoke <pkg> --id=<trust-id>` first.
- Enabling "disallow tokens" in the same pass as registering trust, before any OIDC publish has succeeded.
- Bulk-applying without fail-fast, spending one 2FA code per package on an auth fault that affects all of them.
- Assuming registering trust disables token publishing. It is additive; both work until tokens are explicitly disallowed.

## References

- `npx cyber-skills governance show agent-tool-output` — stdout/stderr contract for the bundled script
- https://docs.npmjs.com/trusted-publishers/ — trusted publisher concepts and web UI equivalent
- https://docs.npmjs.com/cli/v11/commands/npm-trust/ — `npm trust` subcommands and flags
