# The global instruction file

`~/.agents/AGENTS.md` is the user-scope counterpart of a repository's root `AGENTS.md`: instructions
that hold in every repository one person opens. No harness reads it by itself. Each reads a
user-scope file of its own, and that file has to load the global one.

| Harness | User-scope file | What loads `~/.agents/AGENTS.md` |
| --- | --- | --- |
| Claude Code | `~/.claude/CLAUDE.md` | the line `@~/.agents/AGENTS.md` in that file, or the file is a symlink to it |
| Codex | `~/.codex/AGENTS.md` | `ln -s ~/.agents/AGENTS.md ~/.codex/AGENTS.md` |
| Copilot CLI | `~/.copilot/copilot-instructions.md` | `ln -s ~/.agents/AGENTS.md ~/.copilot/copilot-instructions.md` |
| Gemini CLI | `~/.gemini/GEMINI.md` | `ln -s ~/.agents/AGENTS.md ~/.gemini/GEMINI.md` |

Cursor keeps its user rules in a settings panel, not a file: hand over the text to paste there.

A variable can move a harness's folder: `CLAUDE_CONFIG_DIR` for Claude Code, `CODEX_HOME` for Codex,
`COPILOT_HOME` for Copilot CLI. Where one is set and not empty, name the file under it.

## Say whether the harness in use loads it

Where `buddy-agent-harness` is installed, its `doctor` command checks this and is the authority: read
the `globalInstructions` row for the harness in use, and hand over the step it gives.

Otherwise read the user-scope file the table names, and say one of:

- it loads `~/.agents/AGENTS.md`: the import line is there, or the file is a symlink to it;
- the file is missing: the text would reach no session of this harness until the step in the table
  is taken;
- the file has content of its own and does not load the global file: the same, and where the step
  is a symlink, what the file holds moves into `~/.agents/AGENTS.md` first or it is lost.

Hand the step over; never take it. Every file here is outside the repository.

Source: the `global-instructions` reference of
[buddy-agent-harness](https://github.com/repobuddy/buddy-agent-harness) 1.0.1, which `doctor` implements.
