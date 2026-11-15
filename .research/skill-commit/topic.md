# skill-commit (November 2026)

## Question
Is the repobuddy `commit` skill a real job, feasible on Claude Code, Codex, Cursor, and Copilot CLI, and how does prior art compare? Adopt, extend, or build.

## Scope
In: the commit skill's Intent, four harnesses, commit skills from `npx skills find commit` and the installed list. Out: pushing, PRs, amend, commit-message style rules (owned by `commit.message`).

## Source angles
- Guidance: git docs, Conventional Commits.
- Harness docs: Claude Code, Codex, Cursor, Copilot.
- Prior-art skill sources: commit-work (local), skills.sh listings and raw SKILL.md.

## Findings
See `conclusion.md`; claims are E1-E16 in `evidence.md`.

## Contradictions
- Cursor TTY requirement (E7).

## Open questions
- Does `git add` work under Codex workspace-write with a read-only `.git`?
- Hook behavior on Codex, Cursor, Copilot CLI.
- Contents of the unread skills in the search listing.

## Sources consulted
- https://git-scm.com/docs/SubmittingPatches
- https://www.conventionalcommits.org/en/v1.0.0/
- https://code.claude.com/docs/en/hooks , https://code.claude.com/docs/en/tools-reference
- https://learn.chatgpt.com/docs/build-skills , https://learn.chatgpt.com/docs/agent-approvals-security
- https://cursor.com/docs/context/skills
- https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
- `npx skills find commit` output (2026-11-15); skills.sh listings and raw SKILL.md files named in evidence.md
- Local: commit-work plugin cache, repobuddy commit SKILL.md
