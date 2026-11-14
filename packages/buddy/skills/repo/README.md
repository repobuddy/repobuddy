# repo

Set up how agents work in a repository. `enhance` checks the repository's instructions for each vetted
section, offers what is missing or stale one at a time, and writes only what you approve.

`repo` covers rules every agent working in a repository follows. Rules about how one agent works in
any repository, such as delegation, belong to
[buddy-agent-harness](https://github.com/repobuddy/buddy-agent-harness)'s `enhance`, whose design
this one follows.

## When to use

- "set up auto-commit", "make agents commit each unit of work"
- "what is this repo's AGENTS.md missing"
- "refresh the Commit Discipline section", after it was written by cyberplace's `init-commit-discipline`

## Usage

```
/repo enhance [--root <dir>]
/repo help
```

A bare `/repo` shows the help.

## `enhance`

One section ships today:

| Section | What it tells agents | Recommended home |
| --- | --- | --- |
| Commit Discipline | Commit each finished unit of work without waiting to be asked, with the `commit` skill | the repository's `AGENTS.md` |

For each section, `enhance`:

1. Reads the root `AGENTS.md` and any harness file that still holds instructions of its own
   (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, and others), and judges them
   together, by meaning, not heading. A repository that says "commit only when asked" is covered: it
   has decided.
2. Checks your own global instructions. If they already carry the text, it offers nothing and says
   a repository copy would only add the team.
3. Asks where a present section came from, with `prose-update` from `cyber-agentkit`: written by
   this skill (current), from a retired wording (offer the current text as a replacement), or yours
   (leave it alone). A `## Commit Discipline` section that cyberplace's `init-commit-discipline`
   wrote is a retired wording.
4. Offers the text verbatim, with where it should go. The repository's `AGENTS.md` reaches everyone
   who clones it and any agent CI runs. Your global `~/.agents/AGENTS.md` reaches every repository
   you open, and only you. For the global file it hands the text over instead of writing it, and
   says whether your harness loads that file.
5. Writes only what you approve, into the root `AGENTS.md`, and reports what it found either way.

It never writes a nested `AGENTS.md`, a harness file, or a file outside the repository, and it never
edits a section's wording to fit the repository. Your repository's commit types and checks stay in
your own paragraphs and in the `commit` skill's references.

## Install

```sh
npx skills add repobuddy/repobuddy --skill repo
```

The Commit Discipline section points at the `commit` skill: install it too
(`--skill commit`).
