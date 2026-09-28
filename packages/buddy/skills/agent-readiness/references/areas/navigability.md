# Navigability (weight 15)

Agents often read whole files and search by name. Large files and ambiguous names cost tokens on
every lookup.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `large-files` | 4 | yes | script: tracked source and docs files over 1000 lines, excluding lockfiles, changelogs, and build output |
| `monorepo-map` | 4 | no | **judgment**, monorepos only |

## Judging `monorepo-map`

Pass when the instructions file, or a file it points to, lists each workspace package with one line
on what it owns, and the list matches the packages that exist. Fail when packages are missing, or the
only map is the directory listing.

## Re-judging `large-files`

A generated file the repo must commit (a schema snapshot, a vendored single-file library) is not a
navigability problem if search ignores it. Move it to the noise area in the report and say so. A
hand-written file over the limit stays a fail.

## What the script cannot see

- one fact stated in several places that can drift apart
- generic names (`run`, `path`, `utils`) that flood search results
- a lookup index (`.agents/LOOKUP.DOC.md` or similar) that points an agent at the right file
