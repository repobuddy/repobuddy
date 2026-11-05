---
description: The interface a project-tracker.intake.<key> reference implements, so a library's plugin can say how issues about that library are filed.
tags: [intake, interface, issue]
interface:
  cardinality: many
  version: 1
  sections:
    - {heading: Applies to, required: true, holds: "The package names the document covers"}
    - {heading: Tracker, required: true, holds: "The pin of the tracker to file in, and the destination within it"}
    - {heading: Before filing, holds: "Steps the reporter's agent runs before the summary"}
    - {heading: Criteria, holds: "What must be true before the issue is created"}
    - {heading: Template, holds: "Sections added to repobuddy's template, per category"}
---

## Version

This is the `project-tracker.intake` interface, version **1**. An intake document is named `project-tracker.intake.<key>` and declares the version it follows in its frontmatter as `implements: project-tracker.intake@1`. The key is a short name the plugin picks (`x` for the library `x`), since a reference name cannot hold `/`. A skill loads a document whose version is 1, and stops on any other value or on none, saying which document and which version. A change that adds a section or an optional field keeps the number; a change that renames or removes a section raises it.

`reference check project-tracker.intake.<key>` verifies a document that declares `implements` against this interface: its sections, their order, and that `Applies to` and `Tracker` are present.

## Sections

An intake document has these `##` sections, in this order. Heading text is API. The `interface` block in this document's frontmatter lists the same sections for `reference check`; `Applies to` and `Tracker` are required, since a skill cannot match a document or file with it without them.

| Section | Holds | Writes |
|---|---|---|
| `Applies to` | A bullet per npm package name the document covers, such as `x` and `@x/react` | no |
| `Tracker` | Bullets: `Pin` (the tracker to file in, `<plugin>/project-tracker.capabilities.<tracker>`) and `Destination` (where within that tracker, in the words the tracker's reference takes: for Asana, the workspace and the project ID or URL). A `Visibility` bullet (public or private) is optional and wins over the reference's own | no |
| `Before filing` | Numbered steps the reporter's agent runs before it writes the summary, such as building a minimal reproduction in a fresh git repository | yes |
| `Criteria` | A checklist of what must be true before the issue is created, such as "reproduced on the latest version" or "reproduction linked" | no |
| `Template` | A `###` heading per category (`bug`, `feature`, `task`), or `any`, holding the sections to add to the body | no |

A step in `Before filing` can change the reporter's machine, so a skill confirms with the user before it runs one, unless the user has already told the skill to follow the document.

## Matching

A skill matches a document by `Applies to`, never by its key. It compares each bullet to the package name exactly, with no pattern. Two documents that name the same package, or a name that is ambiguous between plugins, are reported together and neither is loaded until the user picks one.

## Tracker

`Pin` resolves as a routing pin does: `reference load <pin> --format json --metadata`, whose status is `missing` or `ambiguous` when the pin cannot be used. The document's tracker takes the routing's place for that one filing, and the reference it pins owns the commands. `Destination` is passed to the tracker's reference as the scope its `Detect` section would otherwise resolve from the repository.

## Template

For a filing, the skill writes the body from `project-tracker.template.<category>` and then adds the sections under the document's `### <category>` heading, and under `### any`, after the template's own, in that order. The template's sections stay.

## Before filing and Criteria

`Before filing` runs before the summary. `Criteria` is checked after the duplicate search and before the create: the skill states each item as met or not met, with how it knows, and creates only when every item is met or the user waives it by name.

## Overrides

This interface is never composed: a contribution over `project-tracker.intake.interface` is ignored with a warning. A team changes a document by writing a reference with its name, such as `project-tracker.intake.x`, in `.agents/references/` (`reference customize project-tracker.intake.x`). Its sections replace the sections they match by heading path.
