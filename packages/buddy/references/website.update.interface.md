---
description: The sections any version of website.update holds, the instructions the website skill follows to change an existing docs site.
tags: [website, interface, update]
interface:
  cardinality: one
  version: 1
  sections:
    - {heading: Purpose, holds: "What kinds of change the command makes"}
    - {heading: When to use, holds: "The requests and repository states the command applies to, and the ones it does not"}
    - {heading: "Step 1: Locate the site", holds: "How to find the site, its framework, and its build command"}
    - {heading: "Step 2: Make the change", holds: "What to do for each kind of change"}
    - {heading: "Step 3: Verify", holds: "The commands that must pass and what to report"}
    - {heading: Anti-patterns, holds: "What the command must not do"}
---

## Version

This is the `website.update` interface, version **1**. A version of `website.update` declares it in its frontmatter as `implements: website.update@1`. A change that adds a section, or makes a required section optional, keeps the number. A change that renames, removes, or reorders a section, or makes one required, raises it.

## Sections

A version of `website.update` holds the `##` sections listed in this document's frontmatter, in that order. Heading text is API: a section is matched by its exact heading. A version may leave out any section and may add sections of its own. No other name refers to a section of `website.update`, so none is required.

## Check

Run `reference check website.update`. It composes the name as `load` does and fails sections out of order.
