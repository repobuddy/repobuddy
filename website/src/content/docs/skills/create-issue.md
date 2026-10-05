---
title: create-issue
description: File a bug report or feature request on GitHub or GitLab, after searching for duplicates and confirming with you.
---

`create-issue` detects the tracker from the `origin` remote, gathers the details, searches open and closed issues for
duplicates, and creates the issue only after you confirm.

## When to use

- "file a bug for this", "open a feature request"
- "create an issue for the crash we just found"
- "report this problem upstream"

## Invoke

Run `/create-issue`, or ask in plain words. It takes no arguments.

## What it does

1. Detects GitHub (`gh`) or GitLab (`glab`, gitlab.com or self-hosted).
2. Asks only for what you have not said: title, bug or feature, description, and for a bug the steps and expected vs actual behavior.
3. For a bug, reads OS, runtime, package manager, and package versions from your machine instead of asking.
4. Searches for duplicates at least twice with different keywords. If you confirm a match, it stops and gives you that issue's URL.
5. Shows the title, type, key points, and environment details, and waits for your go-ahead.
6. Creates the issue and reports its URL. It labels a bug `bug` and a feature `enhancement` (GitHub) or `feature` (GitLab), and omits the label if the repo lacks it.

## Asks before acting

It never creates an issue without the duplicate search and your confirmation.

## Hands off to

[`init-buddy`](/repobuddy/skills/init-buddy/) when `gh` or `glab` is missing or logged out and that skill is installed.

## Requirements

`gh` or `glab`, logged in, and an `origin` remote.

## Example

```
/create-issue the build crashes on Node 24 when the cache dir is missing
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/create-issue).
