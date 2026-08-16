---
spec-type: reference
concept: plugin-activation
---

# Plugin contract

## Subject

What a package must do to be a repobuddy plugin. This is a reference artifact rather than a
behavioral node: the contract is implemented by *other* packages, so repobuddy has no testable
surface of its own here — it can only state the interface and let each plugin conform. What
repobuddy does when a package honors or breaks this contract is behavior, and lives next door in
[`../loading/`](../loading/README.md).

### The requirement

A plugin is an npm package that **exports a function named `activate`**. That is the whole
requirement, and it is checked literally:

```js
function isValidPlugin(m) {
    return m && typeof m.activate === 'function'
}
```

Anything else a plugin does is convention, not contract.

### The activation context

repobuddy calls `activate` with a context object carrying exactly **one** member:

| Member | Shape | Purpose |
|---|---|---|
| `addCommand` | `addCommand(command): void` | Registers one command on the CLI. Call it once per command the plugin contributes. |

There is no other member — no logger, no configuration, no working directory. A plugin needing any
of those gets them through the command it registers, not through the activation context. The context
is also **not** the CLI itself: `addCommand` collects commands into a list that repobuddy attaches
afterward, so a plugin cannot inspect or modify what other plugins registered.

`activate` returns nothing. Its return value is discarded, so registration must happen through
`addCommand` before it returns.

### The shape of a command

A command carries a `name` and either work to do (`run`) or subcommands (`commands`), and may declare
arguments, options, and a configuration schema. `@repobuddy/typescript` registers one command that
only groups others:

```ts
import type { PluginActivationContext } from 'clibuilder'

export function activate(cli: PluginActivationContext) {
    cli.addCommand({
        name: 'ts',
        commands: [build, copyCJSPackageJson],
    })
}
```

### Conventions, not requirements

- **Declaring the `repobuddy` npm keyword.** Not required to load — a plugin named in the
  configuration is loaded whether or not it declares any keyword. It is required to be *found* by
  `plugins list` and `plugins search` ([`../discovery/`](../discovery/README.md)).
- **The `@repobuddy/` scope.** Carries no meaning to the loader. Package names are literal and a
  plugin from any scope, or none, loads identically.

### How a plugin comes to be loaded

Only plugins named in the configuration's `plugins` list are loaded, and `clibuilder` loads them
automatically — no code in this package is involved. Being installed as a dependency is not enough.

**A constraint worth knowing:** repobuddy imports a plugin by bare package name, resolved the way
Node resolves any import *from `clibuilder`'s own location* — the repository's working directory is
passed along but used only in the error message, not in resolution.

This was expected to break under pnpm; it does not. A spike confirmed plugins load in pnpm single
package and workspace layouts, including from the registry, because pnpm's hidden hoist directory
lies inside the resolution walk-up. See the spike result in
[`../../design/inherited-behavior.md`](../../design/inherited-behavior.md).

What remains untested is **global installation**, where clibuilder would have no path back to the
project's `node_modules`. Install repobuddy as a local dev dependency, as the readme documents.
