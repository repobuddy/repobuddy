---
title: issue
description: File a bug, feature, or task on GitHub after searching for duplicates and confirming with you.
---

`issue` finds the tracker for the `origin` remote, gathers the details, searches open and closed issues for
duplicates, and creates the issue only after you confirm. It replaces `file-issue`.

## When to use

- "file a bug for this", "open a feature request", "add a task for the migration"
- "create an issue for the crash we just found"
- "report this problem upstream"

## Invoke

Run `/issue`, or ask in plain words. It takes no arguments.

## What it does

1. Finds the tracker. With a `project-tracker.routing` (see [`project-tracker`](/repobuddy/skills/project-tracker/)), it files on the tracker routed for the category, and stops if the route's reference is missing or ambiguous or no route matches. Without one, it loads the capabilities for the `origin` host: GitHub (`gh` 2.98.0 or later) and GitLab (`glab`, not yet tested against a GitLab instance) ship with the skill, and the report ends with a suggestion to run `project-tracker`.
2. Asks only for what you have not said: title, category (bug, feature, or task), description, and for a bug the steps and expected vs actual behavior.
3. For a bug, reads OS, runtime, package manager, and package versions from your machine instead of asking.
4. Searches for duplicates at least twice with different keywords. If you confirm a match, it stops and gives you that issue's URL.
5. Shows the title, category, key points, and environment details, and waits for your go-ahead.
6. Creates the issue and reports its URL. On GitHub the category is the issue type (`Bug`, `Feature`, `Task`). A repository without issue types, such as a user-owned one, gets the `bug` or `enhancement` label.

If the item looks too big or too small for one issue, it suggests another level and does not change it.

## Asks before acting

It never creates an issue without the duplicate search and your confirmation. It never files a security vulnerability publicly.

## Upgrading from `file-issue`

Use `issue` where you used `file-issue`. Bitbucket is no longer supported, since its native tracker is gone.
