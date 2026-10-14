---
description: What the GitHub tracker can do for issue, epic, and initiative skills; operations, levels, categories, and visibility.
tags: [project-tracker, github, issue]
contract: 1
---

## Tracker

- Name: `github`
- Visibility: public for a public repository, private for a private one. Read it with `gh repo view --json isPrivate`.
- Levels held: issue, epic, initiative.
- Categories held: bug, feature, task.
- Needs `gh` 2.98.0 or later (`--type`, `--parent`, and `--add-sub-issue` arrived in 2.94.0; `--search-type` in 2.98.0). Check with `gh --version`; when older, tell the user to upgrade and stop.

## Detect

- The `origin` remote host is `github.com`: `git remote get-url origin`.
- `gh auth status` succeeds. When `gh` is missing or logged out, run the `init-buddy` skill if it is installed; otherwise tell the user to install and log in.
- The repository is `<owner>/<repo>` from the remote; pass it as `--repo` on every call.

## Kinds

Read the issue types of the repository:

```bash
gh api graphql -f query='{repository(owner:"<owner>",name:"<repo>"){issueTypes(first:20){nodes{name}}}}' \
  --jq '(.data.repository.issueTypes.nodes // [])[].name'
```

- Types come back (organization-owned repositories; defaults are `Bug`, `Feature`, `Task`): the type carries the category. Map bug to `Bug`, feature to `Feature`, task to `Task`. When a team renamed or removed a type, use the closest name from the list; when none fits, create the issue without a type and say so.
- `issueTypes` is `null` or empty (user-owned repositories have no issue types): the label carries the category. Bug is `bug`, feature is `enhancement`, task has no default label, so use `task` only when `gh label list --repo <owner>/<repo> --json name --jq '.[].name'` shows it. Never pass `--type` to such a repository: tested on a user-owned repository, `gh issue create --type Bug` creates the issue without a type and then exits 1 with `type "Bug" not found`, so a retry files a second copy.
- Level: an `epic` or `initiative` label. An issue with neither is an issue.
- Use only labels and types that exist. Do not create labels, except a missing level label after the user says yes to it (see **Retype**, Limits).

## Search

Run at least two passes:

```bash
gh issue list --repo <owner>/<repo> --state all --limit 10 \
  --search "<keywords> in:title,body" --json number,title,state,url
gh search issues "<keywords>" --repo <owner>/<repo> --search-type hybrid --limit 10 \
  --json number,title,state,url
```

Use the full title for the first pass and the core noun and verb for the second. Each hit is a number, title, state (open or closed), and URL.

## Create

```bash
gh issue create --repo <owner>/<repo> --title "<title>" --body-file <file> \
  [--type "<Bug|Feature|Task>"] [--label "<label>"...] [--parent <number|url>]
```

- Write the body to a temporary file and pass `--body-file`; never inline user text in the shell.
- Use `--type` when Kinds returned types; use `--label` for the category when it did not.
- For an epic, add `--label epic`; for an initiative, add `--label initiative`. Both keep the category type of the work.
- `--parent` attaches the new issue as a sub-issue of an existing one.
- `gh issue create` prints the URL of the new issue.
- When `gh issue create` exits non-zero, list the newest issues (`gh issue list --repo <owner>/<repo> --state all --limit 3`) before any retry: some failures leave an issue behind (`--type` on a repository without types does; a missing `--label` does not, it fails with `could not add label`).

## Link

- Child of: `--parent <number|url>` at create, or `gh issue edit <parent> --add-sub-issue <child>[,<child>...]` for existing issues. A child in another repository, even under another owner, attaches by its URL. Limits: 100 sub-issues per parent, 8 levels deep; read `subIssuesSummary` before attaching.
- Detach: `gh issue edit <parent> --remove-sub-issue <child>`.
- Blocked by or blocking, and related items: `gh issue edit <n> --add-blocked-by <other>`, or a line in the body (`Related to #12`) when the host does not support relationships (GitHub Enterprise Server before 3.19).
- Read the tree: `gh issue view <n> --json subIssues,subIssuesSummary,parent`.

## Retype

A level change on GitHub is in place, except epic → initiative: the item keeps its number, URL, comments, and type. Only the label changes, so the item stays in this repository; a level the routing puts on another tracker is a move, not a retype. Epic → initiative makes a new parent, because an initiative's body is a goal and a metric, not an outcome.

| Change | Steps | Open children |
|---|---|---|
| issue → epic | `gh issue edit <n> --add-label epic`; rewrite the body with `gh issue edit <n> --body-file <file>` when the skill moves its acceptance criteria into a child; then link the children | n/a: an issue has none |
| epic → initiative | a new item: run `Create` with `--label initiative`, then `gh issue edit <initiative> --add-sub-issue <epic>`; the epic keeps its label, body, and number | stay under the epic; the epic becomes the initiative's first epic |
| epic → issue | `gh issue edit <n> --remove-label epic` | kept as sub-issues unless the user asks to detach them; a child is never closed |
| initiative → epic | swap the label back: `--remove-label initiative --add-label epic`; rewrite the body with `gh issue edit <n> --body-file <file>` to drop the `Metric` section | kept as sub-issues unless the user asks to detach one (`--remove-sub-issue`); a child is never closed |

Limits: 100 children per parent, 8 levels. The level label must exist (`gh label list --repo <owner>/<repo> --search <label>`); when it does not, ask before creating it with `gh label create <label> --repo <owner>/<repo>`.

## Close

```bash
gh issue close <n> --repo <owner>/<repo> --reason "completed|not planned" [--comment "<why>"]
```

Done is `completed`. Not planned and moved are `not planned`; for moved, comment with the destination, unless the destination is a private tracker and this repository is public (then say only that it is tracked internally).

## Url

- `gh issue create` and `gh issue view <n> --json url --jq .url` print the URL.
- `https://github.com/<owner>/<repo>/issues/<n>` parses to repository and number.
