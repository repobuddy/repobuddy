---
spec-type: behavioral
---

# Add a plugin

*Stub — the entry point below is named, but the control-flow graph and scenario map are authored in
this node's explore pass.*

## What

`buddy add <package>` — obtain a plugin and switch it on, in one command. It **installs** the named
package as a dependency, by detecting and shelling out to whichever package manager the repository
uses (`npm`, `yarn`, or `pnpm`), and then **records** it in the configuration's `plugins` list so
`clibuilder` loads it on the next run. Both halves, not one: installing without recording leaves the
commands unavailable, and recording without installing leaves a configuration pointing at nothing.

The package name is taken literally. `buddy add typescript` installs `typescript`; to add the
TypeScript plugin the user writes `buddy add @repobuddy/typescript`.

**Non-goals.** Removing or upgrading a plugin (sibling units); finding out what plugins exist
(`discovery/`); and detecting plugins during first-time setup (`initialization/`).

## Use Cases

*(To be authored. The surface this node covers: `buddy add <package>` — including the cases where
the package is already installed, already active, does not exist, or where no configuration file has
been created yet.)*
