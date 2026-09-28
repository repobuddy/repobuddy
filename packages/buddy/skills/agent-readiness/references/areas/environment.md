# Environment and setup (weight 10)

An agent cannot answer a prompt, and cannot guess which toolchain version the repo expects.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `manifest` | 1 | yes | script: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, or `Makefile` |
| `toolchain-pinned` | 3 | yes | script: `packageManager` or `engines.node` in `package.json`, `.nvmrc`, `.node-version`, `.tool-versions`, `mise.toml`, `.python-version`, `rust-toolchain`, `.go-version` |
| `lockfile` | 3 | no | script: a committed lockfile |
| `setup-documented` | 3 | yes | **judgment** |

## Judging `setup-documented`

Find the setup steps in the instructions file, README, or CONTRIBUTING. Pass when a fresh clone gets
to a passing verify with the commands written there, in order, and none of them prompts. A build that
must run before tests counts as a setup step, and it must be written down.

Fail when a step is missing (an undocumented build before tests, a required environment variable no
file names), when a step is interactive (a login, a prompt), or when there are no setup steps at all.

## What the script cannot see

- environment variables the code reads that no file documents
