---
name: llms-txt
description: Use this skill when publishing an llms.txt — generated from a project's public surface, with a CI drift check.
---

# llms.txt

Publish a machine-readable orientation layer for a project, derived from its public surface.

Use when asked to "add an llms.txt", "generate llms.txt", "sync the llms file", "our llms.txt is out of date", or "make this package readable by agents" — and when a project gains or reshapes a public API and its orientation file has to follow.

An agent meeting a library cold has its type declarations, its source, and no map. `llms.txt` is the map: what the project is, the conventions that govern the whole surface, which areas exist, and where the per-item detail lives. It does not restate the detail — the agent already has that.

## Who this file is for

`llms.txt` addresses the **consumer** of the published thing. It is a different audience from the agent *developing* the project, and confusing the two produces a file that serves neither.

| | `llms.txt` | `AGENTS.md` |
| --- | --- | --- |
| Audience | someone consuming the package or site | someone changing this repo |
| Content | public surface, its conventions, where detail lives | build and test commands, invariants, house patterns, traps |
| Published | yes — package `files` and/or the docs site | no |
| Source | derived from the surface | judgement, hand-written |

Both can exist; they should not overlap. If a fact is only useful to someone editing the repo, it belongs in `AGENTS.md` — see `buddy-agent-harness:init`. If `AGENTS.md` starts restating the public API, cut it and point at `llms.txt`.

## Step 1 — Decide whether the project needs one

Not every project does. Skip this skill and say so when the answer is no.

| Project | Verdict |
| --- | --- |
| Published library or package | yes — the consumer is an agent writing code against it |
| Documentation or content site | yes — this is llmstxt.org's original case |
| Service with a public API | yes — scope it to the API surface |
| Application with no public surface | **no** — there is no consumer. `AGENTS.md` is the whole answer |
| Private/internal repo nobody installs | **no** |

## Step 2 — Find the surface source of truth

The generator must read something the project already maintains, so the file cannot describe an API that no longer exists. Identify what that is before writing any code.

| Project type | Surface source |
| --- | --- |
| TypeScript library | the package entry (`src/index.ts`) read through the compiler API — enumerate module exports, their declaration file, and whether each carries a doc comment |
| JavaScript package | the entry's exports, plus `exports` in `package.json` for subpath entries |
| CLI | the command/subcommand table the parser is built from, not the README |
| HTTP service | the route table or OpenAPI document |
| Docs site | the content collection's files and frontmatter |

Two traps worth checking before you commit to an approach:

- **The compiler API may not be where you expect.** TypeScript 7's npm package exposes only `version` to JS consumers. If the project builds on 7, take the compiler API from a pinned older alias the repo already depends on for type tests (`ts-6.0`, or similar) rather than adding a dependency.
- **A generator is a dev tool, not a shipped one.** Put it in the package's existing scripts directory and match the style of what is already there.

## Step 3 — Generate, never hand-write

This is the whole point. A hand-written `llms.txt` rots into describing an API that was removed two releases ago, exactly as hand-maintained per-directory readmes do.

Rules for the generator:

1. **Every name, count and grouping is derived.** If the file says "24 exports", the generator counted them.
2. **Unmapped surface is a hard error, not a silent omission.** Keep the surface-area → documentation-page mapping as an explicit table in the generator, and throw when the surface grows a member the table does not cover. `null` is a valid entry meaning "exists, documented nowhere" — that is a reported gap, not a hidden one. Without this, a new module silently never appears and nobody finds out.
3. **Never claim what you have not checked.** If the file wants to say "these examples are verified by tests", emit that sentence only for the areas that actually have such a test on disk, read at generation time.
4. **Do not bake in a value a release bumps.** Putting the package version in the file makes the drift check fail on every release PR. Same for anything derived from build output that is not committed.
5. **Prose is allowed, but it is the part that rots.** The conventions section is judgement, not data. Either keep it to claims that cannot go stale, or pin each claim with a test in the project's own suite — a compile-time assertion for a type library, a unit test otherwise. Prefer pinning.
6. **Say in the file that it is generated**, and name the generator, so the next person edits the right thing.

Support at least these modes:

- default — write the file(s)
- `--check` — compare against what is on disk and exit non-zero with the paths that differ. Prefer this over "regenerate and see if git is dirty": it works with an otherwise-dirty tree and names the offending file.
- a reporting mode that prints the gaps the generation exposed (see Step 6)

## Step 4 — Follow the format

Per [llmstxt.org](https://llmstxt.org). Only the H1 is required; everything after it is optional but conventional.

```markdown
# Project Name

> One-sentence summary with the key facts.

Free-form body: what the project is, and the conventions that govern the whole surface.

## Section name

- [Link title](https://absolute-url): what is behind the link and why you would follow it.

## Optional

- [Secondary link](https://absolute-url): safe to skip when context is short.
```

- Every list item needs a real markdown link. A bare bullet with no link is not a valid file-list entry — move that fact into the body prose instead.
- Use absolute URLs. The file may be read from `node_modules` with no site around it.
- `## Optional` has defined meaning: an agent short on context may skip it. Put the gap report and the source link there, not the conventions.
- The file may live at any path, not only the site root. Agents prefer the most specific one covering a URL.

## Step 5 — Decide where it ships

State the decision and the reason; do not ship to both by reflex.

| Destination | Argues for it |
| --- | --- |
| Package `files` → `node_modules/<pkg>/llms.txt` | the agent that needs orientation is sitting on the installed package. It has `node_modules`; it may have no network |
| Docs site `public/llms.txt` | `llms.txt` is a web convention and anything fetching `/llms.txt` expects it served |
| Both | correct when the project is a published package *and* has a site. Generate both from one function and cover both with the drift check so they cannot diverge |

Weigh the package cost honestly: a few KB against what the package already ships. For a library whose declarations dwarf its runtime code, this is noise. For a package measured in kilobytes total, it may not be.

## Step 6 — Report the gap, do not fill it

Generating from the real surface is what makes missing documentation visible for the first time. Expect the count to be large.

Do **not** write the missing documentation in this pass — it is a separate body of work and it will swamp the change. Instead:

1. Have the generator print the undocumented members, grouped, as markdown.
2. File an issue with that output, plus the areas that have no documentation page at all.
3. Propose a slicing, largest or highest-traffic area first, so the work has an obvious next step.
4. Link the issue from the change that adds the generator.

Regenerate the list rather than transcribing it — the issue body should say where the number came from and how to reproduce it.

## Step 7 — Wire the drift check into what CI already runs

A generated file nobody regenerates is a hand-written file with extra steps.

**Find the command CI actually runs.** Do not assume. Read the workflow; if it calls a reusable workflow, read that too — the script name is often not in the repo at all.

```bash
cat .github/workflows/*.yml
```

Then add the check to that command's chain, not to a new job:

```jsonc
{
  "scripts": {
    "docs:llms": "node <path>/generate-llms-txt.mjs",
    "docs:llms:check": "node <path>/generate-llms-txt.mjs --check",
    "verify": "run-p check docs:llms:check verify:pkg"
  }
}
```

A new CI job is the wrong shape here: it is another thing to keep green, and it will not run in the same conditions as the check the repo already trusts.

## Step 8 — Verify

1. Run the generator; confirm the working tree changes only the intended files.
2. Run `--check`; it must pass.
3. Change one thing in the source surface, regenerate, confirm the file moved with it, and revert. A generator that produces a constant is worse than a hand-written file, because it looks maintained.
4. Run the repo's formatter and full verify.
5. If the file ships to a site, confirm it appears in the built output.

## Updating an existing llms.txt

If the project already has one:

- **Generated already** — run the generator and commit the diff. If the diff is empty but the surface changed, the generator is not reading what it claims to; fix that first.
- **Hand-written** — do not patch it. Replace it with a generator, and use the existing file as the source for the prose sections only. Show the user the before/after of any prose you carry over.
- Never edit the output file directly. If the wording is wrong, the generator is wrong.

## Reporting

Say what the file covers, where it ships and why, what the drift check hangs off, and the size of the documentation gap the generation exposed.
