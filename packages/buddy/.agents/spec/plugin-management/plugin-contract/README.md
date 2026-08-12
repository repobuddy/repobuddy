---
spec-type: reference
---

# Plugin contract

*Stub — the subject is named, but its contract is authored in this node's explore pass.*

## Subject

What a package must do to be a repobuddy plugin. This is a reference artifact rather than a
behavioral node: the contract is implemented by *other* packages, so repobuddy has no testable
surface of its own here — it can only state the interface and let each plugin conform.

The contract as it stands today, read from the one working plugin (`@repobuddy/typescript`):

- The package **exports an `activate` function**, which repobuddy calls at startup with a context
  object.
- `activate` **registers the plugin's commands** on that context. `@repobuddy/typescript` registers
  a `ts` command carrying `build` and `copyCJSPackageJson`.
- The package **declares `repobuddy` among its npm keywords**, so it is findable by keyword search
  (`../discovery/`).

Loading is inherited: `clibuilder` calls `activate` on every plugin the configuration lists, with no
code in this package involved. What still has to be pinned down in this node's explore pass is the
shape of the context object, the failure behavior when a listed plugin cannot be loaded or exports no
`activate`, and which parts of the above are requirements versus conventions.

**Non-goals.** Which plugins a given repository uses (the sibling behavioral units); how a plugin's
own commands behave (each plugin's own spec).
