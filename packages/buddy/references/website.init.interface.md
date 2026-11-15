---
description: The sections any version of website.init holds, the instructions the website skill follows to add a docs site to a monorepo.
tags: [website, interface, init]
interface:
  cardinality: one
  version: 1
  sections:
    - {heading: Purpose, holds: "What the command adds and the framework it uses by default"}
    - {heading: When to use, holds: "The requests and repository states the command applies to, and the ones it does not"}
    - {heading: "Step 1: Detect the monorepo", holds: "How to find the package manager, workspace globs, task runner, and npm scope"}
    - {heading: "Step 2: Choose the location and name", holds: "Where the site package goes and what it is called"}
    - {heading: "Step 3: Resolve versions", required: true, holds: "How to pick the framework package versions; website.update follows it for upgrades"}
    - {heading: "Step 4: Scaffold the package", holds: "The files the site package starts with"}
    - {heading: "Step 5: Wire the site into the monorepo", holds: "The config edits that keep the repo's checks passing with the new package"}
    - {heading: "Step 6: Deploy", required: true, holds: "How init hands the site to website.deploy; the website skill promises that init ends by deploying"}
    - {heading: "Step 7: Record the site in AGENTS.md", holds: "What to add to the repo's agent instructions"}
    - {heading: "Step 8: Verify", holds: "The commands that must pass and what to report"}
    - {heading: Anti-patterns, holds: "What the command must not do"}
---

## Version

This is the `website.init` interface, version **1**. A version of `website.init` declares it in its frontmatter as `implements: website.init@1`. A change that adds a section, or makes a required section optional, keeps the number. A change that renames, removes, or reorders a section, or makes one required, raises it.

## Sections

A version of `website.init` holds the `##` sections listed in this document's frontmatter, in that order. Heading text is API: a section is matched by its exact heading. A version may leave out an optional section and may add sections of its own.

`Step 3: Resolve versions` and `Step 6: Deploy` are required. The `website` skill and the other `website.*` names refer to them by heading: `website.update` resolves upgrade versions as `Step 3` does, and the skill promises that `init` ends by running `website.deploy`.

## Check

Run `reference check website.init`. It composes the name as `load` does and fails a required section that is missing or marked `**Unsupported.**`, or sections out of order.
