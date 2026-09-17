---
name: min-release-age
description: "Use this skill when an install fails minimum-release-age, or to lift, restore, or auto-expire a package exemption."
argument-hint: "[lift <pkg@version> | restore | setup-ci]"
---

# Minimum Release Age

Manage a repository's minimum-release-age gate: lift it for one package version, remove the lift once
the version has aged past the gate, and install a scheduled workflow that removes expired lifts on its
own. Covers pnpm, Yarn Berry, npm, and bun.

## When to use

- An install or CI run fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, `All versions satisfying "…" are quarantined`, or a "no version satisfies min-release-age" error
- The user needs a package release published inside the gate window
- The user asks to restore the gate, clear old exemptions, or automate their cleanup

## Script

All file edits go through `scripts/min-release-age.mjs` in this skill's directory. Never edit the
exemption list by hand.

```bash
node <this-skill-dir>/scripts/min-release-age.mjs status  [--json]
node <this-skill-dir>/scripts/min-release-age.mjs lift    <pkg@version> [--name-wide] [--until <ISO>]
node <this-skill-dir>/scripts/min-release-age.mjs restore [--dry-run]
```

It detects the package manager from `packageManager`, then from lockfiles. Pass `--pm pnpm|yarn|npm|bun`
when detection is wrong. Each lift is written as a marker comment followed by its entry:

```yaml
  # min-release-age: lift left-pad@1.3.1 until 2026-09-17T11:00:00Z
  - 'left-pad@1.3.1'
```

Entries without a marker are permanent policy. Never add, remove, or rewrite them.

## Choose the mode

| Input | Mode |
|---|---|
| no argument, "status", "what's exempt" | Status |
| `lift <pkg@version>`, an age-gate install failure, "let me install X now" | Lift |
| `restore`, "put the gate back", "clear old exemptions" | Restore |
| `setup-ci`, "restore it automatically" | Setup CI |

## Status

1. Run `status`. Report the package manager, the gate value, each lift with its expiry, and whether the cleanup workflow is installed.
2. If any lift is expired, offer to run Restore now.
3. If the workflow is not installed and the repo is on GitHub, ask whether to run Setup CI.
4. Change nothing without a yes.

## Lift

1. **Pin an exact version.** Resolve a range to the one version needed (`npm view <pkg>@<range> version`). Refuse to lift a range or a bare name.
2. **Check the release before exempting it.** The gate exists to catch compromised releases, so check it by hand:
   - `npm view <pkg>@<version> dist.attestations maintainers time --json`: provenance is present if the package had it before, the publisher is a usual maintainer, and the publish time matches the upstream release or tag.
   - Compare against the previous version (`npm diff --diff=<pkg>@<prev> --diff=<pkg>@<version>`): no new install scripts, no unexpected network, `eval`, or obfuscated code.
   - Report what was checked. If anything looks wrong, stop and tell the user instead of lifting.
3. **Handle npm and bun.** They cannot exempt a single version. Tell the user that the lift exempts **every** version of the package until it expires, and run with `--name-wide` only after they agree.
4. Run `lift <pkg@version>`. The script sets the expiry to the publish time plus the gate window. After that time the version passes the gate without the exemption.
5. Run the install so the lockfile records the version and its integrity hash. Commit the config change with the lockfile.
6. **Keep the reason neutral.** Commit messages and PR text say which package was lifted, not why. If the reason is an undisclosed vulnerability, keep that detail in a private security advisory.
7. If the cleanup workflow is not installed, offer Setup CI. Without it, tell the user to run Restore after the expiry.

## Restore

1. Run `restore --dry-run` and show what would be removed.
2. Run `restore`. It removes only marked lifts whose expiry has passed and fails on a marker without its entry. Fix that by hand before re-running.
3. Run the frozen install (`pnpm install --frozen-lockfile`, `yarn install --immutable`, `npm ci`, `bun install --frozen-lockfile`) to confirm the lockfile still resolves.
4. Commit as `chore: restore minimum release age`.

## Setup CI

GitHub only. On other platforms, tell the user to schedule `restore` in their CI and stop.

1. Copy `scripts/min-release-age.mjs` to `.github/scripts/min-release-age.mjs`.
2. Copy `assets/min-release-age.yml` to `.github/workflows/min-release-age.yml`.
3. Tell the user that a PR opened with `GITHUB_TOKEN` does not trigger CI. Required checks will not run on the restore PR unless they add a `MIN_RELEASE_AGE_TOKEN` secret (a GitHub App token or a fine-grained PAT with contents and pull-requests write access).
4. Commit as `ci: expire minimum-release-age lifts automatically`.

The workflow runs daily on `schedule` and `workflow_dispatch` only. Never add `pull_request_target` or any trigger that runs on untrusted input.

## Anti-patterns

- Setting the gate to `0`, deleting it, or passing `--config.minimumReleaseAge=0` / `--min-release-age=0` to get past a failure
- Adding an unmarked entry, which never expires
- Exempting a whole package name on pnpm or Yarn, where a version pin works
- Lifting without the release check in Lift step 2

## References

- pnpm `minimumReleaseAge`: https://pnpm.io/settings#minimumreleaseage
- Yarn `npmMinimalAgeGate`: https://yarnpkg.com/configuration/yarnrc#npmMinimalAgeGate
- npm `min-release-age`: https://github.com/npm/cli/blob/latest/workspaces/config/lib/definitions/definitions.js
- bun `minimumReleaseAge`: https://bun.com/docs/runtime/bunfig#install-minimumreleaseage
