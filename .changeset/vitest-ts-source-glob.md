---
'@repobuddy/vitest': minor
---

Recognise `ts/` as a source directory.

The include globs covered `{src,source,code}` while `@repobuddy/jest` has always
resolved `['src', 'source', 'ts', 'js']`. Most of these repos keep their sources in
`ts/`, so the vitest presets matched nothing and every migration so far
(`resolve.imports`, `path-equal`, `just-func`, `fsa-emitter`) hand-wrote a
`vitest.config.ts` rather than importing the preset.

`js` is deliberately not added. `@repobuddy/jest` picks the **first existing**
directory from its list, whereas these are globs that union everything they match —
so adding `js` risks pulling a build-output directory into the source set. No repo
uses `js/` as a source directory today.
