---
spec-type: behavioral
---

# Configuration

*Stub — the entry points below are named, but the control-flow graph and scenario map are authored
in this node's explore pass.*

## What

Finding the repository's repobuddy settings and checking that what was found makes sense. The
settings record which plugins are active, and every command that depends on the plugin list depends
on this first.

The search is *find-up*: repobuddy looks in the current directory, then each parent in turn, until it
finds a configuration file or runs out of directories. That is why a command run deep inside a
repository still picks up the settings at the repository root. Several file names and formats are
accepted — `.repobuddy.json` is the one the documentation promises and the one `init` writes, but
`clibuilder` also resolves the undotted spellings, the YAML and rc variants, and a `repobuddy` key
inside `package.json`.

Resolution is *inherited behavior* from `clibuilder`, driven by the `name: 'repobuddy'` and
`config: true` options the app passes. Validating the resolved contents is not inherited — repobuddy
decides what a well-formed configuration is and what it does with one that is malformed.

**Non-goals.** Creating the configuration file (`initialization/`); changing which plugins it lists
(`plugin-management/`); and loading the plugins it names, which `clibuilder` does automatically once
the file is resolved.

## Use Cases

*(To be authored. The surfaces this node covers: resolving the configuration from a given working
directory, resolving when none exists anywhere up the tree, and validating a resolved configuration's
contents.)*
