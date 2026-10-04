# setup-github-repo

Applies a standard set of GitHub repository settings with the `gh` CLI: merge options, Dependabot security updates, a ruleset that protects the default branch, and, if you want them, starter CI workflow files. It reads the current state first and skips anything already configured, so running it again on a configured repo changes nothing.

## When to use

- "set up this new GitHub repo"
- "add branch protection" / "turn on Dependabot"
- "scaffold CI workflows for this repo"
- "make this repo's settings match our others"

## What it does

1. **Checks prerequisites:** `gh` logged in and a git remote present. If `gh` is missing or logged out, it runs [`init-buddy`](../init-buddy/README.md) when that is installed, and otherwise tells you what to fix.
2. **Detects the current state** with a bundled script, then summarizes the pending changes and asks you to confirm. The state snapshot goes to the OS temp directory, never into the repo. If an earlier version of the skill left `.github/setup-state.json` in the repo, the script deletes it and the skill tells you.
3. **Applies the repository settings:** delete branches on merge, allow auto-merge, squash and rebase merges, and updating a PR branch, and turns off merge commits.
4. **Turns on Dependabot security updates** if they are off.
5. **Creates a branch ruleset** named `default-branch-protection` when no branch ruleset exists. It blocks deleting and force-pushing the default branch, with Administrators and Maintainers able to bypass. When it also writes `pull-request.yml`, it requires the `all-checks` status check. Otherwise it asks whether you want required checks and which job names to use.
6. **Scaffolds workflow files**, if you want them. In a repo with no workflows it offers all four; in one that has some, it offers only the ones the repo's files call for. It never overwrites an existing file.

   | File | What it does |
   |---|---|
   | `pull-request.yml` | CI on pull requests, across Node.js 20, 22, and 24 for a JS/TS project, plus an `all-checks` gate job that fails if any job failed |
   | `release.yml` | the same CI on pushes to the default branch, then a release job with a placeholder for your release steps |
   | `dependabot-automerge.yml` | approves and auto-merges Dependabot patch and minor updates, never majors |
   | `codeql.yml` | CodeQL analysis for the detected language, on pushes, pull requests, and a weekly schedule |

   The CI steps are placeholders marked `TODO`. Review and fill them in before you commit.
7. **Offers optional settings**, each applied only if you say yes: turning off the wiki, projects, or discussions, and turning on secret scanning and push protection. For GitHub Pages it points you to the GitHub UI.
8. **Prints a summary** of what it applied, what was already configured, and what you deferred.

## Notes

- `--enable-auto-merge` turns the feature on for the repo; it does not merge any PR by itself.
- A required status check only appears in GitHub after CI has run once. If CI has never run, add the check after the first run, or run the skill again then.
- The generated workflows are standalone and reference no organization's shared workflows. If your org has its own, replace the generated contents.

## How to invoke

Ask for it directly, or run `/setup-github-repo` where slash commands are supported. It works on the repo in the current directory.

## What it produces

Updated repository settings, Dependabot security updates on, a default-branch ruleset, any workflow files you chose under `.github/workflows/` (not committed), and a summary of applied, skipped, and deferred changes.

## Install

Install the `repobuddy` plugin (see the [repository readme](../../../../readme.md#installing-as-a-plugin)), or add
the skill alone:

```sh
npx skills add repobuddy/repobuddy --skill setup-github-repo
```

A skill installed with `skills add` comes from git and has no built `scripts/` folder. It runs its
scripts through `npx -y repobuddy@^1.9.0` instead, which needs network access. The plugin install
ships the scripts with the skill.
