---
"repobuddy": minor
---

`init-buddy` now proposes a deny list beside the allow list. It covers force push in every common form, `gh pr merge --admin`, `gh repo delete`, `gh api` DELETE requests, `rm -rf` and its variants, package publish, and reading secrets (`.env*`, `~/.ssh`, `~/.aws`, `~/.npmrc`, `gh`'s `hosts.yml`). The user picks groups or single entries, and the skill only appends: it never removes or loosens an existing deny entry. The skill says what deny rules cannot do: they match text, so a reworded command gets past them; `Read(...)` denies do not stop a script from reading the file; deny beats allow; and in `dontAsk` mode and headless runs, anything that would prompt is denied.
