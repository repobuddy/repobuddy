# Auto mode (Claude Code)

Read this before the auto-mode step. It covers where each kind of rule goes when the user runs Claude
Code in auto mode, how to write `autoMode.environment` from what `gh` can discover, which
`autoMode.allow` rules to offer, and how to refresh them later.

The steps run `scripts/auto-mode.mjs` from this skill's directory. It does the reading, the `gh`
calls, the wording, and the file write, so they come out the same every run. You do the asking, and
the user decides:

```bash
node <this-skill-dir>/scripts/auto-mode.mjs check    [--project <repo>]
node <this-skill-dir>/scripts/auto-mode.mjs discover [--project <repo>]
node <this-skill-dir>/scripts/auto-mode.mjs render   <answers.json>
node <this-skill-dir>/scripts/auto-mode.mjs apply    <entries.json> [--write] [--verify]
```

Each prints JSON. Write `answers.json` and `entries.json` in a temporary directory, never in the repo.

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

Run `auto-mode.mjs check`. It reads only the `autoMode` and `permissions` keys.

1. **The mode.** `mode.auto` is true when a settings file sets `permissions.defaultMode` to `"auto"`.
   If it is false, ask whether the user starts sessions in auto mode (`--permission-mode auto`, or
   Shift+Tab).
2. **Template text.** Each `templateText` item is an entry that still holds braces such as
   `{COMPANY_NAME}`, angle placeholders such as `<owners>`, `TODO` or `TBD`, or instructions to the
   reader such as "say so here" (a placeholder in a code span or a path is syntax, and is skipped).
   Show the entry and its `markers`, and offer to fill it in from the next step.
3. **Ignored blocks.** Each file in `ignoredProjectBlocks` holds `autoMode` in project settings, where
   the classifier ignores it. Offer to move its entries to `~/.claude/settings.json`.
4. **Missing `"$defaults"`.** `missingDefaults` names a `soft_deny` or `hard_deny` list that discards
   the built-in rules. Point to `review-permissions`; this step does not edit those lists.
5. **The effective config.** Run `claude auto-mode config` when the user wants to see what the
   classifier uses, the built-in rules included.

## Step 2: discover the environment

Discover what you can, then ask for the rest. Show each finding as a draft entry; the user confirms
or corrects it.

Run `auto-mode.mjs discover`. It runs only `gh` reads, and needs `gh` logged in to GitHub.

**Namespaces.** `namespaces` lists the personal account and every organization membership with its
`role` and `state`. `proposed` is true for the account and every `active` organization where the
role is `admin`: propose those. Ask about each `active` `member` one separately. Leave out `pending`
ones. An `errors` line about `read:org` means the token lacks that scope; `gh auth login` grants it
by default, so ask the user to refresh the login (`! gh auth refresh -s read:org`) or name the
organizations. On other hosts, use the suggestion command in the
[advanced tier's owner table](advanced-tier.md#fill-it-in-per-host), or ask.

**Visibility.** Each namespace's `visibility.summary` is `public`, `private`, `mixed`, or `empty`,
with the repo names on each side. `INTERNAL` repos count as private. Show the summary, not the lists.

**The rest:**

| Entry | Discover | Then ask |
|---|---|---|
| Branch protection | `branch`: this repo's default branch, its required checks and reviews, merge queue, and force-push block | whether the same holds across the user's namespaces, and the exceptions |
| Toolchain | `repo.packageManager` and `repo.lockfiles` | whether it holds across the user's repos |
| Release path | `repo.changesets` and `repo.publishWorkflows` | whether anything is ever published from this machine |
| Host containment | the OS and WSL from detection | whether sessions run in a container, VM, or with an egress allow-list. Write the entry only when the answer differs from the default, an ordinary machine with open internet |
| Local services | nothing | services the agent may reach, such as a local database for tests |

## Step 3: draft the entries

Keep the namespace list in one entry, and have every other entry and `autoMode.allow` rule refer to
it as "my namespaces". The built-in rules refer to environment entries by name the same way. A list
copied into several entries drifts: one entry gains an org that the other never hears of.

Write the confirmed answers to `answers.json` and run `auto-mode.mjs render answers.json`:

```json
{
  "namespaces": [ <the namespace objects from discover that the user kept> ],
  "branchProtection": "in my namespaces, the default branch requires a pull request and the status check \"ci\"",
  "toolchain": "Node.js with pnpm and Turborepo; installs come from the public npm registry.",
  "releasePath": "packages publish only from CI; nothing is published from this machine.",
  "hostContainment": "<only when it differs from the default>",
  "keyInternalServices": "<only when the user named some>",
  "rules": { "merge": false, "queuedMerge": false, "forceWithLease": false }
}
```

Leave out a key the user did not answer. It prints `environment`, `allow`, and `deny` lists, ready for
`apply`. The environment entries read like this:

```text
Source control: my namespaces, which other entries and rules refer to by that name, are the GitHub account octo-dev and the GitHub organizations acme and acme-labs, and every repo under them.
Repository visibility: in my namespaces, every repo in acme is public; in octo-dev, the repos dotfiles and notes are private and the rest are public; every repo in acme-labs is private.
Branch protection: in my namespaces, the default branch requires a pull request and the status check "ci"; the forge blocks force pushes to it.
Toolchain: Node.js with pnpm and Turborepo; installs come from the public npm registry.
Release path: packages publish only from CI, through Changesets release pull requests and npm trusted publishing; nothing is published from this machine.
```

Show every line with its rubric row. Only keep a line the user confirmed, and leave out a line the
default already says.

## Step 4: offer `autoMode.allow` rules

Offer a rule only where the defaults are too strict for this user: they asked for it, or the
classifier blocked that action before. Each rule names the condition the agent must confirm and what
is still not covered. For GitHub, `render` writes each rule set to `true` under `rules`, and adds the
deny entries it needs to its `deny` list. The texts below are the ones it writes.

### Merges

The merge rule is in the [advanced tier](advanced-tier.md#merges-in-auto-mode-automodeallow). For
GitHub, `"rules": { "merge": true }` renders it with "in a repo in my namespaces" in place of the
owner list. For other hosts, write it from the advanced tier's table.

### Queued merge

The built-in "Merge Without Review" rule already exempts `gh pr merge --auto` on a repo whose branch
protection requires reviews, and blocks it on an unprotected repo (`claude auto-mode defaults --label
'Merge Without Review'`). This rule covers a repo that requires checks but no review:

```text
Queuing a pull request to merge once its checks pass (`gh pr merge --auto`, or adding it to the merge queue), for a pull request the agent opened or was asked to work on, in a repo in my namespaces whose base branch requires status checks, while those checks are still pending: the forge merges only after the required checks pass. `gh pr merge --admin`, queuing in a repo whose base branch requires no check, and changing branch protection are still not covered.
```

`render` writes this one with `"queuedMerge": true`. For GitLab and Azure DevOps, use the
queued-merge command and guard from the [advanced tier](advanced-tier.md#queued-merge), and write the
host's bypass deny entries with it.

### Force-push after a rebase

The built-in "Git Destructive" rule treats `--force-with-lease` as the careful form, and force-pushing
the agent's own branch as normal. Offer this rule only when the classifier blocked a lease push the
user wanted, such as on a branch from an earlier session:

```text
Force-pushing with `--force-with-lease` or `--force-if-includes` to a non-default branch of a repo in my namespaces, to update a branch after a rebase or amend. A plain `--force` or `-f`, a `+refspec`, and a force-push to the default branch, a release branch, or a branch someone else pushed to are still not covered.
```

`render` writes it with `"forceWithLease": true`. The rule names the lease forms only, so it agrees with the [deny list](deny-list.md)'s force-push
group, which blocks a plain `--force` and leaves the lease allowed. Offer that group with the rule if
the user does not have it.

## Step 5: write

Write what the user kept from `render` to `entries.json` (`environment`, `allow`, and `deny` lists),
then:

1. Run `auto-mode.mjs apply entries.json`. Without `--write` it changes nothing. Show the user its
   `before`, `after`, and `skipped`, and ask before writing.
2. On a yes, run it again with `--write --verify`. It writes `~/.claude/settings.json` only: user scope
   is the one file the classifier reads `autoMode` from. It appends and never removes or reorders an
   entry. A list that does not exist yet starts with `"$defaults"`, so the built-in entries stay in
   force. An `environment` list without `"$defaults"` was most likely written by `/auto-mode-setup`,
   which spells out the built-in entries instead, so it stays as it is. The `deny` entries go to
   `permissions.deny` in the same write, so a rule never lands without its guard.
3. `verified: true` means `claude auto-mode config` shows the new entries. `false`, or a note that it
   did not run, means check by hand. Offer `claude auto-mode critique`, which reviews the custom rules
   for ambiguity.

`/auto-mode-setup` is Claude Code's own way to draft environment entries from the project and recent
sessions. Mention it as the alternative. This step differs in that it asks `gh` which namespaces the
user owns.

## Refresh

When the user joins a new organization or creates one, run `discover`. `refresh.missing` lists the
proposed namespaces the Source control entry does not name. Offer to rewrite that entry and the
visibility entry: `render` with the full namespace list, and show the old and new text side by side.
On approval, write them with `apply`, using `"replace": [{ "old": "<old entry>", "new": "<new entry>" }]`
in `entries.json`, which swaps each entry in place. Rules that say "my namespaces" need no change.
