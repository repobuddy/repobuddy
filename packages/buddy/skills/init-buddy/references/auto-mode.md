# Auto mode (Claude Code)

Read this before the auto-mode step. It covers where each kind of rule goes when the user runs Claude
Code in auto mode, how to write `autoMode.environment` from what `gh` can discover, which
`autoMode.allow` rules to offer, and how to refresh them later.

Sources: [permission modes](https://code.claude.com/docs/en/permission-modes),
[permissions](https://code.claude.com/docs/en/permissions),
[auto mode config](https://code.claude.com/docs/en/auto-mode-config), and the output of
`claude auto-mode defaults`. When a claim here and the installed version disagree, trust
`claude auto-mode defaults` and `claude auto-mode config`, and say so.

## How the rules and the classifier fit together

Tell the user these points before anything is written. Do not soften them.

1. **Permission rules come first.** An action that matches an allow, ask, or deny rule resolves there,
   with a few listed exceptions such as writes to protected paths. Only the rest reaches the
   classifier ([decision order](https://code.claude.com/docs/en/permission-modes#how-auto-mode-evaluates-actions)).
   So an allow entry replaces the classifier's judgment for every command it matches.
2. **Auto mode drops broad allow rules** while it is active: `Bash(*)`, wildcarded interpreters such as
   `Bash(python*)`, package-manager run commands, and `Agent` and `Monitor` rules. Narrow rules such as
   `Bash(npm test)` stay. The dropped rules return when the session leaves auto mode.
3. **Ask still prompts and deny still blocks.** An ask rule that matches a command's content, such as
   `Bash(git push *)`, prompts even in auto mode. A deny rule blocks in every mode.
4. **`autoMode` lives in user settings only.** The classifier reads it from `~/.claude/settings.json`,
   managed settings, and `--settings`, never from `.claude/settings.json` or
   `.claude/settings.local.json`, so a repo cannot grant itself exceptions.
5. **`autoMode.classifyAllShell: true`** suspends every Bash and PowerShell allow rule in auto mode, so
   the classifier sees every shell command. Mention it to a user who wants the classifier to judge
   everything; it costs a classifier call per command.
6. **Built-in read-only commands** (`ls`, `cat`, `grep`, read-only `git`) run without a prompt in every
   mode. `gh` reads are not in that set.
7. **The classifier reads prose.** Its rules and environment entries are natural language, so an entry
   makes an action likely, not certain. A blocked action that the user wants is run by the user with
   the `!` prefix, or retried after the user states the intent in a message.

## Explicit or default

Give every rule you propose one line saying which row it falls under, so the user sees why it is
written down or left out.

| Write it explicitly in | When | Example |
|---|---|---|
| `autoMode.environment` | a fact only the user knows | the namespaces they own, which repos are private, how they release |
| `autoMode.allow` | an exception where the built-in rules are too strict for this user | merging a PR the agent checked, in the user's own namespaces |
| `permissions.ask` | an action that needs a person every time | `Bash(gh release create *)` for a user who releases by hand |
| `permissions.deny` | an action that must never run, and secrets as path-based `Read(...)` denies | the [deny list](deny-list.md) |
| `permissions.allow` | a frequent, local, reversible speed-up | `Bash(git add *)`, `Bash(git commit *)` |

Leave to the default:

- the built-in read-only set (point 6 above)
- the built-in `soft_deny` and `hard_deny` rules (`claude auto-mode defaults`)
- any decision that depends on context a pattern cannot see: which branch, which repo, which PR, who
  will read it. In auto mode the classifier sees that context; an allow pattern does not.

## Place rules by mode

Outward-facing commands are the ones that act on a remote or reach other people: `git push`, a merge,
`gh api` and `glab api`, `gh workflow run`, a release, publish, or deploy.

| Mode | Outward-facing command | Why |
|---|---|---|
| auto | no allow entry. Leave it to the classifier, add an ask rule for a person every time, or an `autoMode.allow` rule for an exception | an allow entry skips the classifier (point 1) |
| any other mode | no allow entry: the ask-every-time tier | the prompt is the only check |

The advanced-tier queued merge (`Bash(gh pr merge --auto *)`) is a guarded exception in other modes.
In auto mode, offer the [queued-merge rule](#queued-merge) below instead, which also lets the
classifier check which PR it is.

## Step 1: read what is there

1. **Find the mode.** Read `permissions.defaultMode` from the Claude Code settings files. If it is not
   `"auto"`, ask whether the user starts sessions in auto mode (`--permission-mode auto`, or Shift+Tab).
2. **Read the effective config** with `claude auto-mode config`. It prints the rules the classifier
   uses, the user's and the built-in ones. From `~/.claude/settings.json`, read only the `autoMode` and
   `permissions` keys.
3. **Look for template text** in the user's own `environment` and `allow` entries: braces such as
   `{COMPANY_NAME}`, angle placeholders such as `<owners>`, `TODO` or `TBD`, and instructions addressed
   to the reader, such as "say so here", "fill in", or "replace with". A placeholder inside a code span
   or a path (`~/code/<repo>`) is syntax, not a blank. Show each entry that has some, say which words
   are template text, and offer to fill it in from the next step.
4. **Look for `autoMode` in project settings** (`.claude/settings.json`, `.claude/settings.local.json`).
   Say it is ignored there, and offer to move it to `~/.claude/settings.json`.

## Step 2: discover the environment

Discover what you can, then ask for the rest. Show each finding as a draft entry; the user confirms
or corrects it.

**Namespaces.** On GitHub:

```bash
gh api user --jq .login
gh api --paginate user/memberships/orgs --jq '.[] | [.organization.login, .role, .state] | @tsv'
```

`user/memberships/orgs` needs the `read:org` scope, which `gh auth login` grants by default. Propose
the personal account and every `active` organization where the role is `admin`. List the `member`
ones separately and ask about each. Leave out `pending` ones. On other hosts, use the suggestion
command in the [advanced tier's owner table](advanced-tier.md#fill-it-in-per-host), or ask.

**Visibility per namespace:**

```bash
gh repo list <owner> --limit 1000 --json name,visibility --jq '.[] | [.name, .visibility] | @tsv'
```

For each namespace, say whether every repo is public, every repo is private, or it is mixed. For a
mixed one, name the smaller group. Treat `INTERNAL` as private.

**The rest:**

| Entry | Discover | Then ask |
|---|---|---|
| Branch protection | this repo's default-branch rules, with the commands in the [advanced tier](advanced-tier.md#github-gh-pr-merge---auto) | whether the same holds across the user's namespaces, and the exceptions |
| Toolchain | this repo's lockfile and `packageManager` field | whether it holds across the user's repos |
| Release path | `.changeset/`, and workflows that publish (`npm publish`, `changesets/action`) | whether anything is ever published from this machine |
| Host containment | the OS and WSL from detection | whether sessions run in a container, VM, or with an egress allow-list. Write the entry only when the answer differs from the default, an ordinary machine with open internet |
| Local services | nothing | services the agent may reach, such as a local database for tests |

## Step 3: write the entries

Keep the namespace list in one entry, and have every other entry and `autoMode.allow` rule refer to
it as "my namespaces". The built-in rules refer to environment entries by name the same way. A list
copied into several entries drifts: one entry gains an org that the other never hears of.

```text
Source control: my namespaces, which other entries and rules refer to by that name, are the GitHub account octo-dev and the GitHub organizations acme and acme-labs, and every repo under them.
Repository visibility: in my namespaces, every repo in acme is public; in octo-dev, the repos dotfiles and notes are private and the rest are public; every repo in acme-labs is private.
Branch protection: in my namespaces, the default branch requires a pull request and the status check "ci"; the forge blocks force pushes to it.
Toolchain: Node.js with pnpm and Turborepo; installs come from the public npm registry.
Release path: packages publish only from CI, through Changesets release pull requests and npm trusted publishing; nothing is published from this machine.
```

Only write a line the user confirmed, and leave out a line the default already says.

## Step 4: offer `autoMode.allow` rules

Offer a rule only where the defaults are too strict for this user: they asked for it, or the
classifier blocked that action before. Each rule names the condition the agent must confirm and what
is still not covered.

### Merges

The merge rule is in the [advanced tier](advanced-tier.md#merges-in-auto-mode-automodeallow). When
the Source control entry exists, write "in a repo in my namespaces" in place of its owner list.

### Queued merge

The built-in "Merge Without Review" rule already exempts `gh pr merge --auto` on a repo whose branch
protection requires reviews, and blocks it on an unprotected repo (`claude auto-mode defaults --label
'Merge Without Review'`). This rule covers a repo that requires checks but no review:

```text
Queuing a pull request to merge once its checks pass (`gh pr merge --auto`, or adding it to the merge queue), for a pull request the agent opened or was asked to work on, in a repo in my namespaces whose base branch requires status checks, while those checks are still pending: the forge merges only after the required checks pass. `gh pr merge --admin`, queuing in a repo whose base branch requires no check, and changing branch protection are still not covered.
```

For GitLab and Azure DevOps, use the queued-merge command and guard from the
[advanced tier](advanced-tier.md#queued-merge). Write the host's bypass deny entries with it.

### Force-push after a rebase

The built-in "Git Destructive" rule treats `--force-with-lease` as the careful form, and force-pushing
the agent's own branch as normal. Offer this rule only when the classifier blocked a lease push the
user wanted, such as on a branch from an earlier session:

```text
Force-pushing with `--force-with-lease` or `--force-if-includes` to a non-default branch of a repo in my namespaces, to update a branch after a rebase or amend. A plain `--force` or `-f`, a `+refspec`, and a force-push to the default branch, a release branch, or a branch someone else pushed to are still not covered.
```

The rule names the lease forms only, so it agrees with the [deny list](deny-list.md)'s force-push
group, which blocks a plain `--force` and leaves the lease allowed. Offer that group with the rule if
the user does not have it.

## Step 5: write

- User scope only: `~/.claude/settings.json`. Show the diff and ask before writing.
- Append. Never remove or reorder an entry the user has.
- A list that does not exist yet starts with `"$defaults"`, so the built-in entries stay in force.
  An `environment` list without `"$defaults"` was most likely written by `/auto-mode-setup`, which
  spells out the built-in entries instead; append to it as it is.
- Read the file back and parse it, then run `claude auto-mode config` to confirm the classifier sees
  the new entries. Offer `claude auto-mode critique`, which reviews the custom rules for ambiguity.

`/auto-mode-setup` is Claude Code's own way to draft environment entries from the project and recent
sessions. Mention it as the alternative. This step differs in that it asks `gh` which namespaces the
user owns.

## Refresh

When the user joins a new organization or creates one, or a later run's namespace discovery finds
one that the Source control entry does not name, offer to rewrite that entry and the visibility entry.
Show the old and new text side by side, and write only on approval. Rules that say "my namespaces"
need no change.
