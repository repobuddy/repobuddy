# Deny list

Candidate deny entries, grouped so the user can pick a whole group or single entries. Offer only the
groups and entries that fit this machine and repo: skip `pnpm publish` when pnpm is not here, and offer a
host's entries only for the hosts the detection found (`gh` for GitHub, `glab` for GitLab, `az` for Azure
DevOps, `tea` for Gitea, `fj` for Forgejo). Bitbucket Cloud has no CLI, so it has no entries.

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
   in every mode, including `bypassPermissions`, and no allow rule can make an exception to it. A hook
   cannot either: a hook's `allow` still goes through the deny rules.
4. **Modes change what "ask" means, not what "deny" means.** In `auto` mode, ask rules still prompt.
   In `dontAsk` mode, and in `claude -p` runs with nothing to answer a prompt, anything that would
   prompt is denied instead. So ask-every-time commands are denied there even without a deny entry.

## Entries (Claude Code)

| Group | Entries | Note |
|---|---|---|
| Force push | `Bash(git push --force*)`, `Bash(git push -f*)`, `Bash(git push * --force*)`, `Bash(git push * -f*)`, `Bash(git push * +*)` | `--force*` also covers `--force-with-lease` and `--force-if-includes`. `+*` covers a `+refspec` such as `git push origin +main`. A combined flag (`-uf`) still gets past |
| Bypass merge: GitHub | `Bash(gh pr merge --admin*)`, `Bash(gh pr merge * --admin*)` | Required with the advanced GitHub queued merge and the auto-mode merge rule |
| Bypass merge: Azure DevOps | `Bash(az repos pr update *--bypass-policy*)`, `Bash(az repos pr create *--bypass-policy*)` | Required with the advanced Azure queued merge and the auto-mode merge rule. Also blocks `--bypass-policy false`, which does nothing anyway |
| Bypass merge: Gitea | `Bash(tea api *force_merge*)` | Required with the auto-mode merge rule for Gitea. `tea pulls merge` has no force flag; the API's `force_merge` is the bypass |
| Immediate merge: GitLab | `Bash(glab mr merge *--auto-merge=false*)`, `Bash(glab mr merge *--auto-merge false*)` | Required with the advanced GitLab queued merge. `glab` has no flag that bypasses a required pipeline, so this is the only form to stop |
| Repo delete | `Bash(gh repo delete*)`, `Bash(glab repo delete*)`, `Bash(az repos delete*)`, `Bash(tea repos delete*)`, `Bash(tea repos rm*)`, `Bash(fj repo delete*)` | One entry per detected host. Other aliases the CLI accepts get past |
| API delete | `Bash(gh api *-X DELETE*)`, `Bash(gh api *-XDELETE*)`, `Bash(gh api *--method DELETE*)`, `Bash(gh api *--method=DELETE*)`, and the same four forms for `glab api` and `tea api` | A lowercase `delete` gets past. The `gh-api-guard` hook asks for every non-GET `gh api` and `glab api` method. Azure's `az devops invoke` and `az rest` take the method under other flags; leave them in ask-every-time rather than deny one spelling |
| Recursive delete | `Bash(rm -rf*)`, `Bash(rm -fr*)`, `Bash(rm -Rf*)`, `Bash(rm -fR*)`, `Bash(rm -r -f*)`, `Bash(rm -f -r*)`, `Bash(rm --recursive --force*)`, `Bash(rm --force --recursive*)` | The agent can no longer clean `node_modules` or build output. You run those yourself with the `!` prefix |
| Publish | `Bash(npm publish*)`, `Bash(pnpm publish*)`, plus `Bash(yarn npm publish*)` and `Bash(bun publish*)` when those are installed | Also deny any package script that publishes (`release`, `changeset publish`). Read the scripts to find them. `pnpm -r publish` gets past the first form |
| Secrets | `Read(**/.env*)`, `Read(~/.ssh/**)`, `Read(~/.aws/**)`, `Read(~/.npmrc)`, plus each detected host's CLI login file: `Read(~/.config/gh/hosts.yml)`, `Read(~/.config/glab-cli/**)`, `Read(~/.azure/**)`, `Read(~/.config/tea/**)`, `Read(~/.local/share/forgejo-cli/**)` | `**/.env*` also hides `.env.example`. The `glab` path is the one it checks first on every OS. The `fj` path is its Linux data directory; on macOS, find it under `~/Library/Application Support` before offering it. See point 2 above for what these do not cover |

Suggest user scope for every group, because none depends on this repo: the secrets group guards files
outside the repo, and the rest block commands that are as dangerous in any repo. A project scope fits
only when the user wants a group in one repo alone, such as a publish deny in a repo they release by hand.

## Other harnesses

- **Cursor:** `permissions.deny` in the same files as the allow list. Deny beats allow. Write file
  entries as `Read(...)` with the same paths. A shell entry `Shell(rm)` blocks every `rm`, so use the
  `command:args` form from the Cursor docs to deny one form. Skip any entry that form cannot express,
  and say which ones you skipped.
- **Codex:** `prefix_rule(pattern = [...], decision = "forbidden")` in the same `.rules` file. The most
  restrictive matching rule wins. A prefix rule matches only the leading words, so it can express
  `git push --force` and `gh repo delete`, but not a flag later in the command (`git push origin
  --force`, `gh pr merge 12 --admin`, `az repos pr update --id 7 --bypass-policy true`,
  `glab api … -X DELETE`). Say which entries it cannot express. Codex
  has no read-deny rule. Its sandbox settings decide which files a command can reach. Check each rule
  with `codex execpolicy check`.
