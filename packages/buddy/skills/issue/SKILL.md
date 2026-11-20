---
name: issue
description: "Files a bug, feature, or task as an issue on the project's tracker; searches for duplicates first."
argument-hint: "[--as-prompt] [description]"
---

# Issue

Files one well-formed item of tracked work (a bug, a feature, or a task) on the project's issue tracker, after checking for existing similar items to avoid duplicates.

Use when asked to file an issue, create a ticket, file a bug, open a feature request, add a task, or report a problem.

This skill files a **single issue**. It is not for an epic or an initiative, and not for a comment on an item that already exists (that is `to-question`). Never file a security vulnerability (a flaw that lets someone run code, or read or change data, they are not allowed to) as a public issue: send it to the repository's private channel (a GitHub security advisory, or the contact in `SECURITY.md`) and stop. Check for this first, before step 1.

## Modes

- **File** (the default): file the issue on the tracker.
- **`--as-prompt`**: hand the filing to another agent. Take it when the request passes `--as-prompt`, or asks for a prompt, a hand-off, or a request to file the issue from another agent or session. Run every step as in File mode, then reply with the prompt from step 5 in place of the create. Nothing is written to the tracker, so the `Ownership` operation does not run. The security check and the level check still run: a security vulnerability never becomes a prompt; send it to the private channel and stop. Several issues from one request each get their own prompt.

  Where File mode would stop because this session cannot reach the tracker (Trackers step 7 finds the tool missing, older, or logged out, or the user has no permission to create there), go on: note why, and in step 3 record the search as not run. For a dependency with no intake document (What the issue is about, step 4), go on with the dependency's own tracker as the target, using this skill's templates and, for a `github.com` or GitLab address, the bundled reference for that host with that repository as the destination.

## Categories

| Category | Use when | Template reference |
|---|---|---|
| bug | something behaves differently than it should | `project-tracker.template.bug` |
| feature | new behavior someone wants | `project-tracker.template.feature` |
| task | work to be done that is neither a defect nor new behavior (a chore, a refactor, a migration) | `project-tracker.template.task` |

If the category is unclear from the request, ask, before the Trackers steps: a routing picks the tracker by category.

## What the issue is about

Decide this first, before the Trackers steps. The issue is about a **dependency** when the user names one ("file this against X") or when the failure leads into a dependency's code, not the current repository's. Otherwise it is about the current repository: skip this section.

For a dependency, work out its npm package name, then:

1. Load `project-tracker.intake.interface` (what an intake document holds) with the `reference` skill of `cyber-agentkit`, as [References](#references) says.
2. List the intake documents: `reference search project-tracker.intake`, run as [References](#references) says. Keep only hits whose `match` is `prefix`, and drop the interface itself, `project-tracker.intake.interface`. The list includes a document a plugin ships to only one package of a monorepo. When the command cannot run, no intake document can be read: go to step 4.
3. Load each kept document and keep the one whose `Applies to` names the package exactly. A document that arrives only as a project section (`projectSections` in the JSON, with a `folder` and a `plugin`) is the document for that folder: use it when the working folder is inside `folder`, else treat it as no match. Two matches, or a name ambiguous between plugins: report both qualified names, ask which to use, and load neither until answered. A document whose version (`implements`) is missing or not one the interface declares: name the document and the version, and stop.
4. No match: do not file in this repository. Read the dependency's own tracker, the `bugs` field of its `package.json` (in `node_modules`, else `npm view <package> bugs repository --json`), or else its `repository`. Give the user that address, say the dependency ships no intake document, and stop.

With a match, that document takes the routing's place for this one filing: its `Tracker` replaces Trackers steps 1 to 5 (see Trackers), its `Before filing` steps run before the summary, its `Criteria` are checked before the create, and its `Template` sections go into the body. The project's own routing and the repository's `origin` host play no part.

## References

Each `reference <subcommand> ...` here is the `reference` command of `cyber-agentkit`, not a program on PATH. Run it as the `Run the command` section of that plugin's `reference` skill (`cyber-agentkit:reference` in Claude Code) says: `node <reference skill folder>/scripts/reference.mjs <subcommand> ...`, or the `npx -y cyber-agentkit@<version> reference` form it gives when the script cannot start. The command **cannot run** when neither starts.

Each reference below loads through the `reference` skill, so a project's own override applies:

- Before step 1: Load `project-tracker.levels` (the level checks) and `project-tracker.capabilities.interface` (what a capabilities reference holds) with the `reference` skill of `cyber-agentkit`.
- For a dependency, after the intake document is chosen: the document itself, by its name. A team may override it with `reference customize`; load it through the `reference` skill so the override applies.
- When the category is known: Load the template reference for it from the table above, `project-tracker.template.bug`, `project-tracker.template.feature`, or `project-tracker.template.task`, with the `reference` skill of `cyber-agentkit`. Keep every section it has, in order; write `None` under one you have nothing for. For a task, never leave `Done when` or `Out of scope` as `None`: propose a check and a boundary from the request, and show them in the summary. A section a team adds or rewords is part of the template. Its headings are the only fixed part: a team may reword the text under them or add a section.

When the command cannot run, the `reference` skill reads each name's `references/<name>.default.md` in this skill's folder instead; say which names have none.

When a load warns `reference-legacy-format` or `reference-renamed`, a file is in a cyber-agentkit 1 form or under an old name: run `reference migrate` with the `reference` skill in the `cyber-agentkit` plugin, show the user its plan, and run it again with `--write` only on their yes. Then go on with the reference as loaded. When the command cannot run, migrate nothing, tell the user, and go on.

## Trackers

**With an intake document**, skip steps 1 to 5. Read `Pin` and `Destination` from its `Tracker` section, run `reference load <pin> --format json --metadata` on the pin, and handle a `missing` or `ambiguous` status as in step 2: name the pin and the problem, suggest the dependency's author check the document, and stop. When the command cannot run, name the pin, say so, and stop. Go on with step 6 and step 7, and give the tracker's reference the `Destination` as its scope in place of the one `Detect` resolves from the repository. Where the document and the reference disagree on `Visibility`, the document's applies.

A tracker's operations live in a capabilities reference named `project-tracker.capabilities.<tracker>`. This skill owns the workflow; the reference owns the commands.

1. Look for a routing: `reference load project-tracker.routing --format json`. Status `missing` means there is no routing; go to Trackers step 3. When the command cannot run, read `.agents/references/project-tracker.routing.md` directly: absent means no routing (go to Trackers step 3); present means a routing exists whose pins cannot be resolved, so name the first matching pin, say the `reference` command cannot run, suggest running `project-tracker` check once it can, and stop. Its format is in `project-tracker.capabilities.interface` (the `Routing` section).
2. With a routing, take the first `Routes` row that matches the issue level and the category. No row matches: name the pair, suggest running `project-tracker` change, and stop. Run `reference load <pin> --format json --metadata` on the row's pin. Its status is `missing` or `ambiguous` (the bare name is held by more than one plugin): name the pin and the problem, suggest running `project-tracker` check, and stop. When the command cannot run, name the pin, say so, suggest running `project-tracker` check once it can, and stop. Otherwise load that reference and go to Trackers step 6; skip the host steps, since the routing replaces them.
3. Read the host of `git remote get-url origin`. A host that is neither `github.com` nor GitLab (`gitlab.com`, or a host `glab auth status --hostname <host>` accepts), including Bitbucket, whose native tracker is gone: say that no tracker is set up for it, and stop. Do not file anywhere else.
4. List what is installed: run `reference search project-tracker.capabilities`. Keep only hits whose `match` is `prefix`, which may carry a `<plugin>/` qualifier; drop the interface itself, `project-tracker.capabilities.interface`, and fuzzier matches. When the command cannot run, go to step 5.
5. Load the one whose `Detect` section matches the host. Two matches, or a name that is ambiguous between plugins: report both qualified names, ask which to pin, and load neither until answered. When the command cannot run, or nothing is left after step 4 drops the fuzzier names, use the tracker this skill bundles for the host: Load `project-tracker.capabilities.github` or `project-tracker.capabilities.gitlab` with the `reference` skill of `cyber-agentkit`: the first for `github.com`, the second for GitLab.
6. Read the version in the `metadata` of `reference load <name> --format json --metadata`, or in the frontmatter of a bundled reference: `implements` (`project-tracker.capabilities@<version>`), or `contract` when there is no `implements`. When the command cannot run, read the frontmatter of the bundled reference step 5 loaded. When it is missing, or is not a version `project-tracker.capabilities.interface` declares, name the tracker and the version, and stop.
7. Run the reference's `Detect` checks. For GitHub they need `gh` 2.98.0 or later and a logged-in `gh`; for GitLab, a `glab` logged in to the host. When the tool is missing, older, or logged out, say what to install, upgrade, or run, and stop.

Where the reference marks an operation unsupported: with no `Search`, the user confirms there is no duplicate; with no native `Link`, put the link in the body; with no `Ownership`, ask for confirmation before creating.

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

### 4. Summarize, and confirm unless the user owns the tracker

With an intake document, run its `Before filing` steps first, confirming with the user before any step that changes the machine, and carry what they produced (a reproduction link, the latest version checked) into the summary. A step that cannot run: say so, and ask the user whether to go on without it; do not skip it silently.

Run the tracker's `Kinds` operation so the type or label is known. Summarize what will be created: title, category, key points of the description, the type or label the tracker will use, and any environment details.

In `--as-prompt` mode, show the summary, ask only when the level check found the item too big or too small, and go to step 5. Otherwise run the tracker's `Ownership` operation (its format is in `project-tracker.capabilities.interface`):

- **`owned`**, and the level check found nothing: show the summary and go to step 5 in the same turn. Do not wait for a reply.
- **`owned`**, and the level check found the item too big or too small: show the summary with the suggestion and ask, as for a tracker the user does not own.
- **`not owned`**, or unknown (no `Ownership` section, a section marked unsupported, a failed command, or an answer the section does not map): ask for confirmation. Do not proceed without it.

### 5. Create

In `--as-prompt` mode, do not run `Create`: write the prompt as [Hand off](#hand-off-as-prompt) says, and go to step 6.

With an intake document, check each item of its `Criteria` first. State each as met or not met, with how you know. Create only when every item is met, or the user waives the unmet ones by name; otherwise stop and say which are unmet.

Run the tracker's `Create` operation with the category `Kinds` mapped to. Write the body from the category's template reference to a file, with every section the reference has, then add the sections the intake document's `Template` holds under the category's heading, and under `any`, after the template's own.

If a create command fails, check for an issue it left behind before retrying (the reference says how). When one is there, do not retry: give its URL as the new issue in the Report step. When none is, say nothing was filed before any retry.

Keep the body free of internal file names, commit SHAs, and implementation details unless the user asks. If the tracker is public (the `Visibility` in its `Tracker` section; for GitHub and GitLab, the repository's), keep out anything from a private tracker (its titles, URLs, or customer details).

### 6. Report

In `--as-prompt` mode, reply with the prompt and one line above it that names the agent it suits (one with the target repository checked out, or logged in to its tracker). Add no routing line. Otherwise, give the URL of the new issue. When a routing or an intake document chose the tracker, add nothing. When the tracker was found without a routing (Trackers step 3 onward), end with one line that offers the draft instead of naming the skill, for example: "Save GitHub as the tracker for all work in this repo? (y)". Offer it only when the `project-tracker` set-up draft would route all work to the tracker just used (it is the only kept tracker that matches, with no conflicting signal); otherwise end with one line suggesting `project-tracker`. A yes hands the draft to `project-tracker` set-up, which writes the routing after that yes; a no or no answer writes nothing. Ask once per filing session: after the offer has been made, a later filing in the same session adds no line.

## Hand off as prompt

The prompt is one fenced block the user copies whole; use a fence longer than any run of backticks in the body. The receiving agent has none of this session's context, so the block states, in this order:

1. **Target**: the tracker (GitHub or GitLab), the host, and the destination (`<owner>/<repo>`, or the GitLab project), with its visibility.
2. **Kind**: the type or label `Kinds` returned; when it did not run, the category, for the receiver to map with its own `Kinds`.
3. **Title** and **body**, exactly as the summary showed them, the body built as step 5 says, intake `Template` sections included.
4. **Searches run**: each query, each hit (number, title, state, URL), and that the user judged none a match; or that no search ran, and why.
5. **Before filing**: run the search again with those queries and one of the receiver's own, since time has passed. A hit that is the same issue: file nothing, and report its URL. With an intake document, check each of its `Criteria` and file only when all are met.
6. **How to file**: write the body to a file and pass the file to the tracker's `Create` command (for GitHub, `gh issue create --repo <owner>/<repo> --title "<title>" --body-file <file>` with `--type` or `--label`); never pass the body through the shell. On a failed create, check for an issue left behind before any retry. Filing is approved: change the title or body only to fit the tracker.
7. **Report back**: the URL of the new issue, or of the duplicate found.

Keep out of the block what step 5 keeps out of the body, and any detail from this session the target's visibility does not allow.

## Level check

Read the issue level's `Too big` and `Too small` sections in `project-tracker.levels`. When the item meets them, say so in the summary and ask before creating, even on a tracker the user owns. For an item that is too big, suggest an epic (the `epic` skill when it is installed; otherwise one parent issue with child issues); for one that is too small, suggest not tracking it. Only suggest; file at this level if the user does not change it.

## What NOT to Do

- Do not create an issue without checking for duplicates first
- Do not create without the user's confirmation unless the tracker's `Ownership` answered `owned` and the level check found nothing; unknown ownership asks
- Do not invent labels or issue types: use only those the repository has
- Do not file an epic or initiative here, or a security vulnerability publicly
- Do not file an issue about a dependency in the current repository's tracker
- Do not close, retype, or move an existing item
- In `--as-prompt` mode, do not write anything to the tracker

## Validate

- [ ] The description in the frontmatter is at most 120 characters, and `name` equals the directory name
- [ ] The levels, the contract, and the category's template were loaded, and the capabilities reference's `contract:` was checked
- [ ] The request was checked for a security vulnerability before any step ran
- [ ] The tracker's capabilities were loaded (the pinned one when a routing or an intake document exists)
- [ ] For a dependency, the intake documents were listed and matched by `Applies to`; with none, nothing was filed in this repository and the dependency's own tracker was named
- [ ] With an intake document, no routing or host detection ran, its `Before filing` steps ran before the summary, and every `Criteria` item was met or waived by name before the create
- [ ] With a routing, no host detection ran, and a missing or ambiguous pin or an unmatched route stopped the skill before any search
- [ ] At least two searches with different keywords ran before any create command
- [ ] The summary was shown before any create command, and a create without the user's confirmation ran only when `Ownership` answered `owned` and the level check found nothing
- [ ] The body of a task or feature carries no bug-only section; a public issue carries no private-tracker detail
- [ ] The URL of the new issue, or of the existing duplicate, was returned; in `--as-prompt` mode, one prompt per issue was returned instead
- [ ] In `--as-prompt` mode, no `Ownership` or `Create` ran, and the prompt named the target, kind, title, body, the searches and their hits, the re-search, filing from a file, and the URL to report back
- [ ] Without a routing, the closing line offered the draft at most once per session, and nothing was written without a yes
