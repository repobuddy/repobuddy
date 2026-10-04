# Claude Code: resume in another repo

Claude Code can move a live session to another directory with the built-in `/cd <path>`. Only the
user can run it: it is a built-in command, and the agent cannot call it.

## Hand-off

On Claude Code v2.1.246 or later, give the user these two lines to type in this session, then stop:

```
/cd <repo-root>
/resume-session <slug>
```

`/cd` keeps the conversation and applies the new directory's project configuration as soon as the
session moves. That includes its `CLAUDE.md`, project settings (permission rules and hooks), `.mcp.json`
servers (behind the usual approval prompt), skills, subagents and enabled plugins. The first time a
directory is used, Claude Code asks the user to trust it. If they decline, the session stays where it was.

## Fallback

On a version older than v2.1.246, where `/cd` is missing or doesn't apply the new repo's settings,
skills or hooks until a `--resume`, or when the user wants a clean context, start a fresh session there:

```sh
cd <repo-root> && claude "/resume-session <slug>"
```

`claude "query"` starts an interactive session with that initial prompt.

## Caveats

- **The previous repo's conversation stays in context.** It costs tokens, and it can pull the resumed
  work toward the old repo's conventions. Suggest the fresh session when that conversation is long or
  unrelated.
- `/cd` has been available since v2.1.169. Before v2.1.246 it loaded the new `CLAUDE.md` but applied the
  new directory's settings, hooks, MCP servers and skills only after a `--resume`.
- A `Cd` deny rule in the permissions disables `/cd`, and `Cd` allow rules restrict it to the paths they
  list. If `/cd` is refused, use the fallback.
- Directories added with `--add-dir` or `/add-dir` stay added after the move. Hooks still see
  `${CLAUDE_PROJECT_DIR}` set to the directory the session started in.
- `/add-dir` is not a substitute. It grants file access to another directory, but most of that
  directory's `.claude/` configuration is not loaded.

## Sources

- Commands reference, `/cd` and `/add-dir`: https://code.claude.com/docs/en/commands
- Permissions, "Move the session to another directory" and the `Cd` rules:
  https://code.claude.com/docs/en/permissions#move-the-session-to-another-directory
- CLI reference, `claude "query"`: https://code.claude.com/docs/en/cli-reference
- CHANGELOG: v2.1.169 ("Added `/cd` command to move a session to a new working directory"), v2.1.246
  ("the new directory's project settings, hooks, `.mcp.json` servers …, skills, and agents now take
  effect right after the move instead of on `--resume`"):
  https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
