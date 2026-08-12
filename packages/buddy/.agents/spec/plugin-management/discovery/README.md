---
spec-type: behavioral
---

# Plugin discovery

*Stub — the entry point below is named, but the control-flow graph and scenario map are authored in
this node's explore pass.*

## What

The `plugins` command — seeing what is active in this repository, and searching for plugins that
could be. `clibuilder` adds this command automatically because the app enables configuration, so it
already exists today; nothing in this package implements it.

Search works by npm keyword: `clibuilder` looks for packages whose keywords match the app's, which
means the app has to declare keywords for search to return anything. `repobuddy` currently declares
none in its `cli()` options, so search finds nothing — a gap this node's contract has to close.
(`@repobuddy/typescript` already lists `repobuddy` among its keywords, so it is discoverable as soon
as repobuddy searches for the right term.)

**Non-goals.** Acting on a discovered plugin — installing, activating, or removing one belongs to
the sibling units.

## Use Cases

*(To be authored. The surfaces this node covers: listing active plugins, and searching for
installable plugins by keyword.)*
