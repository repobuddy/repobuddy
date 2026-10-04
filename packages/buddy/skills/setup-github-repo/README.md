# setup-github-repo

Applies a standard set of GitHub repository settings with the `gh` CLI: merge options, Dependabot security updates, a ruleset that protects the default branch, a merge backstop so every merge is tested against the latest default branch, and, if you want them, starter CI workflow files. It reads the current state first and skips anything already configured, so running it again on a configured repo changes nothing.

## When to use

- "set up this new GitHub repo"
- "add branch protection" / "turn on Dependabot"
- "add a merge queue" / "stop agent merges from breaking main"
- "scaffold CI workflows for this repo"
- "make this repo's settings match our others"

## What it does

1. **Checks prerequisites:** `gh` logged in and a git remote present. If `gh` is missing or logged out, it runs [`init-buddy`](../init-buddy/README.md) when that is installed, and otherwise tells you what to fix.
2. **Detects the current state** with a bundled script, then summarizes the pending changes and asks you to confirm. The state snapshot goes to the OS temp directory, never into the repo. If an earlier version of the skill left `.github/setup-state.json` in the repo, the script deletes it and the skill tells you.
3. **Applies the repository settings:** delete branches on merge, allow auto-merge, squash and rebase merges, and updating a PR branch, and turns off merge commits.
4. **Turns on Dependabot security updates** if they are off.
5. **Creates a branch ruleset** named `default-branch-protection` when no branch ruleset exists. It blocks deleting and force-pushing the default branch, with Administrators and Maintainers able to bypass. When it also writes `pull-request.yml`, it requires the `all-checks` status check. Otherwise it asks whether you want required checks and which job names to use.
6. **Reports the merge backstop, and offers one if there is none.** It tells you whether the default branch already has one: GitHub's merge queue, a rule requiring the branch to be up to date before merging, or a third-party queue such as Mergify (found by its config file). If one exists, it adds nothing. If none does, it offers a `merge-backstop` ruleset with no bypass actors, so an agent running with an admin token goes through it too:
   - a **merge queue** where GitHub offers one: public repos owned by an organization, and private ones on GitHub Enterprise Cloud;
   - otherwise, **require up to date**.

   Either one requires your status checks. For a merge queue, it lists the workflows behind those checks that lack the `merge_group` trigger, without which the queue stalls.
7. **Scaffolds workflow files**, if you want them. In a repo with no workflows it offers all four; in one that has some, it offers only the ones the repo's files call for. It never overwrites an existing file.

   | File | What it does |
   |---|---|
   | `pull-request.yml` | CI on pull requests and merge-queue runs, across Node.js 20, 22, and 24 for a JS/TS project, plus an `all-checks` gate job that fails if any job failed |
   | `release.yml` | the same CI on pushes to the default branch, then a release job with a placeholder for your release steps |
   | `dependabot-automerge.yml` | approves and auto-merges Dependabot patch and minor updates, never majors |
   | `codeql.yml` | CodeQL analysis for the detected language, on pushes, pull requests, and a weekly schedule |

   The CI steps are placeholders marked `TODO`. Review and fill them in before you commit.
8. **Offers optional settings**, each applied only if you say yes: turning off the wiki, projects, or discussions, and turning on secret scanning and push protection. For GitHub Pages it points you to the GitHub UI.
9. **Prints a summary** of what it applied, what was already configured, and what you deferred.

## Notes

- A merge queue adds latency. Every merge waits for a CI run on the merged result, even on a quiet repo where the pull request's own run was already current. Requiring the branch to be up to date costs nothing when it already is, but on a busy repo pull requests race to update, which a queue puts in order. Quiet repos often prefer the second; repos where agents merge in parallel get more from a queue.

- `--enable-auto-merge` turns the feature on for the repo; it does not merge any PR by itself.
- A required status check only appears in GitHub after CI has run once. If CI has never run, add the check after the first run, or run the skill again then.
- The generated workflows are standalone and reference no organization's shared workflows. If your org has its own, replace the generated contents.

## How to invoke

Ask for it directly, or run `/setup-github-repo` where slash commands are supported. It works on the repo in the current directory.

## What it produces

Updated repository settings, Dependabot security updates on, a default-branch ruleset, a `merge-backstop` ruleset if you chose one, any workflow files you chose under `.github/workflows/` (not committed), and a summary of applied, skipped, and deferred changes.

## Install

Install the `repobuddy` plugin (see the [repository readme](../../../../readme.md#installing-as-a-plugin)), or add
the skill alone:

```sh
npx skills add repobuddy/repobuddy --skill setup-github-repo
```

A skill installed with `skills add` comes from git and has no built `scripts/` folder. It runs its
scripts through `npx -y repobuddy@^1.15.0` instead, which needs network access. The plugin install
ships the scripts with the skill.
