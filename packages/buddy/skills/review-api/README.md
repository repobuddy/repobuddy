# review-api

Review a library's public API for consistency and completeness — measured against the library's own conventions, not an outside style guide.

## When to use

- "review this project for consistency and API completeness"
- "what is missing from the API?"
- "are the docs in sync with the exports?"
- before a major release, when the surface is about to be frozen

## What it does

1. **Finds the surface** — every exported name, from the entry points.
2. **Infers the canonical shape** from a few exemplar units: signature form, naming, namespace members, doc vocabulary.
3. **Runs three read-only audits** in parallel, on cheap subagents where the harness supports them:
   - *Shape conformance* — units that deviate from the canonical shape.
   - *Sibling completeness* — members missing where an existing family makes the analogy clear (`Add`/`Subtract`/`Multiply` → `Divide`; `IsX` → `IsNotX`).
   - *Docs vs exports* — undocumented exports, stale references, generated files with no sync check, duplicated doc homes.
4. **Verifies every claim** against the code before it reaches the report.
5. **Reports by priority** — obvious fixes, design-level drift, sibling-justified gaps, docs — with a suggested order of work.

## What it will not do

- Propose an API that no existing sibling justifies.
- Report a documented, intentional exception as drift.
- Edit code or file issues on its own. It offers both once the report is done.

## Install

```sh
npx skills add repobuddy/repobuddy --skill review-api
```
