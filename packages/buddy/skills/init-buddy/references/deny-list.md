# Deny list

Candidate deny entries, grouped so the user can pick a whole group or single entries. Offer only the
groups that fit this machine and repo: skip `pnpm publish` when pnpm is not here, and skip `gh` when the
host is not GitHub.

## What a deny rule is, and is not

Tell the user these four things before they pick. Do not soften them.

1. **Deny rules match text, so they are tripwires, not guarantees.** They stop the agent from running
   the command in its usual form. A reworded command gets past them. For example, `git -C . push
   --force`, `/bin/rm -rf x`, `sh -c 'npm publish'`, or a script that runs the command all get through.
   Claude Code does check each part of `a && b`, and sees past a leading `FOO=bar`. It does not see a
   program called by its full path or through `sh -c`.
2. **`Read(...)` denies do not cover every way to read a file.** In Claude Code they cover the Read tool,
   the Bash file commands it recognizes (`cat`, `head`, `tail`, `sed`, and others), and redirections. They
   do not cover `grep -r` run from a parent directory, or a Python or Node script that opens the file
   itself. The real guard is the sandbox (`/sandbox`), which blocks the path for every process, or a
   PreToolUse hook. Say this every time a `Read(...)` entry is offered.
3. **Deny beats allow.** Claude Code checks deny rules first, then ask, then allow. A deny rule blocks
   in every mode, including `bypassPermissions`, and no allow rule can make an exception to it.
4. **Modes change what "ask" means, not what "deny" means.** In `auto` mode, ask rules still prompt.
   In `dontAsk` mode, and in `claude -p` runs with nothing to answer a prompt, anything that would
   prompt is denied instead. So ask-every-time commands are denied there even without a deny entry.

## Entries (Claude Code)

| Group | Entries | Note |
|---|---|---|
| Force push | `Bash(git push --force*)`, `Bash(git push -f*)`, `Bash(git push * --force*)`, `Bash(git push * -f*)`, `Bash(git push * +*)` | `--force*` also covers `--force-with-lease` and `--force-if-includes`. `+*` covers a `+refspec` such as `git push origin +main`. A combined flag (`-uf`) still gets past |
| Admin merge | `Bash(gh pr merge --admin*)`, `Bash(gh pr merge * --admin*)` | |
| Repo delete | `Bash(gh repo delete*)` | |
| API delete | `Bash(gh api *-X DELETE*)`, `Bash(gh api *-XDELETE*)`, `Bash(gh api *--method DELETE*)`, `Bash(gh api *--method=DELETE*)` | A lowercase `delete` gets past |
| Recursive delete | `Bash(rm -rf*)`, `Bash(rm -fr*)`, `Bash(rm -Rf*)`, `Bash(rm -fR*)`, `Bash(rm -r -f*)`, `Bash(rm -f -r*)`, `Bash(rm --recursive --force*)`, `Bash(rm --force --recursive*)` | The agent can no longer clean `node_modules` or build output. You run those yourself with the `!` prefix |
| Publish | `Bash(npm publish*)`, `Bash(pnpm publish*)`, plus `Bash(yarn npm publish*)` and `Bash(bun publish*)` when those are installed | Also deny any package script that publishes (`release`, `changeset publish`). Read the scripts to find them. `pnpm -r publish` gets past the first form |
| Secrets | `Read(**/.env*)`, `Read(~/.ssh/**)`, `Read(~/.aws/**)`, `Read(~/.npmrc)`, `Read(~/.config/gh/hosts.yml)` | `**/.env*` also hides `.env.example`. See point 2 above for what these do not cover |

Put the secrets group at user scope, because it guards files outside the repo. Put the rest where the
user wants them. User scope protects every repo.

## Other harnesses

- **Cursor:** `permissions.deny` in the same files as the allow list. Deny beats allow. Write file
  entries as `Read(...)` with the same paths. A shell entry `Shell(rm)` blocks every `rm`, so use the
  `command:args` form from the Cursor docs to deny one form. Skip any entry that form cannot express,
  and say which ones you skipped.
- **Codex:** `prefix_rule(pattern = [...], decision = "forbidden")` in the same `.rules` file. The most
  restrictive matching rule wins. A prefix rule matches only the leading words, so it can express
  `git push --force` and `gh repo delete`, but not a flag later in the command (`git push origin
  --force`, `gh pr merge 12 --admin`, `gh api … -X DELETE`). Say which entries it cannot express. Codex
  has no read-deny rule. Its sandbox settings decide which files a command can reach. Check each rule
  with `codex execpolicy check`.
