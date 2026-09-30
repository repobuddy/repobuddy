# Environment and setup (weight 10)

An agent cannot answer a prompt, and cannot guess which toolchain version the repo expects.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `manifest` | 1 | yes | script: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, or `Makefile` |
| `toolchain-pinned` | 3 | yes | script: `packageManager` or `engines.node` in `package.json`, `.nvmrc`, `.node-version`, `.tool-versions`, `mise.toml`, `.python-version`, `rust-toolchain`, `.go-version` |
| `lockfile` | 3 | no | script: a committed lockfile |
| `env-documented` | 3 | no | script: every `process.env.X` and `import.meta.env.X` in non-test JS/TS source is named in an instructions file, a README, CONTRIBUTING, or a `.env.example` |
| `setup-documented` | 3 | yes | **judgment** |

## Judging `setup-documented`

Find the setup steps in the instructions file, README, or CONTRIBUTING. Pass when a fresh clone gets
to a passing verify with the commands written there, in order, and none of them prompts. A build that
must run before tests counts as a setup step, and it must be written down.

Fail when a step is missing (an undocumented build before tests, a required environment variable no
file names), when a step is interactive (a login, a prompt), or when there are no setup steps at all.

## Reading `env-documented`

A name counts as documented when it appears as a whole word in one of those files (READMEs, CONTRIBUTING, and `.env.example` count at any depth). The
script skips names the OS, shell, package manager, CI runner, or bundler sets (`NODE_ENV`, `CI`,
`HOME`, `npm_*`, `GITHUB_*`, Vite's `MODE`). A name read only through a computed key
(`process.env[name]`) is not seen.

A listed variable that the code only reads as an optional override, with a working default, still
fails: an agent cannot tell that it is optional without reading the code. Document it as optional.

## What the script cannot see

- environment variables read outside JS and TS source (shell scripts, Python, CI workflows)
