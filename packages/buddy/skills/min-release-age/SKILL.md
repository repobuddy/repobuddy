---
name: min-release-age
description: "Fixes an install that fails minimum-release-age, or exempts a package with a scheduled expiry, or restores it."
argument-hint: "[exempt <pkg>[@version|@tag] | restore | setup-ci]"
---

# Minimum Release Age

Manage a repository's minimum-release-age gate: exempt one package version from it, remove the exemption once
the version has aged past the gate, and install a scheduled CI job that removes expired exemptions on its
own. An exemption always schedules its own removal: the first exemption in a repo installs that job in the same
change. Covers pnpm, Yarn Berry, npm, and bun.

## When to use

- An install or CI run fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, `All versions satisfying "…" are quarantined`, or a "no version satisfies min-release-age" error
- The user needs a package release published inside the gate window
- The user asks to restore the gate, clear old exemptions, or automate their cleanup

## Script

All file edits go through the `release-age` command, run from this skill's directory. Never edit the
exemption list by hand.

```bash
node <this-skill-dir>/scripts/repobuddy.mjs release-age status  [--json] [--check]
node <this-skill-dir>/scripts/repobuddy.mjs release-age exempt  <pkg>[@version|@tag] [--name-wide] [--until <ISO>]
node <this-skill-dir>/scripts/repobuddy.mjs release-age restore [--dry-run]
```

It detects the package manager from `packageManager`, then from lockfiles. Pass `--pm pnpm|yarn|npm|bun`
when detection is wrong. Each exemption is written as a marker comment followed by its entry:

```yaml
  # min-release-age: exempt left-pad@1.3.1 until 2026-09-17T11:00:00Z
  - 'left-pad@1.3.1'
```

Entries without a marker are permanent policy. Never add, remove, or rewrite them.

## Choose the mode

| Input | Mode |
|---|---|
| no argument, "status", "what's exempt" | Status |
| `exempt <pkg>`, an age-gate install failure, "let me install X now" | Exempt |
| `restore`, "put the gate back", "clear old exemptions" | Restore |
| `setup-ci`, "restore it automatically", "add a scheduled job" | Setup CI (Exempt also runs it when no job is installed) |

## Status

1. Run `status`. Report the package manager, the gate value, each exemption with its expiry, the git host and CI systems, and whether the cleanup job is installed.
2. If any exemption is expired, offer to run Restore now.
3. If the cleanup job is not installed, ask whether to run Setup CI for the provider `status` names. If there are active exemptions, say they will not be removed until the job exists or someone runs Restore.
4. Change nothing without a yes.

## Exempt

1. **Pick the version.** Default to the bare name, which the script resolves to the `latest` dist-tag. Pass `@<tag>` for another dist-tag, or `@x.y.z` when the failure names a specific version. The script refuses ranges and always writes the exact version it resolved. If the version falls outside the range the repo declares for that dependency, tell the user before exempting.
2. **Check the release before exempting it.** The gate exists to catch compromised releases, so check it by hand:
   - `npm view <pkg>@<version> dist.attestations maintainers time --json`: provenance is present if the package had it before, the publisher is a usual maintainer, and the publish time matches the upstream release or tag.
   - Compare against the previous version (`npm diff --diff=<pkg>@<prev> --diff=<pkg>@<version>`): no new install scripts, no unexpected network, `eval`, or obfuscated code.
   - Report what was checked. If anything looks wrong, stop and tell the user instead of exempting.
3. **Handle npm and bun.** They cannot exempt a single version. Tell the user that the exemption covers **every** version of the package until it expires, and run with `--name-wide` only after they agree.
4. Run `exempt <pkg@version>`. The script sets the expiry to the publish time plus the gate window. After that time the version passes the gate without the exemption.
5. **Schedule the removal.** `exempt` reports `ci`, and its summary ends with a `cleanup job:` line (if they are missing, run `status`). If `ci.installed` is false, run Setup CI now and put the job in the same change as the exemption. This step is required, not an offer: without the job, an expired exemption stays in the config until someone remembers to run Restore. Setup CI still asks before any change outside the repo (step 7 there). If the user declines that part, commit the job anyway, and tell them which outside step is left and that the exemption stays until it is done or they run Restore.
6. Run the install so the lockfile records the version and its integrity hash. Commit the config change with the lockfile, and with the cleanup job from step 5 when it is new.
7. **Keep the reason neutral.** Commit messages and PR text say which package was exempted, not why. If the reason is an undisclosed vulnerability, keep that detail in a private security advisory.

## Restore

1. Run `restore --dry-run` and show what would be removed.
2. Run `restore`. It removes only marked exemptions whose expiry has passed and fails on a marker without its entry. Fix that by hand before re-running.
3. Run the frozen install (`pnpm install --frozen-lockfile`, `yarn install --immutable`, `npm ci`, `bun install --frozen-lockfile`) to confirm the lockfile still resolves.
4. Commit as `chore: restore minimum release age`.

## Setup CI

1. Read `ci` from `status --json` (or from the `exempt --json` result when Exempt sent you here):
   - `host`: the git host, from the `origin` remote
   - `systems`: the CI systems found in the repo
   - `provider`: the one to target
   - `reference`: the file to load for it
   - `script`, `image`: where the job runs the script and, for templates that set one, its runner image. Read from the job when it is installed, otherwise the provider's defaults
2. If `ci.installed` is true, report where the job is and stop.
3. If `provider` does not match what the user expects (for example, the repo is mirrored or several CI systems are present), confirm the target with the user.
4. Every reference copies `scripts/min-release-age.mjs` into the repo, except the GitHub recipe for a repo with the
   `repobuddy` app, which calls a shared workflow instead. If the skill has no
   `scripts/min-release-age.mjs` (the skill was installed from git), take the file from the package instead: run `npm pack repobuddy@2.2.0` in a temp directory,
   extract the tarball, and copy `package/skills/min-release-age/scripts/min-release-age.mjs`.
5. Load **only** the file named in `ci.reference` and follow it:

   | Provider | Reference |
   |---|---|
   | GitHub Actions | `references/ci/github.md` |
   | GitLab CI | `references/ci/gitlab.md` |
   | Bitbucket Pipelines | `references/ci/bitbucket.md` |
   | Azure Pipelines (Azure Repos) | `references/ci/azure.md` |
   | Forgejo / Gitea / Codeberg | `references/ci/forgejo.md` |
   | anything else | `references/ci/other.md` |

6. **Every template** runs on a schedule only (and manual dispatch where the provider has it), touches only marked lines, and opens or updates one change request from `chore/min-release-age-restore`. Never add a trigger that runs on pull requests or other untrusted input.
7. Ask before any step that changes settings outside the repo: creating a schedule, registering a pipeline, or creating a token.

## Anti-patterns

- Setting the gate to `0`, deleting it, or passing `--config.minimumReleaseAge=0` / `--min-release-age=0` to get past a failure
- Adding an unmarked entry, which never expires
- Exempting a whole package name on pnpm or Yarn, where a version pin works
- Exempting without the release check in Exempt step 2
- Finishing an exemption without a cleanup job, or leaving the job for a later change

## References

- pnpm `minimumReleaseAge`: https://pnpm.io/settings#minimumreleaseage
- Yarn `npmMinimalAgeGate`: https://yarnpkg.com/configuration/yarnrc#npmMinimalAgeGate
- npm `min-release-age`: https://github.com/npm/cli/blob/latest/workspaces/config/lib/definitions/definitions.js
- bun `minimumReleaseAge`: https://bun.com/docs/runtime/bunfig#install-minimumreleaseage
- Per-provider Setup CI steps: `references/ci/` (load only the one `status` names)
