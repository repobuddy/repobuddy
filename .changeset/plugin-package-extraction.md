---
'@repobuddy/jest': minor
---

New `extract.extractPackages(config)`: given a jest config, it returns the packages the config pulls
in — watch plugins, transformers, resolver, reporters, `testEnvironment`, module name mapper targets,
setup files, and the other runner hooks — so a missing or outdated one can be named instead of
failing obscurely.

Results are deduplicated by package name and carry the specifiers and config fields that referenced
it. File paths, `<rootDir>` references, regex replacements, and jest built-ins such as the `default`
reporter are skipped; `testEnvironment: 'node' | 'jsdom'` resolve to their `jest-environment-*`
packages; `projects` is traversed.
