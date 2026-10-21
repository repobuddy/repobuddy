---
title: scaffold
description: Create a new repository or package from a scaffold recipe a plugin ships, or list the recipes installed.
---

`scaffold` creates a new repository or package from a scaffold recipe: a reference a plugin ships as `scaffold.recipe.<name>` that holds the details of one kind of project. The skill names no recipe itself. It finds the recipes installed, lets you choose, and applies the one you pick, so a team writes its way of starting a project down once.

## When to use

- "scaffold a new repo"
- "start a new package the way we always do"
- "what can I scaffold here?"

## Invoke

Run `/scaffold`, or ask in plain words. It has two modes: list and scaffold.

## What it does

1. **List** finds every `scaffold.recipe.<name>` reference and shows what each produces and which hosts it supports. A recipe on a contract version the skill does not know is left out and named.
2. **Scaffold** reads the chosen recipe, checks its prerequisites, asks its inputs and the host, and shows the plan. After you confirm, it runs the host's setup skill (such as [`setup-github-repo`](/repobuddy/skills/setup-github-repo/)), writes the files and settings, runs the recipe's checks, and offers each step after the first push one at a time.

The recipe format is the `scaffold.contract` reference, which repobuddy owns. A recipe has the sections `Recipe`, `Inputs`, `Files`, `Config`, `Verify`, and `Post`, and declares `contract: 1` in its frontmatter. A recipe that needs the steps in another order, such as writing its files before the host setup, lists them in an optional `Order` bullet. A plugin adds a recipe without any change to the skill. Loading references needs the `reference` skill from the `cyber-agentkit` plugin.

## Asks before acting

It writes nothing, and runs no step that touches an outside service, before you confirm the plan. It never overwrites an existing file without asking, and it does not report the scaffold done while a check fails.
