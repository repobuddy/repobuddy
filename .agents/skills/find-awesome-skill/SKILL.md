---
name: find-awesome-skill
description: Use this skill when looking for curated skill recommendations from awesome lists, with exact install commands.
metadata:
  internal: true
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

Use this section when the user asks which sources are searched, or when the CLI returns no results and you need to diagnose missing configuration.

## Search flow

### 1. Primary path — use the CLI

Run the bundled finder with JSON output (machine contract):

```bash
npx cyber-skills@<version> awesome find "<query>" --json
```

Parse the JSON array and present concise results with install commands. Default CLI output (without `--json`) is human-readable prose for summaries only.

### 2. Fallback — when the CLI cannot fully answer

Use manual reasoning from the source layers above when:

- `cyber-skills` is unavailable or `awesome find` fails
- the query returns **zero results** — inspect configured sources and suggest `configure-awesome-sources`
- the user asks **which sources** are searched (see Source discovery)
- you need to explain match rationale beyond JSON fields (corroboration across sources, tag vs summary nuance)

When falling back, merge duplicate repo or skill entries across sources and rank by:

- exact name match
- summary match
- tag match
- corroboration count
- source class preference

Return concise results with:

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
