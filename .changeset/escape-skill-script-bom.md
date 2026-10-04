---
'repobuddy': patch
---

Ship the bundled skill scripts without a raw U+FEFF character. The minifier wrote the `yaml` package's `BOM` constant into `init-buddy`'s `detect-env.mjs` as the literal character, which skill auditors flag as hidden content; the build now writes it as the `\uFEFF` escape.
