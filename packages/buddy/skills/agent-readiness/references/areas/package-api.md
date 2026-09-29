# Types and exports (package, weight 30)

A consumer's agent learns a package from its declarations first. They are the documentation it reads
most, and the only one a compiler checks.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `entry-point` | 1 | yes | script: package.json declares `exports`, `main`, `module`, or `bin` |
| `types-ship` | 2 | yes | script: `types`, `typings`, an `exports` `types` condition, or a `.d.ts` beside a code entry |
| `exports-map` | 2 | yes | script: `exports` exists, `types` is the first condition wherever it appears, and no `./*` subpath |
| `no-any` | 3 | yes | script: no `any` outside comments and strings in the declarations reachable from the entries |
| `deprecations-marked` | 4 | no | **judgment** |

The script reads the declaration entries and follows relative `export … from` re-exports. It does not
resolve imports from other packages.

## Re-judging `no-any`

Each `any` is listed as `<file>:<line>`. It still fails when the `any` is in a parameter or return a
consumer touches. Two cases are worth a word in the report rather than a flip: `this: any` on a
matcher that a test framework binds, and an `any` inside a type the package re-exports from a
dependency it does not own. Name the dependency.

## Judging `deprecations-marked`

The script cannot see what was removed without the previous release, and it fetches nothing. Read the
changelog's recent major releases for removals and renames, and the `@deprecated` count it reports.

Pass when each removal or rename in the latest major was marked `@deprecated`, with its replacement,
in a release before it went. Pass when the package has had no removals. Fail when an API vanished in a
major release with no deprecation release before it.

## What the script cannot see

- whether the `exports` map exposes internals under a named subpath (`./internal`, `./utils`)
- whether a `files` list or `.npmignore` leaves the declarations out of the tarball; point `--package`
  at an installed copy to check what actually ships
