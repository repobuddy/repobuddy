---
description: What a project-tracker.capabilities.<tracker> reference must contain, and the contract version skills check.
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

A skill confirms with the user before any section marked as writing.

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
