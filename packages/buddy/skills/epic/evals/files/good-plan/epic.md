# Move the acme docs sites to Astro

## Outcome

Every docs site in the `acme` org builds with Astro, and the Docusaurus builds are gone.

## Key terms

- K1. **docs site**: the `website/` folder of `acme/cli`, `acme/sdk`, and `acme/ui`.
- K2. **Docusaurus build**: the `docs.yml` workflow in each of those repositories.

## Scope

- S1. Port `acme/cli`, `acme/sdk`, and `acme/ui` docs to Astro Starlight.
- S2. Replace each repository's `docs.yml` with an Astro build.

## Non-goals

- N1. Rewriting the docs content. Pages move as they are.
- N2. A shared theme package. Tracked in acme/design#12.

## Open questions

None

## Child Issues

- [ ] #2 Port the acme/cli docs to Astro
- [ ] #3 Port the acme/sdk docs to Astro
- [ ] #4 Port the acme/ui docs to Astro

## Run order

None

## Risks and irreversible steps

None

## Done when

All child issues are done, and the outcome can be observed:

- [ ] D1. `gh run list --repo acme/<repo> --workflow docs.yml --limit 1` shows a green Astro build in each of the three repositories.
- [ ] D2. `grep -r docusaurus website/package.json` finds nothing in any of them.

## Research and sources

- Research: Skipped: the plan moves the team's own sites to a tool the team already uses in acme/web; nothing new is built.
- F1. The three repositories with a `website/` folder: read from `gh search code --owner acme path:website/docusaurus.config.js` on 2026-11-01.

---

# Child issues (drafts)

## #2

Executor: agent. Port `acme/cli`'s `website/` to Astro Starlight and replace `docs.yml`. Done when the Astro build is green on `main`.

## #3

Executor: agent. Port `acme/sdk`'s `website/` to Astro Starlight and replace `docs.yml`. Done when the Astro build is green on `main`.

## #4

Executor: agent. Port `acme/ui`'s `website/` to Astro Starlight and replace `docs.yml`. Done when the Astro build is green on `main`.
