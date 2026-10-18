# issue

Files one item of tracked work (a bug, a feature, or a task) on the repository's issue tracker. It searches for an existing issue first and asks you before it creates anything, so it does not file a duplicate. It was called `file-issue` before 3.0.

## When to use

- "file a bug for this"
- "open a feature request"
- "add a task to track the migration"
- "report this problem upstream"

## What it does

1. **Finds the tracker.** When the project has a `project-tracker.routing` (set up by [`project-tracker`](../project-tracker/README.md)), it files on the tracker routed for the category and never guesses: a missing or ambiguous pin, or no matching route, stops it with the problem named. Without a routing it lists the installed `project-tracker.capabilities.<tracker>` references and loads the one that matches the `origin` remote, and ends by offering to save the drafted routing once per session (or suggesting `project-tracker` when the draft is not one tracker for all work). GitHub and GitLab ship with this skill. GitLab's commands follow GitLab's documentation and have not yet run against a GitLab instance. Any other host, Bitbucket included, gets a message and no filing.
2. **Gathers the details:** title, category (bug, feature, or task), and a description. It asks only for what you have not said.
3. **Collects environment and versions** for a bug, from your machine and the repo where it can.
4. **Searches for duplicates** in open and closed issues, at least twice. If you say a hit is your issue, it stops and gives you that URL.
5. **Confirms** the title, category, and details, and waits for your go-ahead.
6. **Creates the issue.** On GitHub the category is the issue type (`Bug`, `Feature`, `Task`); a repository without issue types gets the `bug` or `enhancement` label instead.
7. **Reports the URL.**

If the item looks too big or too small for one issue, it says so and suggests another level. It never changes the level itself.

## Safety

- It never creates an issue without a duplicate search and your confirmation.
- It uses only labels and issue types the repository has.
- It never files a security vulnerability publicly; it points to the private channel.
- It keeps internal file names, commit SHAs, and anything from a private tracker out of the body.

## Requirements

`gh` 2.98.0 or later for GitHub, logged in. [`init-buddy`](https://github.com/repobuddy/repobuddy/blob/main/packages/buddy/skills/init-buddy/README.md) sets it up.

## Upgrading from `file-issue`

Invoke `issue` (`/issue`) where you invoked `file-issue`. Bitbucket is no longer a target.

## How to invoke

Ask for it directly, or run `/issue` where slash commands are supported.

## Install

```sh
npx skills add repobuddy/repobuddy --skill issue
```
