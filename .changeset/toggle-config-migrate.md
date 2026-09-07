---
'@repobuddy/jest': major
---

Use `jest-watch-toggle-config` instead of the `jest-watch-toggle-config-2` fork.

The fork existed because the original looked unmaintained — specifically it carried a
pointless `jest-validate` peer dependency, raised as jest-community/jest-watch-toggle-config#19.
Upstream 3.0.0 (April 2023) dropped that peer and closed the issue, and it has been
`"type": "module"` since the same release. Verified against a real jest 30.5.1 install:
the original loads, constructs, and toggles correctly with no flags.

**Breaking:** `knownWatchPlugins.toggleConfig()` now emits `'jest-watch-toggle-config'`.
The optional peer changed name accordingly. If you use `defineWatchPlugins()` or
`toggleConfig()`, swap the devDependency:

```
pnpm remove jest-watch-toggle-config-2
pnpm add -D jest-watch-toggle-config
```

Consumers who never enabled the toggle-config plugin are unaffected.
