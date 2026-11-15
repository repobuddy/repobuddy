---
description: The sections any version of website.deploy holds, the instructions the website skill follows to publish a static site from CI.
tags: [website, interface, deploy]
interface:
  cardinality: one
  version: 1
  sections:
    - {heading: Purpose, holds: "What the command publishes, and where"}
    - {heading: When to use, holds: "The requests and repository states the command applies to, and the ones it does not"}
    - {heading: "Step 1: Detect the git host", holds: "How to tell which host the repo is on and which host file to read"}
    - {heading: "Step 2: Locate the site and its framework", required: true, holds: "How to find the site directory and its framework; website.update follows it"}
    - {heading: "Step 3: Work out the build command", required: true, holds: "How to find the build command and output directory; website.update follows it"}
    - {heading: "Step 4: Set the base path", holds: "How to set the base path the host serves the site at"}
    - {heading: "Step 5: Create the CI job and enable hosting", holds: "The CI job to write and the hosting switch to turn on"}
    - {heading: "Step 6: Summary", holds: "What to report when the deploy is set up, including manual steps left to the user"}
    - {heading: Anti-patterns, holds: "What the command must not do"}
---

## Version

This is the `website.deploy` interface, version **1**. A version of `website.deploy` declares it in its frontmatter as `implements: website.deploy@1`. A change that adds a section, or makes a required section optional, keeps the number. A change that renames, removes, or reorders a section, or makes one required, raises it.

## Sections

A version of `website.deploy` holds the `##` sections listed in this document's frontmatter, in that order. Heading text is API: a section is matched by its exact heading. A version may leave out an optional section and may add sections of its own.

`Step 2: Locate the site and its framework` and `Step 3: Work out the build command` are required. `website.update` finds the site and its build command by following them.

## Check

Run `reference check website.deploy`. It composes the name as `load` does and fails a required section that is missing or marked `**Unsupported.**`, or sections out of order.
