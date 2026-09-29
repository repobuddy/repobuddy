# Navigability (weight 15)

Agents often read whole files and search by name. Large files and ambiguous names cost tokens on
every lookup.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `large-files` | 4 | yes | script: tracked source and docs files over 1000 lines, excluding lockfiles, changelogs, and build output |
| `monorepo-map` | 4 | no | **judgment**, monorepos only |
| `generic-names` | 4 | no | script: top-level JS/TS names that a grep finds in at least 10 files, and are generic (`run`, `path`, `utils`) or declared in more than one file; **judgment** on what it lists |

## Judging `monorepo-map`

Pass when the instructions file, or a file it points to, lists each workspace package with one line
on what it owns, and the list matches the packages that exist. Fail when packages are missing, or the
only map is the directory listing.

## Judging `generic-names`

For each name the script lists, it gives how many files declare it and how many files a whole-word
grep for it returns. Pass when the list is only names a reader expects to be shared: a framework
convention (`main` in each CLI entry, `config` in each tool's config file) or a name the code rarely
greps for. Fail when a name the code calls often is generic or declared in several files, so a search
for its definition returns a page of noise. Name the worst one and a specific replacement.

## Re-judging `large-files`

A generated file the repo must commit (a schema snapshot, a vendored single-file library) is not a
navigability problem if search ignores it. Move it to the noise area in the report and say so. A
hand-written file over the limit stays a fail.

## What the script cannot see

- one fact stated in several places that can drift apart
- generic names outside JS and TS
- a lookup index (`.agents/LOOKUP.DOC.md` or similar) that points an agent at the right file
