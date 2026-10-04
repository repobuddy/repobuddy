---
"repobuddy": minor
---

`init-buddy` now offers a starting allow list once the git host CLI is ready. It proposes entries for Claude Code, Cursor CLI, or Codex CLI in three tiers: safe read-only commands (git inspection, the host CLI's read commands, the repo's test and lint scripts), local writes that git can undo (`git add`, `git commit`, format scripts), and remote or destructive commands it never proposes (`git push`, `gh pr merge`, `gh api`, `npx`). The user picks the entries and the scope (user, project shared, or project local). The skill shows the diff and writes only the approved entries. It never removes an existing entry or deny rule. Auditing an existing allow list stays with `review-permissions`.
