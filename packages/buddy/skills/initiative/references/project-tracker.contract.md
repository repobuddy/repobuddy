---
description: What a project-tracker.capabilities.<tracker> reference must contain, the contract version skills check, and the format of project-tracker.routing.
tags: [project-tracker, contract]
contract: 1
---

## Version

This is contract **1**. A capabilities reference declares the version it follows in its frontmatter as `contract: 1`. A skill that knows contract 1 loads a reference with `contract: 1` and stops on any other value or on none, saying which tracker and which version. A change that adds a section or an optional field keeps the number; a change that renames or removes a section, or changes the item ref, raises it.

## Sections

A capabilities reference has these `##` sections, in this order. Heading text is API.

| Section | Holds | Writes |
|---|---|---|
| `Tracker` | Bullets: `Name`, `Visibility` (public or private, and how to read it), `Levels held`, `Categories held`, and the prerequisites (the tool, its minimum version, how to check it) | no |
| `Detect` | How to tell the tracker applies to this repository, whether the user is logged in, and how to resolve the scope | no |
| `Kinds` | How each category and each level is expressed on this tracker, read from the tracker rather than assumed | no |
| `Search` | The commands to find existing items, including closed ones | no |
| `Create` | The command that creates an item at a level, with a category, an optional parent, and a body file | yes |
| `Link` | How to attach a child, detach it, and relate two items | yes |
| `Retype` | How an item changes level, for each of issue → epic, epic → initiative, epic → issue, and initiative → epic: in place or a new item, what happens to open children, and the limits | yes |
| `Close` | How to close an item with a reason: done, not planned, or moved | yes |
| `Url` | How to print an item's URL and parse one | no |
| `Ownership` | Optional. How to tell whether the logged-in user owns the tracker's scope (the repository or project `Detect` resolved): the command, and which of its answers mean `owned` and `not owned` | no |

A skill confirms with the user before any section marked as writing. The one exception is a create that the skill's own workflow lets run without a confirmation turn because `Ownership` answered `owned`. A skill with no such rule always confirms.

`Ownership` answers `owned` or `not owned`. A missing or `**Unsupported.**` `Ownership` section, or a result the section does not map to either answer, a failed command included, means the ownership is unknown. A skill treats unknown as `not owned`.

## Unsupported

A section the tracker cannot honor starts with the line `**Unsupported.**`, then one sentence saying why, then an optional `Workaround:` line. A skill reads that first line before anything else in the section. A section that is absent counts as unsupported with no workaround. The fallbacks live in the skills, once: with no `Search`, the user confirms there is no duplicate; with no native `Link`, the link goes in the body; with no in-place `Retype`, create at the new level, link, and close the old item after confirmation.

## Item ref

Every operation that returns an item gives the skill this record, read from whatever the tool printed:

| Field | Holds |
|---|---|
| `id` | the tracker's identifier |
| `title` | the title |
| `state` | `open`, `closed`, or `other: <text>` |
| `url` | the link to the item |
| `level` | `issue`, `epic`, or `initiative` |

`Create` returns at least `id` and `url`; `Search` returns the whole record for each hit.

## Overrides

A team overrides one section by writing a reference with the same name and `merge: merge-sections`. Over a tracker two plugins ship, the override takes the qualified name.

## Routing

`project-tracker.routing` is the project's own reference, in its `.agents/references/` folder; no default ships, so its absence means the project has no routing. The `project-tracker` skill writes it and the level skills read it. It has two `##` sections, in this order, each a table.

`## Routes`: which tracker holds a level and a category.

| Column | Holds |
|---|---|
| `Level` | `issue`, `epic`, `initiative`, or `any` |
| `Category` | `bug`, `feature`, `task`, or `any` |
| `Tracker` | the pin: `<plugin>/project-tracker.capabilities.<tracker>`, or the bare `project-tracker.capabilities.<tracker>` when the project itself defines the tracker |

The first row that matches the level and category wins; `any` matches everything. A level and category that no row matches have no route, and a level skill stops instead of guessing. Put specific rows first and a catch-all last.

`## Moves`: what happens to the source when an item moves from one tracker to another.

| Column | Holds |
|---|---|
| `From` | the pin the item leaves |
| `To` | the pin it moves to |
| `Source after the move` | `moved` (close the source as moved) or `mirror` (keep it open) |

A pair with no row means `moved`, except that a move from a private tracker to a public one is never allowed, with a row or without: visibility is read from each reference's `Tracker` section, a row for that pair is invalid, and a skill that meets the pair stops. A private tracker's details never go into a public one. When an item moves from a public tracker to a private one, the public item says only that it is tracked internally, with no title or URL.

Reading a pin: `reference load <pin>` resolves it. `reference load <pin> --format json` exits 0 either way and reports a `status`: `missing` (code `reference-missing`) means the pin is missing; `ambiguous` (code `reference-ambiguous`, the plugins in `options`) means a bare name is ambiguous. A found pin carries the frontmatter, so `contract` is in `metadata`. Exit 1 means the command could not complete, and exit 2 means it was called wrongly. To turn a bare name from `reference search` into a pin, run `reference where <name>`: the slot marked `used` names the plugin, and a project-tier slot means the bare name is the pin.
