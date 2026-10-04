# GitHub Copilot CLI: resume in another repo

Copilot CLI can change a live session's working directory with the built-in `/cd [PATH]` (an alias
of `/cwd`). Only the user can type it: it is a slash command, and the agent cannot call it. The docs
don't say whether the move reloads the new repo's custom instructions and skills, so the user should
check before resuming.

## Hand-off

Give the user these lines to type in this session, then stop:

```
/cd <repo-root>
/env
/session resume <slug>
```

`/env` lists the instructions and skills that are loaded. If they still come from the previous repo,
`/skills reload` reloads the skills, but there is no documented reload for the instructions, so use the
fallback.

## Fallback

Start a fresh session in the repo:

```sh
copilot -C <repo-root> -i "/session resume <slug>"
```

`-C DIRECTORY` changes the working directory before doing anything else. `-i PROMPT` starts an interactive
session and runs the prompt. To invoke a skill, the docs say to include its name, preceded by a forward
slash, in the prompt.

## Caveats

- **The previous repo's conversation stays in context** after `/cd`. Suggest the fresh session when that
  conversation is long or unrelated.
- Documented `/cd` behavior: each session keeps its own working directory (1.0.11). The working
  directory persists across a resume, and custom agents are discovered in the new directory (1.0.65).
  Command approvals don't carry over to another repository, and hooks run in the new directory (1.0.72).
  Declining folder trust keeps the session in the previous folder (1.0.81). Nothing documented says
  AGENTS.md, `.github/copilot-instructions.md` or skills are re-read on `/cd`.
- `/cd` was added in 0.0.384, as an alias for `/cwd`.
- `/add-dir PATH` is not a move. It allows file access to the directory and loads its `.github/skills`
  and `.github/agents`, but the session's working directory and instructions stay where they were.

## Sources

- Command reference, `/cwd`/`/cd`, `/add-dir`, `/env`, `/skills reload`, `-C`, `-i`:
  https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference
- Invoking a skill by name in the prompt:
  https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills
- Changelog, 0.0.384, 1.0.11, 1.0.65, 1.0.72, 1.0.81:
  https://github.com/github/copilot-cli/blob/main/changelog.md
