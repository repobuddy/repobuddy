# create-issue

Files a bug report or feature request on the repository's issue tracker. It searches for an existing issue first and asks you before it creates anything, so it does not file a duplicate.

## When to use

- "file a bug for this"
- "open a feature request"
- "create an issue for the crash we just found"
- "report this problem upstream"

## What it does

1. **Detects the tracker** from the `origin` remote: GitHub through `gh`, GitLab (gitlab.com or self-hosted) through `glab`. If the CLI is missing or logged out, it runs [`init-buddy`](../init-buddy/README.md) when that is installed, and otherwise tells you to install and log in.
2. **Gathers the details:** title, bug or feature request, and a description. For a bug, that includes steps to reproduce and expected vs actual behavior. It asks only for what you have not already said.
3. **Collects environment and versions** for a bug: OS and architecture, runtime and package manager, the affected package version, and related toolchain versions. It reads these from your machine and the repo where it can, rather than asking. When the package under test and the failing consumer use different toolchain versions, it records both. A feature request gets environment details only when they bear on the request.
4. **Searches for duplicates** in open and closed issues, at least twice with different keywords (the full title, then the core terms). It lists each match with its number, title, state, and URL, and asks whether one is your issue. If you say yes, it stops and gives you that issue's URL, so you can comment or react there instead.
5. **Confirms** the title, type, key points, and the environment details it will include, and waits for your go-ahead.
6. **Creates the issue** with a structured body: description, steps to reproduce, expected and actual behavior, environment, and notes. It labels a bug `bug` and a feature request `enhancement` (GitHub) or `feature` (GitLab), and leaves the label off when the repo does not have it.
7. **Reports the URL** of the new issue.

## Safety

- It never creates an issue without searching for duplicates and getting your confirmation.
- It does not invent labels; it uses only labels the repo has, or the platform defaults.
- It leaves internal file names, commit SHAs, and implementation details out of the issue body unless you ask for them.

## How to invoke

Ask for it directly, or run `/create-issue` where slash commands are supported.

## What it produces

A new issue on GitHub or GitLab and its URL, or, when a duplicate already exists, the URL of that issue instead.

## Install

```sh
npx skills add repobuddy/repobuddy --skill create-issue
```
