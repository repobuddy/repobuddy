---
name: create-skill
description: Use this skill when the user asks to create a new agent skill — scaffold, audit, and link into detected agents.
metadata:
  internal: true
---

# Create Skill

When the user asks to create a new skill, follow this convention.

## Skill placement

Pick the placement before scaffolding:

| Placement | Location | Notes |
| --- | --- | --- |
| User | `~/.agents/skills/<name>/` | Personal skills across all projects |
| Project private | `.agents/skills/<name>/` | Contributor tooling; add `metadata: internal: true` |
| Project public | `skills/<name>/` | Shipped with a package; users install via `npx skills add` |

## Skill patterns

Capture the workflow shape separately from placement:

| Pattern | When to use it |
| --- | --- |
| Process | Ordered multi-step workflow with decision points |
| Tool-based | Consistent use of tools, systems, or connectors |
| Standard | Tone, format, structure, or quality enforcement |

Ask the user if the placement or pattern is ambiguous.

## Directory structure

Global skills live in `~/.agents/skills/<name>/` and are linked into each agent's skills directory:

```
~/.agents/skills/
  <name>/
    SKILL.md        ← source of truth, edit this
~/.claude/skills/
  <name>            ← symlink → ~/.agents/skills/<name>  (Claude Code)
# ...and equivalent paths for other detected agents
```

## Steps

### 1. Create the skill

Determine the skill placement (above), then create the directory at the matching path.

Check whether `npx skills` is available:

```bash
npx skills --version 2>/dev/null
```

**If available**, use it to scaffold the skill:

```bash
npx skills init <name> --dir ~/.agents/skills
```

This creates `~/.agents/skills/<name>/SKILL.md` with a starter template. Edit that file to fill in the real content.

**If not available**, create manually:

```bash
mkdir -p ~/.agents/skills/<name>
```

Then write `~/.agents/skills/<name>/SKILL.md` using this template:

```markdown
---
name: <name>
description: Use this skill when <trigger condition>. <One-line summary of what it does.>
---

# <Name>

## When to use

<Describe when this skill should be used.>

## Instructions

1. First step
2. Second step
```

### 2. Audit the skill

Run automated checks first:

```bash
npx cyber-skills@<version> audit validate --path ~/.agents/skills/<name>
```

Fix any CRITICAL findings before proceeding.

Then invoke the **audit-skill** agent skill for full review (Q6–Q12, E3–E8, P1–P3). Do not continue to step 3 if any CRITICAL findings remain.

### 3. Link to agents

**If `npx skills` is available:**

```bash
npx skills add ~/.agents/skills/<name>
```

This detects all installed agents and prompts the user to choose which ones to link. It handles the correct path for each agent (Claude Code, Cursor, Codex, OpenCode, etc.).

**Known issue:** `npx skills` has a bug where it may not create `~/.claude/skills/` if the directory doesn't exist yet. After linking, verify:

```bash
ls ~/.claude/skills/<name>
```

If missing, fall back to the manual step below.

**If `npx skills` is not available, or the symlink is missing after the above:**

```bash
ln -sf ~/.agents/skills/<name> ~/.claude/skills/<name>
```

Adjust the target path for other agents as needed (e.g., `~/.cursor/skills/`, `~/.opencode/skills/`).

## Skill design governance

Before writing content, load the **skill-design** governance:

```bash
npx cyber-skills@<version> governance show skill-design
```

Read stdout as the authoritative rules for principles, progressive disclosure, description structure, and when to extract deterministic logic to scripts or existing project CLIs.

## Scripts and CLI output

If the skill includes a `scripts/` directory or documents CLI commands agents run, also load **agent-tool-output**:

```bash
npx cyber-skills@<version> governance show agent-tool-output
```

Read stdout as the authoritative rules for stdout, JSON, non-interactive paths, and stderr.

## Notes

- `~/.agents/skills/` is the source of truth — commit or back up this directory.
- Agent skills directories (e.g. `~/.claude/skills/`) only contain symlinks; never edit files there directly.
- The `description` frontmatter field is what agents read to decide when to activate the skill — make it specific and include "Use this skill when" trigger language. For sub-skills, prefix with "Internal skill:" to prevent unintended activation.
