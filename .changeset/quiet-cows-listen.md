---
'@repobuddy/biome': minor
---

`performant` no longer lints or formats Markdown, and both presets now lint the same file set.

`recommended` stopped covering Markdown in #512 — biome 2.4.15 reformatted YAML
frontmatter as markdown headings and corrupted every file carrying it. That
change reached `main` without a changeset and has never been released, so this
is the first version to carry it. `performant` kept covering Markdown, leaving
the two presets disagreeing about which files they lint. Both now carry the
identical `files.includes`, so Markdown is excluded from both and the
`.vscode/**/*.txt` exclusion applies to both.

This only removes files from a consumer's lint surface, so it cannot newly fail
a repo's `check`. Biome 2.5 does not process Markdown at all — it rejects a
`markdown` config key and reports `.md` paths as ignored — so the exclusion is
inert today. It stays as a guard for when Markdown support returns, and is
annotated in both preset files so it can be revisited then.
