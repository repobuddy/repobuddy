---
name: scaffold
description: "Use this skill when creating a new repository or package from a scaffold recipe, or listing the recipes installed."
---

# Scaffold

Creates a new repository or package by following a scaffold recipe: a reference a plugin ships that holds the details of one kind of project. This skill owns the steps and the contract; it knows no recipe by name. It finds the recipes that are installed, lets you choose, and applies the chosen one after you confirm.

Use when asked to scaffold a repo, start a new project or package, set up a repo the way a team does it, or list what can be scaffolded. This skill does not write a recipe, and it does not change a host's basic settings itself (a host skill does).

## References

Load these with the `reference` skill in the `cyber-agentkit` plugin:

- `scaffold.contract`: the sections a recipe has, the order of work, and which `contract:` versions it knows.

When the `reference` command cannot run, say it is needed and stop: no recipe can be listed or read, so write nothing.

## Modes

Pick the mode from the request. With none clear, ask.

### List

1. Run `reference search scaffold.recipe`. Keep only hits whose `match` is `prefix`; drop every other hit.
2. Run `reference show <name> --format json` on each kept name and read `contract` in `metadata`. When it is missing or is not a version `scaffold.contract` declares, leave that recipe out and say which one and why.
3. Show each remaining recipe with its `Produces` and `Hosts` from its `Recipe` section. When nothing is left, say no recipe is installed and write nothing.

### Scaffold

1. Run **List**. Pick the recipe that matches the request; when more than one fits or none does, ask. When two plugins ship the same name, list both and ask which.
2. Read the whole recipe with `reference show <name>`. Check every `Prerequisites` entry; stop and say what is missing. When the `Recipe` section has an `Order` bullet, check it as `scaffold.contract` says and stop on a bad one; steps 3 and 5 to 8 then run in that order, and step 4 still comes before the first step that writes.
3. Ask each `Inputs` entry, validating as the recipe says. Ask where the project goes and which host it uses; stop when the host is not in the recipe's `Hosts`.
4. Show what will be created: the `Files`, the `Config` changes, and the `Post` steps, in plain words. Ask for confirmation. When declined, write nothing and say so.
5. Run the host skill for the chosen host when one is installed (`setup-github-repo` for `github`); for a host with no skill, tell the user its basic settings are theirs to do and continue only when they say so.
6. Apply `Files`, then `Config`, unless `Order` puts them otherwise. Never overwrite an existing file without asking.
7. Run `Verify`. Report each result as it is; do not call the scaffold done while a check fails.
8. Offer `Post` one step at a time and run only the steps the user accepts, since each touches a service outside the repository.

## What NOT to Do

- Do not name a recipe yourself: list what is installed
- Do not write a recipe, or copy a recipe's details into this skill
- Do not change a host's basic settings by hand: use the host skill
- Do not write a file, apply a setting, or run a `Post` step before the user confirms
- Do not skip `Verify` or report a failing check as a pass

## Validate

- [ ] The description in the frontmatter is at most 120 characters, and `name` equals the directory name
- [ ] Every copy in this skill's `references/` equals the file of the same name in `packages/buddy/references/` (`node scripts/sync-skill-references.mjs --check`)
- [ ] Recipes were listed by the `scaffold.recipe` prefix and only `match: prefix` hits were kept
- [ ] The steps ran in the recipe's `Order` when it has one, and in the contract's default order otherwise
- [ ] Nothing was written before the user confirmed the plan
- [ ] `Verify` ran, and every failure was reported
