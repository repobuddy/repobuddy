# scaffold

Creates a new repository or package from a scaffold recipe. A recipe is a reference a plugin ships (named `scaffold.recipe.<name>`) that holds the details of one kind of project: the files, the pinned settings, the checks, and the steps after the first push. The skill finds the recipes you have installed and applies the one you choose, so a team's way of starting a project is written down once.

## When to use

- "scaffold a new repo"
- "start a new package the way we always do"
- "what can I scaffold here?"

## What it does

- **List** shows the installed recipes, each with what it produces and which hosts it supports. A recipe on a contract version the skill does not know is left out and named.
- **Scaffold** reads the chosen recipe, checks its prerequisites, asks its inputs, shows the plan, and waits for your confirmation. It then runs the host's setup skill, writes the files and settings, runs the recipe's checks, and offers each step after the first push one at a time.

The recipe format is `scaffold.contract`, which repobuddy owns. A plugin adds a recipe without any change to this skill.

## Safety

- It writes nothing, and runs no step that touches an outside service, before you confirm.
- It never overwrites an existing file without asking.
- It does not report a failing check as a pass.

## Install

```sh
npx skills add repobuddy/repobuddy --skill scaffold
```
