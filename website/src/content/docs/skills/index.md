---
title: Agent skills
description: The 15 repobuddy skills for coding agents, grouped by what you want done, with a page for each.
---

The [`repobuddy` package](/repobuddy/repobuddy/) is an agent plugin as well as a CLI. The plugin ships agent skills:
instruction packs that a coding agent loads when a request matches. Each skill covers one repository chore, such as
filing an issue, merging dependency PRs, or setting up branch protection. Ask in plain words ("add badges to the
readme") or run the slash command (`/add-badges`).

Skills that need a deterministic step run a bundled script. See [Skill scripts](/repobuddy/cli/skill-scripts/).
[Install the skills](/repobuddy/skills/install/) first.

## Repo setup

| Skill | Use it to |
| --- | --- |
| [`setup-github-repo`](/repobuddy/skills/setup-github-repo/) | Apply merge settings, Dependabot, a branch ruleset, a merge backstop, and starter CI workflows with `gh` |
| [`add-badges`](/repobuddy/skills/add-badges/) | Add or fix the status badge row in a readme |
| [`llms-txt`](/repobuddy/skills/llms-txt/) | Publish a generated `llms.txt` with a CI drift check |

## Dependencies and releases

| Skill | Use it to |
| --- | --- |
| [`merge-dep-prs`](/repobuddy/skills/merge-dep-prs/) | Merge dependency-update PRs, gated on whether CI covered what the change reaches |
| [`min-release-age`](/repobuddy/skills/min-release-age/) | Lift the minimum-release-age gate for one package version, then restore it |
| [`setup-npm-trusted-publishing`](/repobuddy/skills/setup-npm-trusted-publishing/) | Register npm trusted publishers so releases need no `NPM_TOKEN` |

## Review

| Skill | Use it to |
| --- | --- |
| [`code-review`](/repobuddy/skills/code-review/) | Review a change through three engineering lenses and report where they disagree |
| [`review-api`](/repobuddy/skills/review-api/) | Review a library's public API against its own conventions |
| [`review-permissions`](/repobuddy/skills/review-permissions/) | Audit agent harness allowlists for risk and consolidate them |
| [`agent-readiness`](/repobuddy/skills/agent-readiness/) | Score how ready a repo or package is for coding agents, fix findings, benchmark cost |

## Docs

| Skill | Use it to |
| --- | --- |
| [`website`](/repobuddy/skills/website/) | Add an Astro docs site to a monorepo (`init`) or publish a static site from CI (`deploy`) |

## Issues and questions

| Skill | Use it to |
| --- | --- |
| [`create-issue`](/repobuddy/skills/create-issue/) | File a bug or feature request on GitHub or GitLab, after a duplicate search |
| [`to-question`](/repobuddy/skills/to-question/) | Word a question or unblock request for Slack, Jira, GitHub, email, and others |

## Agent setup and sessions

| Skill | Use it to |
| --- | --- |
| [`init-buddy`](/repobuddy/skills/init-buddy/) | Install and log in the git host CLI, and seed a harness allow and deny list |
| [`session`](/repobuddy/skills/session/) | Pause work into checkpoints and resume them in a fresh session |

## Which harnesses

The skills install into Claude Code, Cursor, Codex, and GitHub Copilot CLI. The `skills` CLI route also covers any
harness it supports. Individual skills read or write one harness's files: `review-permissions` reads six harnesses,
`init-buddy` writes allow lists for Claude Code, Cursor CLI, and Codex CLI. See
[Install the skills](/repobuddy/skills/install/) for each route.
