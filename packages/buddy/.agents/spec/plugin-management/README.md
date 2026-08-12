# Plugin management

The capability index for everything about *which plugins a repository uses* after it has been set
up: obtaining one, dropping one, moving one to a newer version, finding out what is available, and
the interface a plugin author implements so their package can be one.

Descriptive — this folder holds no scenarios of its own. Each unit below owns its own contract.

## Units

| Unit | Kind | What it covers |
|---|---|---|
| [`add/`](./add/README.md) | behavioral | `buddy add <package>` — install the dependency and record it as active. |
| [`remove/`](./remove/README.md) | behavioral | Dropping a plugin: uninstalling it and taking it out of the active list. |
| [`update/`](./update/README.md) | behavioral | Moving an active plugin to a newer version. |
| [`discovery/`](./discovery/README.md) | behavioral | The `plugins` command — listing what is active and searching npm for installable plugins. |
| [`package-manager/`](./package-manager/README.md) | behavioral | Choosing the repository's package manager and running dependency operations through it. |
| [`loading/`](./loading/README.md) | behavioral | What happens at startup to each plugin the configuration names, including the broken ones. |
| [`plugin-contract/`](./plugin-contract/README.md) | reference | What a package must do to be a repobuddy plugin. |

## Shared ground

Two facts apply across every unit here and are stated once rather than in each:

- **Package names are literal.** `buddy add typescript` means the package named `typescript` — there
  is no shorthand that expands a bare name into `@repobuddy/typescript`. Plugins from any scope, or
  no scope, are equally valid. (The readme currently documents the opposite; correcting it is part
  of this project's work.)
- **Being installed and being active are different.** A plugin is *installed* when it is a
  dependency of the repository, and *active* when the configuration's `plugins` list names it.
  `clibuilder` loads exactly the active ones. Every unit here has to say which of the two it changes.
