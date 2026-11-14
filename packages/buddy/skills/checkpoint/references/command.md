# The command the user types

Every line this skill hands the user to run it again, such as the resume line at the end of `create`, names
the skill the way the current harness invokes it. The reference files write that name as `<command>`.
Never hand back a bare `/checkpoint` in Claude Code: there it is an alias of the built-in `/rewind`, and a
skill does not replace a built-in's alias.

## Where the skill came from

The skill came from the repobuddy plugin when the directory two levels above this skill's `SKILL.md` (the
plugin root) holds a `plugin.json`, or a `.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/` or
`.plugin/` folder. The Skills CLI copies only the skill's own folder, so a skill it installed has none of
these. If you can't tell where the skill's files are, use the fallback.

## `<command>` per harness

| Harness | From the repobuddy plugin | Installed by the Skills CLI |
| --- | --- | --- |
| Claude Code | `/repobuddy:checkpoint` (pnpm install: `pnpm-repobuddy-checkpoint`) | the fallback |
| Codex CLI | `$repobuddy:checkpoint` | `$checkpoint` |
| Copilot CLI | the fallback | `/checkpoint` |
| Cursor editor | the fallback | `/checkpoint` |
| Cursor CLI | the fallback | the fallback |
| Gemini CLI | not a plugin harness | the fallback |
| Any other | the fallback | the fallback |

**Fallback.** Where the form is unknown, give plain text that names the skill instead of a command:
`Use the checkpoint skill to <subcommand> <arguments>`, for example
`Use the checkpoint skill to resume flaky-login-test`. Every harness picks a skill when the request names
it or matches its description.

- **Claude Code, Skills CLI.** A skill named `checkpoint` loads as `/checkpoint`, but that name is already
  the alias of `/rewind`, and the alias keeps running the built-in.
- **Codex CLI, plugin.** Codex prefixes a plugin's skills with the plugin name. The published docs don't
  show the mention form. Codex's own tests use `$<plugin>:<skill>`.
- **Copilot CLI and Cursor, plugin.** Neither documents whether a plugin's skills are namespaced, so the
  form is unconfirmed.
- **Cursor CLI.** The docs describe `/` skill invocation only in the editor's Agent chat.

## Sources

- Claude Code, plugin skills "as `/plugin-name:skill-name`", and "your skill replaces the built-in
  command, but not its aliases": https://code.claude.com/docs/en/skills
- Claude Code, `/rewind` "Aliases: `/checkpoint`, `/undo`": https://code.claude.com/docs/en/commands
- Codex, `$` mentions a skill: https://learn.chatgpt.com/docs/build-skills
- Codex, "a skill named `search` beneath a plugin named `sample` is exposed as `sample:search`":
  https://github.com/openai/codex/blob/b1573f10/codex-rs/ext/skills/src/loader/namespace.rs
- Codex, the mention `$slack:search` in a test:
  https://github.com/openai/codex/blob/b1573f10/codex-rs/skills/src/mentions_tests.rs
- Copilot CLI, "include the skill name in your prompt, preceded by a forward slash":
  https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills
- Copilot CLI, plugin skills "are deduplicated by their name field" (no namespace stated):
  https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference
- Cursor, "typing `/` in Agent chat and searching for the skill name", and plugin skills "appear in
  Customize alongside your other skills": https://cursor.com/docs/skills
