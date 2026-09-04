---
'@repobuddy/biome': major
---

**Breaking: `style/useNodejsImportProtocol` is now `error` in both `recommended` and `performant`.**

Biome ships this rule at `info`, which does not fail `biome check`. A repo that
imports a Node builtin bare — `import fs from 'fs'` — passed lint silently. A
bare specifier resolves to a userland package whenever one is installed under
that name, so the `node:` prefix is a correctness guard rather than a style
preference.

**A repo that was green before will fail lint after upgrading** if it imports
any Node builtin without the `node:` prefix. Biome classifies the fix as
*unsafe* because it rewrites the specifier, so a plain `--fix` will not apply
it. To migrate:

```sh
biome check --fix --unsafe .
```

`--unsafe` applies every other unsafe fix in your config as well, not just this
one. Run it, read the resulting diff, and commit deliberately — do not pipe it
straight into a commit. To see the scope first:

```sh
biome check . --diagnostic-level=error
```

**Also breaking: `performant` no longer lints or formats Markdown.**

`recommended` stopped covering Markdown in #512 — biome 2.4.15 reformatted YAML
frontmatter as markdown headings and corrupted every file carrying it. That
change reached `main` without a changeset and has never been released, so this
is the first version to carry it. `performant` kept covering Markdown, leaving
the two presets disagreeing about which files they lint. Both now carry the
identical `files.includes`, so Markdown is excluded from both and the
`.vscode/**/*.txt` exclusion applies to both.

Biome 2.5.11 does not process Markdown at all — it rejects a `markdown` config
key and reports `.md` paths as ignored — so the exclusion is inert today. It
stays as a guard for when Markdown support returns, and is annotated in both
preset files so it can be revisited then.
