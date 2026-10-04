# Advanced tier (opt-in)

Offer this tier only when the user asks for it, for example by asking to stop prompting for merges or
for `gh api`. Each entry below has a risk and a guard. **Never write an entry without its guard.** If
the user declines the guard, or the guard cannot be set up here, do not write the entry. Leave the
command in ask-every-time.

These entries are for Claude Code only. Cursor and Codex cannot express the guards (see
[Other harnesses](#other-harnesses)).

## Which hosts get which entry

Offer an entry only for a host the detection found, and only where this table says yes. Where it says
no, tell the user the host has no safe equivalent and leave its commands in ask-every-time.

| Host | Queued merge | Merges in auto mode | Raw API reads |
|---|---|---|---|
| GitHub | `gh pr merge --auto` | yes | `gh api`: read-only token, or the `gh-api-guard` hook |
| GitLab | `glab mr merge --auto-merge` | yes | `glab api`: read-only token only |
| Azure DevOps | `az repos pr update --auto-complete true` | yes | no |
| Gitea | no: `tea pulls merge` has no auto-merge flag | yes | no |
| Forgejo / Codeberg | no: `fj pr merge` has no auto-merge flag | yes | no: `fj` has no raw API command |
| Bitbucket Cloud | no: no official CLI | no: no CLI to name | no |

Why the no's:

- **Gitea and Forgejo queued merge.** The server can merge when checks pass (`merge_when_checks_succeed`
  in the merge API), but neither CLI sends it. The only way is a raw `tea api` POST, which is
  ask-every-time. And with no required status check the server merges at once, the same trap as GitHub.
- **Raw API on Gitea, Azure.** `tea api` has the same GET-to-POST switch as `gh api`, but the
  `gh-api-guard` hook does not parse it, and `tea` has no documented way to swap in a read-only token
  for one session. `az devops invoke` and `az rest` run with the `az login` credential, which can reach
  the whole Azure account. Leave them in ask-every-time.
- **Bitbucket Cloud.** There is no official CLI to write an entry for. Its "Allow automatic merge when
  builds pass" merge check is a web setting.

## Queued merge

The entry lets the agent queue a merge that the host performs only once the target branch's own rules
are met. That check happens on the host, not in the harness. **If the branch requires nothing, the rules
are already met and the host merges at once.** So every host's guard is the same shape: read the
host's own branch or project settings first, offer the entry only when a required check or pipeline
blocks the merge, and write the host's bypass deny entries from the [deny list](deny-list.md) with it.

For every host:

- **A required review alone is not enough.** A PR or MR that already has an approval merges at once.
- **Cannot tell** (403, 404 for lack of access, no rights to read the settings): treat it as no
  required check, and do not offer the entry.
- **Project local scope only.** The guard is this repo's settings. At user scope the entry would also
  apply in a repo that requires nothing, where it merges at once.
- **Deny beats allow.** The allow pattern also matches a command that adds the bypass flag, so the deny
  entry is what stops it. Never write the allow entry without it.

### GitHub: `gh pr merge --auto`

| | |
|---|---|
| Entry | `Bash(gh pr merge --auto *)` |
| Instead of | `Bash(gh pr merge *)`, which also allows an immediate merge and `--admin` |
| Risk | The agent can queue a merge of any PR it can see. |
| Guard | The base branch requires at least one status check, and the deny list holds the GitHub bypass (`--admin`) entries. |

Check the default branch's rules before you offer the entry:

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
  adding a required check (through `setup-github-repo`, or the repository's rules settings) comes first.

The rules check covers the default branch. A PR into another branch follows that branch's rules, so
say this when the repo merges into release or long-lived branches.

### GitLab: `glab mr merge --auto-merge`

| | |
|---|---|
| Entry | `Bash(glab mr merge --auto-merge *)` |
| Instead of | `Bash(glab mr merge *)`, which also allows `--auto-merge=false`, an immediate merge |
| Risk | The agent can queue a merge of any MR it can see. |
| Guard | The project requires a successful pipeline and does not count a skipped one, and the deny list holds the GitLab immediate-merge entries. |

`glab mr merge` turns auto-merge on by default when a pipeline is running, and `--auto-merge=false`
merges at once. GitLab's merge has no flag or API parameter that bypasses a failing pipeline, so the
guard is the project setting that makes the pipeline required:

```bash
glab api projects/:id
```

Read these fields from the JSON it prints:

- `only_allow_merge_if_pipeline_succeeds` is `true`, **and** `allow_merge_on_skipped_pipeline` is
  `false`: offer the entry. With that setting, an MR with no pipeline cannot merge at all. Say that
  every MR in the project now waits for its pipeline, whatever its target branch.
- Anything else: do not offer the entry. Say that GitLab merges at once when no pipeline is required,
  and that turning on "Pipelines must succeed" (Settings > Merge requests) comes first.

`glab api` with no fields sends a GET, so this read is safe to run.

### Azure DevOps: `az repos pr update --auto-complete true`

| | |
|---|---|
| Entry | `Bash(az repos pr update * --auto-complete true*)` |
| Instead of | `Bash(az repos pr update *)`, which also allows `--bypass-policy` and any other PR change |
| Risk | The agent can set any PR it can see to complete once its policies pass. |
| Guard | The target branch has an enabled, blocking build validation policy, and the deny list holds the Azure bypass (`--bypass-policy`) entries. |

Auto-complete waits for the branch's required policies. Read them for the default branch:

```bash
repo=$(az repos show --repository <repo name> --query id -o tsv)
az repos policy list --repository-id "$repo" --branch <default branch> \
  --query "[?isEnabled && isBlocking].{type: type.displayName, settings: settings}"
```

`--branch` needs `--repository-id`, and matches the branch name exactly. `--detect` (on by default)
reads the organization and project from the remote; pass `--org` and `--project` if it cannot.

- **An enabled, blocking build validation policy** (its settings name a `buildDefinitionId`): offer
  the entry. Say which pipeline Azure will wait for.
- **Only reviewer policies, or nothing blocking:** do not offer the entry. A required reviewer who has
  already approved lets the PR complete at once. Say that a build validation policy on the branch comes
  first.

`--bypass-policy` completes the PR over its policies for anyone with "Exempt from policy enforcement".
The allow pattern matches `--auto-complete true --bypass-policy true`, so write the deny entries with it.

## Merges in auto mode (`autoMode.allow`)

| | |
|---|---|
| Entry | a prose rule in `autoMode.allow` in `~/.claude/settings.json` (template below). Not a `permissions.allow` entry. |
| Instead of | relying on the merge command in `permissions.allow`, which auto mode's classifier still overrides |
| Risk | The agent can merge a PR or MR that no person approved, in any repo the rule names. |
| Guard | The rule text names the hosts, the owners, and the conditions, and the deny list holds each host's bypass entries. |

Offer this only when the user runs Claude Code in auto mode (`permissions.defaultMode` is `"auto"`, or
they start sessions in it) and wants the agent to merge itself, for example an orchestrator merging the
PRs its worker sessions open. In auto mode a classifier reviews each action after the permission rules.
Its built-in "Merge Without Review" block stops a merge of a PR with no approving review, even when
`permissions.allow` lists the command. Its exceptions are plain-language rules under `autoMode.allow`.

**User scope only.** The classifier reads `autoMode` from `~/.claude/settings.json` (and managed
settings), never from `.claude/settings.json` or `.claude/settings.local.json`, so that a repo cannot
grant itself exceptions. Do not offer project scope for this entry.

### Fill it in per host

Cover every host the detection found, except Bitbucket Cloud, which has no CLI to name. Take each
host's row:

| Host | Merge commands | Bypass forms to exclude | Owners are | Suggest candidates with |
|---|---|---|---|---|
| GitHub | `gh pr merge`, or adding it to the merge queue | `gh pr merge --admin` | GitHub users and organizations | `gh api user/orgs --jq '.[].login'` |
| GitLab | `glab mr merge` | `glab mr merge --auto-merge=false` before the pipeline has passed | GitLab groups and user namespaces, by full path | `glab api "groups?min_access_level=30"` (read `full_path`) |
| Azure DevOps | `az repos pr update --auto-complete true`, `az repos pr update --status completed` | `--bypass-policy` on `az repos pr update` or `az repos pr create` | Azure DevOps organizations, or projects within one | `az devops project list` (for the default organization) |
| Gitea | `tea pulls merge` | a `force_merge` merge sent through `tea api` | Gitea organizations and users, on the named instance | the user's own list; `tea --help` shows the org commands of the installed version |
| Forgejo / Codeberg | `fj pr merge` | none in `fj`; the rule's "red or pending" clause covers it | Forgejo organizations and users, on the named instance | the user's own list |

**Ask for the owners, per host.** The rule must name, for each host, the owners whose repos it covers,
and for a self-hosted instance its hostname (`the GitLab group acme/platform on git.corp.example`). The
suggestion commands can propose candidates, but the user decides. Never widen the list from a repo's
remotes alone, and never let an owner on one host stand for the same name on another.

The entry, with the placeholders filled in from the rows:

```text
Merging a pull or merge request (<merge commands>) without an approving review, in a repo owned by <owners>, when the agent has confirmed first-hand that it has no merge conflict, every required check or pipeline is green, and no review requests changes or is left unresolved. Bypassing branch protection, branch policies, or required checks (<bypass forms>), merging while checks or pipelines are red or pending, or merging in a repo owned by anyone else is still not covered.
```

- `<merge commands>`: every detected host's merge commands, each tagged with its host when there is
  more than one (`gh pr merge on GitHub, glab mr merge on GitLab`).
- `<owners>`: each host's owners, qualified by host (`the GitHub organizations acme and unional, or the
  GitLab group acme/platform on gitlab.com`).
- `<bypass forms>`: every detected host's bypass forms. Leave out a host whose row says none.

For a GitHub-only user, the filled entry reads:

```json
"Merging a pull or merge request (`gh pr merge`, or adding it to the merge queue) without an approving review, in a repo owned by the GitHub organizations acme and unional, when the agent has confirmed first-hand that it has no merge conflict, every required check or pipeline is green, and no review requests changes or is left unresolved. Bypassing branch protection, branch policies, or required checks (`gh pr merge --admin`), merging while checks or pipelines are red or pending, or merging in a repo owned by anyone else is still not covered."
```

Write it:

- Add it to `autoMode.allow` as one string. Never remove or reorder the entries already there.
- If `autoMode.allow` does not exist yet, start it with `"$defaults"`, so the built-in exceptions stay
  in force, then this entry.
- Write each covered host's bypass deny entries from the [deny list](deny-list.md) in the same change,
  unless the user already has them. GitLab and Forgejo have none to write.
- When a later run detects a new host, offer to rewrite the rule with that host added, and show the
  old and new text side by side. Never edit the rule without that approval.

Say what it does not guarantee. The classifier is a model that reads the rule, not a pattern match, so
the rule makes a merge that meets its conditions allowed, not certain. If a merge is still blocked, the
user merges it with the `!` prefix (`! gh pr merge <pr>`, `! glab mr merge <mr>`). The rule never covers
merging a PR the agent has not checked.

## Raw API reads

`gh api` and `glab api` can send any request the token allows: POST, PATCH, DELETE, or a GraphQL
mutation. The method is not visible in the command name. Both send GET by default, and switch to POST
as soon as a field is added with `-f` or `-F`. `-X`/`--method` overrides both. The `graphql` endpoint is
always POST, so only the body tells a query from a mutation.

First point out that the dedicated read commands already cover most reads and sit in the safe tier:
`gh pr view --json …`, `gh pr checks`, `gh run view`, `gh search …`, `glab mr view`, `glab ci status`.
If those are enough, stop here.

| | |
|---|---|
| Entry | none in settings. A read-only token allows the command for one session, or the `gh-api-guard` hook allows reads itself. No `Bash(gh api *)` or `Bash(glab api *)` rule is written. |
| Risk | the command can send any request the token allows. |
| Guard | (a) a read-only token, on GitHub or GitLab, or (b) the shipped `gh-api-guard` hook, on GitHub only. |

Guards, strongest first:

1. **A read-only token for the session.** The user creates the token and starts the session with it,
   allowing the API command for that session only:

   | Host | Token | Launch |
   |---|---|---|
   | GitHub | fine-grained personal access token with read-only repository permissions | `GH_TOKEN=<token> claude --allowedTools "Bash(gh api *)"` |
   | GitLab | personal access token with only the `read_api` scope | `GITLAB_TOKEN=<token> claude --allowedTools "Bash(glab api *)"` |

   The user sets the token in their own shell, never in the chat and never in a settings file. Both
   CLIs prefer the variable over their stored login. Nothing is written to settings: the allow entry
   lives only in that launch, so it never outlives its guard. Say the cost: in that session the agent
   cannot push, merge, or comment through that CLI, because the token cannot.
2. **The `gh-api-guard` hook (GitHub only).** A PreToolUse hook reads each `gh api` command and decides:

   | Decision | When |
   |---|---|
   | allow | a GET (no `-X`, or `-X GET`), or a `graphql` query whose fields contain no `mutation` |
   | ask | any other method, `-f`/`-F` without `-X GET`, `--input`, an `-F` field read from `@file` or stdin, a method-override header, a full URL, an unknown flag, a pipe, `&&`, `;`, a redirect, a variable, or a substitution |
   | defer | any command that does not start with `gh api`, which leaves it to the permission rules |

   The hook decides only what it can see in the command text. A `-F key=@file` field is asked about
   even with GET, because it would send that file's contents to GitHub.

   It does not read `glab api` commands; they get `defer`. For GitLab, offer the read-only token only.

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
- **Codex:** hooks can deny a command but cannot ask, and a prefix rule cannot keep a bypass flag out of
  a merge command (`gh pr merge --auto … --admin`, `az repos pr update … --bypass-policy true`). There
  is no equivalent. Do not offer the advanced tier for Codex.
