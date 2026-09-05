---
'@repobuddy/biome': minor
---

Raise `useNodejsImportProtocol` to `error` in both `recommended` and `performant`.

Biome ships this rule at `info`, which prints the finding and still exits `0`. It
therefore read as enforced in any config review while gating nothing — a
fleet-wide audit found it reporting and passing on every repo extending this
preset. Both presets already promote nine other Biome-2 style rules from `info`
to `error`; this one was simply missing from that list.

Verified by exit code rather than by reading config. On a file containing
`import { deepEqual } from 'assert'`:

    before: exit 0 — "Found 1 info."
    after:  exit 1 — "Some errors were emitted while running checks."

The `node:` prefix is what distinguishes a Node builtin from a same-named package
on the registry, so this is a supply-chain signal and not only a style preference.

**This can newly fail `check` in consuming repos.** The violation is auto-fixable:
`biome check --write` rewrites `'fs'` to `'node:fs'`. Run it when taking this
version.
