# add-badges

Adds a status badge row to a readme — npm version and downloads, CI or release status, docs, coverage, and license — using facts detected from the repo rather than a fixed template.

## What it does

1. Resolves which readme the badges belong in (root, published package, or the source of a generated file)
2. Detects repo identity, visibility, package name, workflows, license file, and docs URL
3. Picks only the badges whose subject actually exists, capped at six
4. Verifies every link target before writing, then places the row under the H1
5. Adds a changeset when the readme ships inside a published package, and checks that the badges render on the pushed branch

## How to invoke

Ask for it directly — "add badges to the readme", "the badges are stale after the transfer", "add shields" — or invoke `/add-badges` where slash commands are supported.

## What it produces

A badge row in the correct readme, every badge linked to a live target, plus a changeset if the readme is part of a published package.
