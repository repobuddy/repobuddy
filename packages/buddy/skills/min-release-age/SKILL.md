---
name: min-release-age
description: "Use this skill when an install fails minimum-release-age, or to lift, restore, or auto-expire a package exemption."
argument-hint: "[lift <pkg>[@version|@tag] | restore | setup-ci]"
---

# Minimum Release Age

Manage a repository's minimum-release-age gate: lift it for one package version, remove the lift once
the version has aged past the gate, and install a scheduled CI job that removes expired lifts on its
own. Covers pnpm, Yarn Berry, npm, and bun.

## When to use

- An install or CI run fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, `All versions satisfying "…" are quarantined`, or a "no version satisfies min-release-age" error
- The user needs a package release published inside the gate window
- The user asks to restore the gate, clear old exemptions, or automate their cleanup

## Script

All file edits go through `scripts/min-release-age.mjs` in this skill's directory. Never edit the
exemption list by hand.

```bash
node <this-skill-dir>/scripts/min-release-age.mjs status  [--json] [--check]
node <this-skill-dir>/scripts/min-release-age.mjs lift    <pkg>[@version|@tag] [--name-wide] [--until <ISO>]
node <this-skill-dir>/scripts/min-release-age.mjs restore [--dry-run]
```

The script ships in the `repobuddy` npm package. If `scripts/min-release-age.mjs` is missing (the skill
was installed from git) or cannot be run, use `npx -y repobuddy@^1.8.0 release-age <command>` with the
same arguments.

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
| `lift <pkg>`, an age-gate install failure, "let me install X now" | Lift |
| `restore`, "put the gate back", "clear old exemptions" | Restore |
| `setup-ci`, "restore it automatically", "add a scheduled job" | Setup CI |

## Status

1. Run `status`. Report the package manager, the gate value, each lift with its expiry, the git host and CI systems, and whether the cleanup job is installed.
2. If any lift is expired, offer to run Restore now.
3. If the cleanup job is not installed, ask whether to run Setup CI for the provider `status` names.
4. Change nothing without a yes.

## Lift

1. **Pick the version.** Default to the bare name, which the script resolves to the `latest` dist-tag. Pass `@<tag>` for another dist-tag, or `@x.y.z` when the failure names a specific version. The script refuses ranges and always writes the exact version it resolved. If the version falls outside the range the repo declares for that dependency, tell the user before lifting.
2. **Check the release before exempting it.** The gate exists to catch compromised releases, so check it by hand:
   - `npm view <pkg>@<version> dist.attestations maintainers time --json`: provenance is present if the package had it before, the publisher is a usual maintainer, and the publish time matches the upstream release or tag.
   - Compare against the previous version (`npm diff --diff=<pkg>@<prev> --diff=<pkg>@<version>`): no new install scripts, no unexpected network, `eval`, or obfuscated code.
   - Report what was checked. If anything looks wrong, stop and tell the user instead of lifting.
3. **Handle npm and bun.** They cannot exempt a single version. Tell the user that the lift exempts **every** version of the package until it expires, and run with `--name-wide` only after they agree.
4. Run `lift <pkg@version>`. The script sets the expiry to the publish time plus the gate window. After that time the version passes the gate without the exemption.
5. Run the install so the lockfile records the version and its integrity hash. Commit the config change with the lockfile.
6. **Keep the reason neutral.** Commit messages and PR text say which package was lifted, not why. If the reason is an undisclosed vulnerability, keep that detail in a private security advisory.
7. If `status` shows no cleanup job (`ci.installed` is false), offer Setup CI. Without it, tell the user to run Restore after the expiry.

## Restore

1. Run `restore --dry-run` and show what would be removed.
2. Run `restore`. It removes only marked lifts whose expiry has passed and fails on a marker without its entry. Fix that by hand before re-running.
3. Run the frozen install (`pnpm install --frozen-lockfile`, `yarn install --immutable`, `npm ci`, `bun install --frozen-lockfile`) to confirm the lockfile still resolves.
4. Commit as `chore: restore minimum release age`.

## Setup CI

1. Run `status --json` and read `ci`:
   - `host`: the git host, from the `origin` remote
   - `systems`: the CI systems found in the repo
   - `provider`: the one to target
   - `reference`: the file to load for it
2. If `ci.installed` is true, report where the job is and stop.
3. If `provider` does not match what the user expects (for example, the repo is mirrored or several CI systems are present), confirm the target with the user.
4. Every reference copies `scripts/min-release-age.mjs` into the repo. If the skill has no `scripts/`
   folder, take the file from the package instead: run `npm pack repobuddy@^1.8.0` in a temp directory,
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
- Lifting without the release check in Lift step 2

## References

- pnpm `minimumReleaseAge`: https://pnpm.io/settings#minimumreleaseage
- Yarn `npmMinimalAgeGate`: https://yarnpkg.com/configuration/yarnrc#npmMinimalAgeGate
- npm `min-release-age`: https://github.com/npm/cli/blob/latest/workspaces/config/lib/definitions/definitions.js
- bun `minimumReleaseAge`: https://bun.com/docs/runtime/bunfig#install-minimumreleaseage
- Per-provider Setup CI steps: `references/ci/` (load only the one `status` names)
