---
"repobuddy": minor
---

Skills now run CLIs through a committed forwarding script, `scripts/<bin>.mjs`, written by `universal-plugin plugin build`.
`agent-readiness`, `init-buddy`, `min-release-age`, `setup-github-repo`, and `setup-npm-trusted-publishing` run
`node <skill-dir>/scripts/repobuddy.mjs <command>`. The forwarder runs the CLI of the `repobuddy` package it sits in,
or `npx -y repobuddy@<version>` when there is none. A skill installed from git now has the script it needs, with no
separate fallback step. The pinned `cyber-aced`, `cyber-agentkit`, and `cyber-skills` calls run through forwarders too.

The per-command bundles `detect-env.mjs`, `detect-state.mjs`, `scaffold-workflows.mjs`, `npm-trust.mjs`, and
`agent-readiness.mjs` are no longer shipped. Run `repobuddy <command>` for each of them instead.
`min-release-age.mjs` and the `gh-api-guard.mjs` hook still ship.
