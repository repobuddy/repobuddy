---
name: find-awesome-skill
description: Use this skill when looking for curated skill recommendations from awesome lists, with exact install commands.
---

# Find Awesome Skill

Search the user's configured awesome skill sources, merge duplicates, and return concise recommendations with install commands.

## Source discovery

Awesome sources are loaded from these layers, in this order:

1. `.agents/awesome-skill-sources.local.json`
2. `.agents/awesome-skill-sources.json`
3. `~/.agents/awesome-skill-sources.json`
4. The current repo's own `awesome-skills.json` as the default source unless explicitly disabled

Duplicate sources are deduped by `repo + path`.

## Search flow

1. Run the bundled finder:

```bash
npx tsx skills/find-awesome-skill/scripts/find-awesome-skill.mts "<query>"
```

For machine-readable output:

```bash
npx tsx skills/find-awesome-skill/scripts/find-awesome-skill.mts "<query>" --json
```

2. Load configured awesome sources from the three config layers plus the default source.
3. Merge duplicate repo or skill entries across sources.
4. Rank matches by:
   - exact name match
   - summary match
   - tag match
   - corroboration count
   - source class preference
5. Return concise results with:
   - repo or repo+skill identity
   - why it matched
   - primary `why_recommended`
   - whether other sources also recommended it
   - exact `npx skills add ...` install command

## Guidance

- Exact name matches should be treated as the strongest signal.
- Tag and summary matches matter next.
- Corroboration across multiple awesome sources should increase confidence but should not hide why a result matched.
- If no results match, say so directly and suggest adding or configuring more awesome sources.
