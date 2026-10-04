# Advanced tier (opt-in)

Offer this tier only when the user asks for it, for example by asking to stop prompting for merges or
for `gh api`. Each entry below has a risk and a guard. **Never write an entry without its guard.** If
the user declines the guard, or the guard cannot be set up here, do not write the entry. Leave the
command in ask-every-time.

These entries are for Claude Code only. Cursor and Codex cannot express the guards (see
[Other harnesses](#other-harnesses)).

## `gh pr merge --auto`

| | |
|---|---|
| Entry | `Bash(gh pr merge --auto *)` |
| Instead of | `Bash(gh pr merge *)`, which also allows an immediate merge and `--admin` |
| Risk | The agent can queue a merge of any PR it can see. |
| Guard | The base branch requires at least one status check, and the deny list holds the `--admin` entries. |

With `--auto`, GitHub merges only after the branch's rules are met. That check happens on GitHub's
side, not in the harness. If the branch requires nothing, the rules are already met, so `--auto`
**merges immediately**. Check the default branch's rules before you offer the entry:

```bash
branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)
# Rulesets (also covers org rulesets that apply to this repo)
gh api "repos/{owner}/{repo}/rules/branches/$branch" --jq '[.[] | .type]'
# Classic branch protection (404 when there is none, 403 without admin access)
gh api "repos/{owner}/{repo}/branches/$branch/protection" --jq '.required_status_checks'
```

- **A required status check is in place** (a `required_status_checks` rule, or classic protection
  with checks or contexts): offer the entry. Say which checks GitHub will wait for.
- **No required check:** do not offer the entry. Say that `--auto` would merge at once here, and that
  adding a required check (through `setup-github-repo`, or the repository's rules settings) comes
  first. A required review alone is not enough, because a PR that already has an approval merges at once.
- **Cannot tell** (403, no access to rules): treat it as no required check.

Write the entry only together with the `--admin` deny entries from the [deny list](deny-list.md). The
allow pattern also matches `gh pr merge --auto --admin 12`, and a deny rule is what stops that. Deny
beats allow.

Write the entry at project local scope only. Its guard is this repo's branch rules, so at user scope it
would also apply in a repo that requires no check, where `--auto` merges at once.

The rules check covers the default branch. A PR into another branch follows that branch's rules, so
say this when the repo merges into release or long-lived branches.

## Merges in auto mode (`autoMode.allow`)

| | |
|---|---|
| Entry | a prose rule in `autoMode.allow` in `~/.claude/settings.json` (template below). Not a `permissions.allow` entry. |
| Instead of | relying on `Bash(gh pr merge *)` in `permissions.allow`, which auto mode's classifier still overrides |
| Risk | The agent can merge a PR that no person approved, in any repo the rule names. |
| Guard | The rule text names the owners and the conditions, and the deny list holds the `--admin` entries. |

Offer this only when the user runs Claude Code in auto mode (`permissions.defaultMode` is `"auto"`, or
they start sessions in it) and wants the agent to merge PRs itself, for example an orchestrator
merging the PRs its worker sessions open. In auto mode a classifier reviews each action after the
permission rules. Its built-in "Merge Without Review" block stops `gh pr merge` on a PR with no
approving review, even when `permissions.allow` lists the command. Its exceptions are plain-language
rules under `autoMode.allow`.

**User scope only.** The classifier reads `autoMode` from `~/.claude/settings.json` (and managed
settings), never from `.claude/settings.json` or `.claude/settings.local.json`, so that a repo cannot
grant itself exceptions. Do not offer project scope for this entry.

**Ask for the owners.** The rule must name the GitHub users and organizations whose repos it covers.
Ask the user for the list. `gh api user/orgs --jq '.[].login'` can suggest candidates, but the user
decides. Never widen the list from a repo's remotes alone.

The entry, with `<owners>` filled in:

```json
"Merging a pull request (`gh pr merge`, or adding it to the merge queue) without an approving review, in a repo owned by <owners>, when the agent has confirmed first-hand that the PR has no merge conflict, every required check is green, and no review requests changes or is left unresolved. Bypassing branch protection or required checks (`gh pr merge --admin`), merging while checks are red or pending, or merging in a repo owned by anyone else is still not covered."
```

Write it:

- Add it to `autoMode.allow`. Never remove or reorder the entries already there.
- If `autoMode.allow` does not exist yet, start it with `"$defaults"`, so the built-in exceptions stay
  in force, then this entry.
- Write the `--admin` deny entries from the [deny list](deny-list.md) in the same change, unless the
  user already has them.

Say what it does not guarantee. The classifier is a model that reads the rule, not a pattern match, so
the rule makes a merge that meets its conditions allowed, not certain. If a merge is still blocked, the
user merges it with `! gh pr merge <pr>`. The rule never covers merging a PR the agent has not checked.

## `gh api`

| | |
|---|---|
| Entry | the guard hook below, which allows reads itself. No `Bash(gh api *)` rule is written. |
| Risk | `gh api` can send any request the token allows: POST, PATCH, DELETE, or a GraphQL mutation. |
| Guard | (a) a read-only token, or (b) the shipped `gh-api-guard` hook. |

The method is not visible in the command name. `gh api` sends GET by default, and switches to POST as
soon as a field is added with `-f` or `-F`. `-X`/`--method` overrides both. The `graphql` endpoint is
always POST, so only the body tells a query from a mutation.

First point out that the dedicated read commands already cover most reads and sit in the safe tier:
`gh pr view --json …`, `gh pr checks`, `gh run view`, `gh issue view --json …`, `gh search …`. If
those are enough, stop here.

Guards, strongest first:

1. **A fine-grained, read-only token for the session.** The user creates a fine-grained personal
   access token with read-only repository permissions and starts the session with it, allowing
   `gh api` for that session only:

   ```bash
   GH_TOKEN=<read-only token> claude --allowedTools "Bash(gh api *)"
   ```

   The user sets the token in their own shell, never in the chat and never in a settings file. Nothing
   is written to settings: the allow entry lives only in that launch, so it never outlives its guard.
   Say the cost: in that session the agent cannot push, merge, or comment, because the token cannot.
2. **The `gh-api-guard` hook.** A PreToolUse hook reads each `gh api` command and decides:

   | Decision | When |
   |---|---|
   | allow | a GET (no `-X`, or `-X GET`), or a `graphql` query whose fields contain no `mutation` |
   | ask | any other method, `-f`/`-F` without `-X GET`, `--input`, an `-F` field read from `@file` or stdin, a method-override header, a full URL, an unknown flag, a pipe, `&&`, `;`, a redirect, a variable, or a substitution |
   | defer | any command that does not start with `gh api`, which leaves it to the permission rules |

   The hook decides only what it can see in the command text. A `-F key=@file` field is asked about
   even with GET, because it would send that file's contents to GitHub.

### Install the hook

The script ships with this skill at `scripts/gh-api-guard.mjs`. It is built, so it exists in the npm
package and the plugin install. If it is missing, the skill came from git. Ask the user to install the
`repobuddy` plugin, or copy the script from `npm pack repobuddy`. Do not write the hook entry pointing
at a file that is not there.

1. Copy the script to a stable path: `.claude/hooks/gh-api-guard.mjs` for one project, or
   `~/.claude/hooks/gh-api-guard.mjs` for every repo. A plugin directory moves on update, so do not
   point the hook at it.
2. Add the hook to the same settings file the user chose for allow entries. Show the diff first:

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Bash",
           "hooks": [
             {
               "type": "command",
               "if": "Bash(gh api *)",
               "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/gh-api-guard.mjs"
             }
           ]
         }
       ]
     }
   }
   ```

   For user scope, use `node ~/.claude/hooks/gh-api-guard.mjs`. Add to an existing `hooks` block; never
   replace it.
3. Confirm it runs:

   ```bash
   echo '{"tool_input":{"command":"gh api -X DELETE repos/o/r"}}' | node .claude/hooks/gh-api-guard.mjs
   ```

   It should print `"permissionDecision":"ask"`.

How the hook works with the rules:

- A hook `allow` does not override the rules. Claude Code still applies every deny and ask rule, so
  the `gh api … DELETE` deny entries keep working.
- If the script fails or prints nothing, the command goes through the normal permission flow. It fails
  closed into a prompt, because no `Bash(gh api *)` allow rule exists. Never add that rule next to the
  hook: if the hook ever failed, everything would be allowed.

## Other harnesses

- **Cursor:** `beforeShellExecution` hooks (`.cursor/hooks.json`) can return `allow`, `deny`, or `ask`
  for a shell command, in the IDE and the CLI. The input and output formats differ from Claude Code's,
  so `gh-api-guard.mjs` does not work there as is. Do not offer the advanced tier for Cursor.
- **Codex:** hooks can deny a command but cannot ask, and a prefix rule cannot keep `--admin` out of
  `gh pr merge --auto …`. There is no equivalent. Do not offer the advanced tier for Codex.
