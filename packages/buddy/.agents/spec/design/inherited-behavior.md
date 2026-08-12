# Inherited behavior

repobuddy is a thin shell over [`clibuilder`](https://www.npmjs.com/package/clibuilder). A large part
of what a user experiences — argument parsing, configuration resolution, help rendering, plugin
loading — is implemented by clibuilder, not by any code in this package.

This document records what we understand about that behavior, which parts of it our own promises rest
on, and the rule for deciding what belongs in a capability node's suite. It is descriptive: nothing
here is tested directly, and no scenario in this spec asserts clibuilder's mechanics.

## The rule

**Specify your promise, not their mechanism.**

"A broken plugin doesn't take the whole CLI down" is a promise *repobuddy* makes. clibuilder happens
to implement it, but if it stopped being true, repobuddy would be broken and a user would rightly
file the bug here. That belongs in a suite.

"The output contains `not a valid plugin`" is clibuilder's wording. repobuddy never promised it, and
freezing it would make a cosmetic change upstream into a failure here. That does not belong in a
suite.

### The corollary: assert the weakest form that supports the promise

An over-specific assertion pins the dependency's *accidents* — including its bugs — and turns a fix
into a break. The config-resolution case below is the worked example, and the reason this rule is
written down rather than left to taste.

## Assumptions register

The clibuilder facts our own promises rest on. Each should be guarded by a `*.learn.ts` boundary test
(a **learning test** — see [Naming](#naming)), so that a clibuilder upgrade fails a Renovate PR
rather than failing a user.

| # | Assumption | What breaks without it |
|---|---|---|
| 1 | find-up resolves the configuration from a subdirectory | `workflows` — running a plugin command from anywhere in the repo |
| 2 | packages named in `config.plugins` are imported and activated automatically | `add`, `initialization`, `workflows` — the entire point of listing a plugin |
| 3 | a plugin that fails to import or exports no `activate` is reported and skipped, and the others still load | `loading` — one bad entry costing that plugin rather than the tool |
| 4 | `keywords` defaults to the app's own name when configuration is enabled | `initialization` plugin detection, and `discovery` |
| 5 | the `plugins` command is added automatically when configuration is enabled | `discovery` — the command exists at all |
| 6 | the plugin contract is a `activate` export called with a context carrying `addCommand` | `plugin-contract`, and any plugin this project ships |

Six guards, not one per inherited behavior. An assumption earns a guard by supporting a promise, not
by being interesting.

## What we know about the mechanics

Preserved from reading clibuilder v9's source. Useful for debugging and for judging future upgrades —
**not** a contract, and deliberately not asserted anywhere.

### The shell's decision order (`builder.ts` → `parse`)

```mermaid
graph TD
    A[parse the command line] --> B{display-level flag?}
    B -->|--silent / --verbose / --debug-cli| B1[set the display level]
    B -->|none given| B2[level stays at info]
    B1 --> C
    B2 --> C
    C{--version given?} -->|yes| C1[print the version and stop]
    C -->|no| D{did matching the line produce errors?}
    D -->|yes| D1[print help and stop]
    D -->|no| E{is the resolved command runnable, and --help absent?}
    E -->|no| E1[print help and stop]
    E -->|yes| E2[run the resolved command]
```

Notable: the version flag is answered **before** the line is checked for errors, so
`buddy --version no-such-command` prints a version rather than an error.

Also notable: **every rejection path exits 0.** clibuilder builds a `context.exit` and never calls
it, so a script cannot distinguish `buddy no-such-command` from success. There are two rejection
sites, not three — `lookupCommand` folds unknown-command and bad-option into one errors array
reaching one `showHelp` branch, and configuration validation is the other. Both sit inside
clibuilder; nothing in this package can fix it without reimplementing the decision that was just
made. **Raise upstream rather than working around it here.**

### Configuration resolution (`config.ts` → `loadConfig`)

Accepted names are generated from the app name — the bare name, then `.cjs`, `.mjs`, `.js`, `.json`,
`.yml`, `.yaml`, the `rc` family — each in both undotted and dotted spellings. If no file matches
anywhere up the tree, a `repobuddy` key in `package.json` is used. Contents are parsed as JSON, then
YAML, then imported as a module.

**The search is name-first, not directory-first** — and this is the trap:

```js
for (const filename of filenames) {
    const filePath = findUpSync(filename, { cwd })
    if (filePath) return filePath
}
```

The whole directory chain is walked once **per name**, rather than every name being tried once per
directory. Because `repobuddy.json` sorts before `.repobuddy.json`, a `repobuddy.json` at the
repository root beats a `.repobuddy.json` in the directory you are standing in. Verified empirically
against the real `loadConfig`, not only read.

> **Do not pin this.** It is almost certainly a clibuilder bug — every comparable tool resolves
> nearest-first. An earlier draft of this spec asserted it as intended behavior; had that frozen,
> *fixing* it upstream would have become a breaking change here. Assumption 1 above is deliberately
> stated in its weakest useful form ("resolves from a subdirectory"), which holds under both the
> current behavior and the corrected behavior.

### Plugin loading (`plugins.ts`)

Every listed plugin is imported concurrently before the command line is matched. A failed import is
warned about and yields nothing, which then also fails the validity check — so an unimportable plugin
produces **two** warnings. Validity is literally `m && typeof m.activate === 'function'`. `activate`
is called with `{ addCommand }` and its return value is discarded.

Plugins are imported by **bare package name, resolved from clibuilder's own location** — the
repository's working directory is passed along but used only in the error message. A layout where a
plugin is installed somewhere clibuilder cannot resolve from (**a pnpm workspace being the case to
watch**) will fail to load a genuinely installed plugin. This is an open risk against `add`'s
contract and is the first build-to-learn spike.

## Naming

A **learning test** (Robert C. Martin, *Clean Code* ch. 8, "Boundaries") is a test written against a
third-party package, kept, and re-run on upgrade to detect behavioral drift. It is distinct from a
**characterization test** (Feathers, *Working Effectively with Legacy Code*), which pins down code you
*own* but do not understand so that you can safely change it. Same technique, opposite sides of the
boundary: characterization tests enable your change, learning tests detect theirs.

Guards live beside the source as `*.learn.ts`. The `files` allowlist in `package.json` already
excludes a taxonomy of test kinds (`spec`, `test`, `unit`, `accept`, `integrate`, `system`, `perf`,
`stress`); **`learn` needs adding to it** so guards are not published.
