# Tooling

How the `repobuddy` package is built and published — the part of the project a user never invokes
but every user depends on. Descriptive: the facts recorded here are enforced by the build and by the
repository's own checks, not by scenarios in this spec.

## Contents

- **Build** — TypeScript compiled to ES modules in `esm/`, driven by `tsconfig.esm.json`.
- **Published files** — the `files` allowlist in `package.json` decides what reaches the npm
  tarball. It ships `esm`, `src`, and templates, and excludes test files. Because it is an allowlist,
  the colocated spec in `.agents/` is excluded automatically, which is why this spec did not need to
  be hoisted out of the package.
- **Entry points** — `package.json` `bin` maps both `buddy` and `bd` to `bin/buddy.js`.
- **Dependencies** — `clibuilder` is the single runtime dependency.

## Known defect

The `files` allowlist names **`template`**; the directory on disk is **`templates`**. The templates
are therefore not published today, which means `buddy init`'s template-copying step
(`../initialization/README.md`) would find nothing to copy in an installed package. Fixing the
allowlist is part of this project's work.
