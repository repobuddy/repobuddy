# Gemini CLI: resume in another repo

Gemini CLI has no command that moves a live session to another directory. Its built-in commands have
no `/cd`. Hand back a fresh session.

## Hand-off

Give the user this command to run in a terminal, then stop:

```sh
cd <repo-root> && gemini -i "Use the session skill to resume <slug>"
```

`-i`/`--prompt-interactive` runs the prompt and continues in interactive mode. There is no documented
flag that sets the working directory, so `cd` first. Gemini CLI documents no syntax for invoking a skill
directly. The model activates a skill when the request matches it, so the prompt names the skill.

## Fallback

None needed: the fresh session is the only hand-off. If the skill doesn't activate, run `/skills list`
in the new session to check that `session` is installed and enabled.

## Caveats

- `/directory add <path>` (alias `/dir`) is not a move. It adds a directory to the workspace, but the
  project root, instructions and skills stay the launch directory's. `/memory reload` scans an added
  directory's `GEMINI.md` only when `context.loadMemoryFromIncludeDirectories` is `true`, and it is
  `false` by default. `--include-directories` at startup has the same limits.
- No minimum version is documented for any of this.

## Sources

- Commands reference (no `/cd`; `/directory add`): https://geminicli.com/docs/reference/commands/
- CLI reference, `-i`/`--prompt-interactive`, `--include-directories`:
  https://geminicli.com/docs/cli/cli-reference/
- Configuration, `context.loadMemoryFromIncludeDirectories`:
  https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md
- Skills, model activation and `/skills list`: https://geminicli.com/docs/cli/skills/
