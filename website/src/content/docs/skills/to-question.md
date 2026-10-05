---
title: to-question
description: Word a technical question or unblock request for a platform and copy it to the clipboard, without posting it.
---

`to-question` structures your topic into a shape, renders it in the platform's markup, iterates with you, and copies the
result. It never posts, files, or sends anything.

## When to use

- You want a question or a "I am blocked on X" message ready to paste into Slack, Jira, GitHub, email, and similar.

To file an issue, use [`create-issue`](/repobuddy/skills/create-issue/). For a public venue (Stack Overflow, Reddit,
Discord, X, and others) it points you to `research-workbench:community-post` instead.

## Invoke

```
/to-question [shape] [format] <topic or question>
```

| Format | Platform | Default |
| --- | --- | --- |
| `slack` | Slack mrkdwn | yes |
| `jira` | Jira wiki markup | |
| `email` | Email (rich text paste) | |
| `github`, `gitlab`, `linear`, `asana`, `markdown` | Markdown family | |
| `bugzilla` | Plain text by default, Markdown if your instance renders it | |
| `redmine` | Textile by default, Markdown on CommonMark instances | |
| `trac` | Trac wiki markup | |

An unlisted private platform (Notion, Teams) falls back to the Markdown baseline, and it says so. For Bugzilla and
Redmine it assumes the product default and tells you how to switch.

| Shape | Use when | Sections |
| --- | --- | --- |
| `question` (default) | You are choosing between alternatives | Context, Use Cases, Problem, Options, Questions |
| `unblock` | You need a named person to do a named thing | Blocked on, Already tried, What I need from you, By when |

Saying you are blocked or stuck selects `unblock`, and it tells you.

## What it produces

A draft checked by `check-format.mjs` for markup that will not survive the paste, copied to the clipboard with the first
tool found (`pbcopy`, `wl-copy`, `xclip`, and others). With no clipboard it leaves a private temp file and gives the path.

## Requirements

Node.js. The scripts `check-format.mjs` and `question-path.mjs` are committed with the skill. To check a draft yourself:

```sh
node ./scripts/check-format.mjs <target> draft.md [--json]
```

## Example

```
/to-question unblock github Need a review on the retry fix before Friday's release
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/to-question).
