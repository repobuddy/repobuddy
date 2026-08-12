# workflows

How capabilities compose into whole flows — the project-level suite. A workflow is the project-level
analogue of a use case: a path through several capabilities rather than through one.

No workflows are backfilled yet. The first candidate is the *ask-then-file* flow, where a question
composed by `agent-skills/to-question` becomes an issue filed by `create-issue` — but that flow
crosses two units, only one of which is specified, so it waits.
