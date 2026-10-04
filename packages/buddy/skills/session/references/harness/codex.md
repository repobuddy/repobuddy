# Codex CLI: resume in another repo

Recent Codex CLI (0.150.0 or later) can move an idle session to another directory with the built-in
`/cd [path]`. Only the user can type it: it is a slash command, and the agent cannot call it. The command
is in Codex's source and merged pull request, not yet in the published docs.

## Hand-off

Give the user these two lines to type in this session once the current turn has finished, then stop:

```
/cd <repo-root>
$session resume <slug>
```

`/cd` keeps the conversation history. It reloads the destination's project configuration,
instructions, permissions, keybindings, file search and hooks before the session continues there.
`$` followed by a skill name mentions the skill.

## Fallback

When `/cd` is missing (older Codex) or refuses the move, start a fresh session in the repo:

```sh
codex -C <repo-root> '$session resume <slug>'
```

`--cd`/`-C` sets the working directory before the agent starts. The optional prompt starts the session
with that text. Keep the single quotes so the shell doesn't expand `$session`. If the mention
isn't picked up, use plain text instead: `"Use the session skill to resume <slug>"`.

## Caveats

- **The previous repo's conversation stays in context** after `/cd`. Suggest the fresh session when that
  conversation is long or unrelated.
- `/cd` refuses to move when the session has active or queued work, background terminals, a remote
  environment, an untrusted destination or an incompatible permission profile. An untrusted repo
  therefore needs the fresh session.
- `/cd` is in tag `rust-v0.150.0` and later, and not in `rust-v0.149.2`. No release note states a
  minimum version.
- `--add-dir` is not a move. It grants write access to another directory alongside the main workspace,
  and nothing in the docs says it loads that directory's AGENTS.md.

## Sources

- Pull request "Add working-directory commands to the TUI" (merged 2026-08-16):
  https://github.com/openai/codex/pull/38894
- Slash command source (`Cd`: "change the current working directory"):
  https://github.com/openai/codex/blob/rust-v0.150.0/codex-rs/tui/src/slash_command.rs
- CLI reference, `--cd`/`-C`, the prompt argument and `--add-dir`:
  https://learn.chatgpt.com/docs/developer-commands?surface=cli
- Skills, the `$` mention: https://learn.chatgpt.com/docs/build-skills
