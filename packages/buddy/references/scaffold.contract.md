---
description: What a scaffold.recipe.<name> reference must contain, and the contract version the scaffold skill checks.
tags: [scaffold, contract]
contract: 1
---

## Version

This is contract **1**. A recipe declares the version it follows in its frontmatter as `contract: 1`. A skill that knows contract 1 loads a recipe with `contract: 1` and stops on any other value or on none, saying which recipe and which version. A change that adds a section or an optional field keeps the number; a change that renames or removes a section raises it.

## Ownership

repobuddy owns this contract and the `scaffold` skill that reads it. A plugin ships a recipe as `scaffold.recipe.<name>` and depends on this contract, never the other way round: the skill names no recipe and carries no knowledge of any one of them. A recipe holds only what is specific to what it builds. The hosting platform's basic setup (branch protection, merge settings, dependency updates) belongs to the host skills, such as `setup-github-repo`, which the skill runs before the recipe's own steps.

## Sections

A recipe has these `##` sections, in this order. Heading text is API.

| Section | Holds | Writes |
|---|---|---|
| `Recipe` | Bullets: `Name`, `Produces` (one sentence on what exists afterward), `Hosts` (the hosting platforms it supports, such as `github` or `gitlab`), `Prerequisites` (each tool, its minimum version, how to check it), and optionally `Order` (see Order of work) | no |
| `Inputs` | What the skill asks the user before writing: for each, a name, how to validate it, and a default when there is one | no |
| `Files` | The files to create or copy, each with its path and its source (inline content, a path in the recipe's own plugin, or another repository), and what to substitute from `Inputs` | yes |
| `Config` | Settings the recipe pins or overrides after the files exist: versions, registries, CI runner and resource settings, ignore rules, and why each differs from the default | yes |
| `Verify` | Commands or observations that prove the result works, in order, and what a pass looks like | no |
| `Post` | Steps after the first push: host settings to apply, trackers to register, tasks to create | yes |

The skill confirms with the user before any section marked as writing.

## Unsupported

A section the recipe does not need starts with the line `**Unsupported.**`, then one sentence saying why. A section that is absent counts as unsupported. When the user's host is not listed in `Hosts`, the skill stops before any write.

## Order of work

The skill runs the recipe in this order: `Recipe`, `Inputs`, `host setup` (the host skill for the chosen host), `Files`, `Config`, `Verify`, `Post`. A recipe that needs another order adds an `Order` bullet to its `Recipe` section that lists the steps after `Recipe`, each once, by these names: `Inputs`, `host setup`, `Files`, `Config`, `Verify`, `Post`. For example, `Order: Inputs, Files, host setup, Config, Verify, Post` writes the files before the host is set up. `Recipe` always runs first, since `Order` is in it. The skill follows `Order` when it is present and the order above when it is not. When `Order` leaves out a step, repeats one, or names one that is not listed here, the skill stops before any write and says which.

## Overrides

A team overrides one section by writing a reference with the same name and `merge: merge-sections`. Over a recipe two plugins ship, the override takes the qualified name.
