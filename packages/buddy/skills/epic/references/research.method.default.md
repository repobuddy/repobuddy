---
description: How a plan researches its idea, feasibility, and prior art before its intent is final, and where the result lives.
tags: [research, epic]
---
## Method

Run the `deep-research` skill of the `research-workbench` plugin on the drafted intent: the outcome sentence and the main jobs or use cases. Ask it to cover:

1. **Idea.** Whether the problem is real and stated correctly, who else has it, and how they describe it.
2. **Feasibility.** Platform limits, costs, quotas, and APIs that exist or do not. Give each claim a source, and mark anything not verified.
3. **Prior art.** Existing solutions, each with its pros and cons against the drafted intent. End with a recommendation to adopt, extend, or build, and the reason.

When `research-workbench` is not installed, do the same three parts with web search. Say in the artifact that the method fell back.

## Artifact

The result is durable and linked, never copied into the plan:

- A research topic folder, when the research method writes one, linked by URL.
- Otherwise a comment on the plan's own issue (after filing) or on its design issue, listing each finding with its source.

Before the plan is filed, keep the findings in the session. Post the comment right after the epic is created, and link it under `Research and sources`.

Every change the research makes to the intent goes in the artifact: what changed, and the finding that changed it.

## Skip

A small change skips the research or does a quick prior-art search instead. It skips when the plan builds nothing new: it renames, moves, or retires things the team already owns. Record the skip as `Skipped: <reason>` under `Research and sources`, so a reviewer can tell a skip on purpose from one that was forgotten.
