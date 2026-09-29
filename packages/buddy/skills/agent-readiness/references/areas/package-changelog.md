# Changelog (package, weight 15)

An agent upgrading a dependency reads the changelog to learn what broke. It can only do that cheaply
when the file has a shape it can parse and breaking changes are labelled.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `changelog` | 4 | yes | script: `CHANGELOG.md` in the package folder with a `## <version>` heading per release |
| `breaking-labelled` | 4 | yes | script: every release whose major is above the one after it has "Major Changes" or "BREAKING" in its section |

Headings may be `## 1.2.3`, `## v1.2.3`, or `## [1.2.3] - <date>`. Releases are read newest first.

## Re-judging

A changelog that lives on a releases page instead of in the package fails `changelog`: a consumer's
agent reading `node_modules` cannot see it. Say where it lives. A `0.x` minor that breaks is not
flagged, since the script only compares majors; mention it if you see one.

Fixes go to `init-changesets` (repobuddy/agent-changesets), which writes a changelog per package with
breaking changes under "Major Changes".
