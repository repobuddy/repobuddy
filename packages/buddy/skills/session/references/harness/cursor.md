# Cursor: resume in another repo

Cursor has no command that moves a live agent session to another directory. The CLI's slash commands
have no `/cd`. In the editor, each folder opens with its own agent chats. Hand back a fresh session.

## Hand-off

Cursor CLI: give the user this command to run in a terminal, then stop:

```sh
cd <repo-root> && agent "/session resume <slug>"
```

`agent "prompt"` starts the CLI with an initial prompt. `agent --workspace <repo-root> "..."` does the
same without the `cd`.

Cursor editor: tell the user to open `<repo-root>` as a folder (File > Open Folder) and type
`/session resume <slug>` in that window's Agent chat. Typing `/` in Agent chat and picking the skill by
name is how the docs say to invoke a skill.

## Fallback

If `/session resume` isn't recognized, use plain text instead:
`agent "Use the session skill to resume <slug>"`. Cursor loads skills from `.agents/skills/`,
`.cursor/skills/`, `~/.agents/skills/` and `~/.cursor/skills/`, and picks one when the request matches
its description.

## Caveats

- The docs don't say whether `--workspace` loads that repo's rules, AGENTS.md and skills the way starting
  in the directory does. When in doubt, use the `cd` form.
- No minimum version is documented for any of this.
- `/open` in the CLI opens the repository in the Cursor editor. It does not move the CLI session.

## Sources

- CLI slash commands (no `/cd`): https://cursor.com/docs/cli/reference/slash-commands
- CLI overview, `agent "prompt"`: https://cursor.com/docs/cli/overview
- CLI parameters, the prompt argument and `--workspace`: https://cursor.com/docs/cli/reference/parameters
- Skills, load locations and `/` invocation: https://cursor.com/docs/skills
