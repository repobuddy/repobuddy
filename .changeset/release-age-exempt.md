---
"repobuddy": major
---

Rename "lift" to "exempt" in the `min-release-age` skill and the `buddy release-age` command, because "lift" read as
dropping the whole gate when it only exempts one package version for a limited time.

- The command `release-age lift <pkg>` is now `release-age exempt <pkg>`. `lift` still works as an undocumented alias.
- New exemptions are written as `# min-release-age: exempt <spec> until <ISO>`. Old `# min-release-age: lift ...`
  markers are still read, and `restore` still removes them once they expire.
- JSON output changes: `status` reports `exemptions` instead of `lifts`, and each item's `kind` is `exempt` or
  `permanent` instead of `lift` or `permanent`. Each `restore` entry has `exemption` instead of `lift`.
- Text output says "exempted" and "expired exemption(s)" in place of "lifted" and "expired lift(s)".

A cleanup job reads `exempt` markers only when it runs this version or later. The GitHub job that calls the shared
`repobuddy/.github` workflow picks the CLI with its `repobuddy-version` input. Until that input (or the workflow's
default) allows this major, new exemptions are never removed automatically. A job that runs a vendored copy of
`min-release-age.mjs` (GitHub without the app, GitLab, Bitbucket, Azure, Forgejo) needs that copy refreshed: re-run
Setup CI, or copy the new script.
