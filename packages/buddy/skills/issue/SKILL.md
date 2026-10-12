---
name: issue
description: "Use this skill when filing a bug, feature, or task as an issue on GitHub or GitLab; searches for duplicates first."
---

# Issue

Files one well-formed item of tracked work (a bug, a feature, or a task) on the project's issue tracker, after checking for existing similar items to avoid duplicates.

Use when asked to file an issue, create a ticket, file a bug, open a feature request, add a task, or report a problem.

This skill files a **single issue**. It is not for an epic or an initiative, and not for a comment on an item that already exists (that is `to-question`). Never file a security vulnerability (a flaw that lets someone run code, or read or change data, they are not allowed to) as a public issue: send it to the repository's private channel (a GitHub security advisory, or the contact in `SECURITY.md`) and stop. Check for this first, before step 1.

## Categories

| Category | Use when | Template reference |
|---|---|---|
| bug | something behaves differently than it should | `repobuddy.work-template.bug` |
| feature | new behavior someone wants | `repobuddy.work-template.feature` |
| task | work to be done that is neither a defect nor new behavior (a chore, a refactor, a migration) | `repobuddy.work-template.task` |

If the category is unclear from the request, ask.

## References

Load these with the `reference` skill in the `cyber-agent-harness` plugin, so a project's own override applies:

- Before step 1: `repobuddy.work-levels` (the level checks) and `project-tracker.contract` (what a capabilities reference holds).
- When the category is known: the template reference for it, from the table above. Keep every section it has, in order; write `None` under one you have nothing for. For a task, never leave `Done when` or `Out of scope` as `None`: propose a check and a boundary from the request, and show them in the confirmation. A section a team adds or rewords is part of the template. Its headings are the only fixed part: a team may reword the text under them or add a section.

## Trackers

A tracker's operations live in a capabilities reference named `project-tracker.capabilities.<tracker>`. This skill owns the workflow; the reference owns the commands.

1. Read the host of `git remote get-url origin`. A host that is neither `github.com` nor GitLab (including Bitbucket, whose native tracker is gone): say that no tracker is set up for it, and stop. Do not file anywhere else.
2. List what is installed: run `reference search project-tracker.capabilities` with the `reference` skill in the `cyber-agent-harness` plugin. Keep only names that start with `project-tracker.capabilities.`; drop fuzzier matches.
3. Load the one whose `Detect` section matches the host. Two matches, or a name that is ambiguous between plugins: report both qualified names, ask which to pin, and load neither until answered.
4. When the command cannot run, or nothing is left after step 2 drops the fuzzier names, and the host is `github.com`, load `project-tracker.capabilities.github` from this skill's `references/` folder.
5. Read `contract:` in the loaded reference's frontmatter. When it is missing, or is not a contract version `project-tracker.contract` declares, name the tracker and the version, and stop.
6. A GitLab host with no GitLab reference: use the **GitLab fallback** at the end of this file.
7. For GitHub, the reference's `Detect` also needs `gh` 2.98.0 or later and a logged-in `gh`. When it is older or logged out, say what to upgrade or run, and stop.

Where the reference marks an operation unsupported: with no `Search`, the user confirms there is no duplicate; with no native `Link`, put the link in the body.

## Steps

### 1. Gather the details

Ask only for what the user has not said:
- **Title**: a short, specific summary
- **Category**: bug, feature, or task
- **Description**: what is happening or wanted; for a bug, steps to reproduce and expected vs actual behavior; for a task, what done looks like

### 2. Gather environment and version details (bugs)

Collect what maintainers need to reproduce: OS, architecture, container/WSL/CI context when relevant; runtime, package manager, and toolchain versions; the affected package version and closely related dependency versions. If the package under test uses one toolchain version and the failing consumer another, record both. Read exact versions from the machine or repo instead of asking. A feature or task gets environment details only when they bear on it.

### 3. Search for existing issues

Run the tracker's `Search` operation at least twice with different keywords (the full title, then the core noun and verb). Show each hit: number, title, state (open or closed), URL, and ask whether one is the same issue.

If the user confirms a match, stop. Give the existing issue's URL and suggest a comment or reaction there. Do not create a duplicate.

### 4. Confirm

Run the tracker's `Kinds` operation (the GitLab fallback has none) so the type or label is known. Summarize what will be created: title, category, key points of the description, the type or label the tracker will use, and any environment details. Ask for confirmation. Do not proceed without it.

### 5. Create

Run the tracker's `Create` operation with the category `Kinds` mapped to. Write the body from the category's template reference to a file, with every section the reference has.

If a create command fails, check for an issue it left behind before retrying (the reference says how). When one is there, do not retry: give its URL as the new issue in step 6. When none is, say nothing was filed before any retry.

Keep the body free of internal file names, commit SHAs, and implementation details unless the user asks. If the repository is public, keep out anything from a private tracker (its titles, URLs, or customer details).

### 6. Report

Give the URL of the new issue.

## Level check

Read the issue level's `Too big` and `Too small` sections in `repobuddy.work-levels`. When the item meets them, say so in the confirmation. For an item that is too big, suggest an epic (the `epic` skill when it is installed; otherwise one parent issue with child issues); for one that is too small, suggest not tracking it. Only suggest; file at this level if the user does not change it.

## GitLab fallback

For a GitLab remote with no capabilities reference: `glab` must be installed and logged in (run `init-buddy` when installed, else tell the user). Search with `glab issue list --all --search "<keywords>"`. Check labels with `glab label list`; use `bug` for a bug and `feature` for a feature, a task takes `task` only if listed, and omit `--label` when the label is not listed. Create with `glab issue create --title "<title>" --description "$(cat <body-file>)" --label "<label>"`, with the body written to a file first.

## What NOT to Do

- Do not create an issue without checking for duplicates first
- Do not skip the confirmation step
- Do not invent labels or issue types: use only those the repository has
- Do not file an epic or initiative here, or a security vulnerability publicly
- Do not close, retype, or move an existing item

## Validate

- [ ] The description in the frontmatter is at most 120 characters, and `name` equals the directory name
- [ ] Every copy in this skill's `references/` equals the file of the same name in `packages/buddy/references/` (`node scripts/sync-skill-references.mjs --check`)
- [ ] The levels, the contract, and the category's template were loaded, and the capabilities reference's `contract:` was checked
- [ ] The request was checked for a security vulnerability before any step ran
- [ ] The tracker's capabilities were loaded, or the GitLab fallback applied
- [ ] At least two searches with different keywords ran before any create command
- [ ] No create command ran without the user's confirmation of the summary
- [ ] The body of a task or feature carries no bug-only section; a public issue carries no private-tracker detail
- [ ] The URL of the new issue, or of the existing duplicate, was returned
