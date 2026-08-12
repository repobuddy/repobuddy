---
spec-type: behavioral
---

# Package manager operations

## What

Adding, removing, and upgrading dependencies on the repository's behalf — and first, working out
*which* tool to do it with. `add`, `remove`, and `update` all need this, so it is specified once here
rather than three times over.

repobuddy never assumes npm. It reads the repository to decide, preferring what the repository
**declares** over what it can be inferred to use: a `packageManager` field in `package.json` is an
explicit statement by the project and wins outright. Only when there is no such field does repobuddy
fall back to reading which lockfile is present, and only when there is no lockfile either does it
default to npm.

The other decision here is what happens when the tool fails — a package that does not exist, a
network that is down, a registry that refuses. **A failed dependency operation changes nothing
else.** The command reports what went wrong and stops before touching the configuration, so a
repository is never left listing a plugin it does not have.

**Open decision.** The precedence above (declared field, then lockfile, then npm) is this spec's
proposal rather than a user ruling. It follows corepack's model, where the `packageManager` field is
authoritative — and that field is real in practice: this very repository declares
`packageManager: pnpm@11.21.0`. Confirm before this node freezes.

### The command vocabulary

Verified 2026-08-12 against npm 12.0.2 and pnpm 11.21.0 (yarn is **not installed in this
environment**, so its rows are from documentation and are *not verified*):

| Operation | npm | pnpm | yarn 1 | yarn berry |
|---|---|---|---|---|
| install | `add` | `add` | `add` | `add` |
| uninstall | `remove` | `remove` | `remove` | `remove` |
| update | `update` | `update` | `upgrade` *(unverified)* | `up` *(unverified)* |

The useful surprise is how *uniform* this is. npm accepts `add` and `remove` as aliases for
`install` and `uninstall`, so install and uninstall need no per-tool branching at all — one verb each
works everywhere.

**Only `update` diverges, and only for yarn**, which additionally splits across its own major
versions. So the tool abstraction needs exactly one conditional, not a full command table, and that
conditional needs yarn's *major version* rather than just its name — which the `packageManager` field
supplies directly when present.

**Non-goals.** Which package a given command operates on, and what the configuration should say
afterward — those belong to the sibling command units. Installing anything during first-time setup:
`init` deliberately installs nothing (`../../initialization/`).

## Use Cases

| Use case | Trigger | Inputs | Outcome |
|---|---|---|---|
| **Run a dependency operation** | `add`, `remove`, or `update` needs to change the repository's dependencies | The operation and the package name | The repository's own package manager performs it, or the failure is reported and nothing else changes |

## Control Flow

```mermaid
graph TD
    A[a dependency operation is requested] --> B{does package.json declare a packageManager?}
    B -->|yes| B1[use the tool it names]
    B -->|no| C{which lockfile is present?}
    C -->|pnpm-lock.yaml| C1[use pnpm]
    C -->|yarn.lock| C2[use yarn]
    C -->|package-lock.json| C3[use npm]
    C -->|none| C4[use npm as the default]
    B1 --> V
    C1 --> V
    C2 --> V
    C3 --> V
    C4 --> V
    V{is this an update, with yarn?} -->|no| D[run the operation]
    V -->|yes| V1[pick yarn's verb for its major version]
    V1 --> D
    D --> E{did it succeed?}
    E -->|yes| E1[report success]
    E -->|no| E2[report the failure and change nothing else]
```

## Scenario map

### Run a dependency operation

| Edge | Path (Given) | Scenario |
|---|---|---|
| `B → yes` | package.json declares a tool and a different tool's lockfile is present | `a declared package manager wins over the lockfile` |
| `C → pnpm-lock.yaml` | no declared tool, a pnpm lockfile present | `a pnpm lockfile selects pnpm` |
| `C → yarn.lock` | no declared tool, a yarn lockfile present | `a yarn lockfile selects yarn` |
| `C → package-lock.json` | no declared tool, an npm lockfile present | `an npm lockfile selects npm` |
| `C → none` | no declared tool and no lockfile | `npm is used when nothing indicates otherwise` |
| `E → yes` | the operation is accepted by the tool | `a successful operation is reported` |
| `E → no` | the tool exits with a failure | `a failed operation is reported and changes nothing else` |
| `V → yes` | an update, in a repository declaring a yarn 1 package manager | `an update under yarn uses the verb for its major version` |
