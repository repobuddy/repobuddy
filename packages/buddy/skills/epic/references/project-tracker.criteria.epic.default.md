---
description: The planning criteria an epic is judged against before it is filed, revised, or handed off; each with an ID, how it is decided, and the section it judges.
tags: [project-tracker, criteria, epic]
---

## How to read

Each criterion is `- **<ID>** [<how>] <statement>`. Each one passes or fails. `script` means `scripts/epic-plan.mjs` in the `epic` skill's folder decides it from the tracker. `read` means you decide it by reading the plan. The section after each heading is the part of the plan the criterion judges, in the order Create settles them. An ID is never reused. A team that drops a criterion removes it in its override, and its ID stays retired.

A failure names the line that fails it and what would fix it. A fix that needs a decision the user has not made is not a fix. Put it under `Open questions` with the options and a recommendation.

## Outcome

- **EP1** [read] The outcome is one sentence that names one outcome without "and", and says what is true when the epic is done, not what work is done.

## Key terms

- **EP2** [read] Every term in the outcome and the done-when is either defined under `Key terms` or concrete: a named repository, file, app, job, workflow, or command. An umbrella phrase such as "does all bot work" fails until its parts are listed.

## Research

- **EP13** [read] Before the outcome is final, the plan links a research artifact (a research topic, or an issue comment with sources), or it records a skip with its reason under `Research and sources`. Every change the research made to the outcome, scope, or non-goals is in the artifact. A finding that an existing tool already does part of the work is a non-goal ("adopt X") or a child ("adopt or evaluate X"). It is never left out of the plan without a word.

## Scope and non-goals

- **EP4** [read] `Non-goals` lists the adjacent work a reader would plausibly assume is in scope, each one excluded on purpose, with where it lives when it is tracked elsewhere.
- **EP5** [read] Every fact the plan states (an id, a count, a URL, an owner, a date) has a source under `Research and sources`, or was re-read from its system of record before filing. A subagent's report, or a value relayed from one, is not a source. Re-read the value yourself.

## Open questions

- **EP6** [read] No child's content is an undecided design. Each open question is a spike child (`Spike: <question>`, done when a written answer exists) or a separate design issue, linked from `Open questions`. It is never a delivery child whose body would have to settle the design first.

## Children

- **EP10** [read] Every child is self-contained: a person or agent with only that child and the epic can act on it. Its body names what it changes, where, and its own done-when.

## Dependencies

- **EP9** [script, read] The blocked-by graph among the children is acyclic (`epic-plan.mjs graph`, `cycles` is empty). Each blocker is needed: the blocked child uses an output the blocker produces, named in the child's body. Each child's done-when is reachable from the outputs of the children before it in the run order, so no done-when waits on work that no child does.

## Executors and irreversible steps

- **EP7** [read] Every child names its executor (a person, by handle, or an agent), and every step in it that `project-tracker.executors` says an agent cannot perform is marked for a person.
- **EP8** [read] Every irreversible step (a delete, an archive, a transfer, a publish, or any other step `project-tracker.executors` lists as irreversible) is listed under `Risks and irreversible steps` and waits for an explicit confirmation on its issue before it runs.
- **EP11** [script] When the epic has a run order, the body shows it as a table of wave, child, executor, and blocked by, and that table matches the native blocked-by graph (`epic-plan.mjs check`, check `run-order`).

## Done when

- **EP3** [read] Every done-when item is observable by a command to run or a run to link, not by someone's judgment.

## Whole plan

- **EP12** [read] The plan is proportionate. A section the epic does not need is `None`: an epic with two or three children and no blockers has no run-order table, and one with no irreversible step has no risks. A small epic does not get a heavy plan.
- **EP14** [read] The body has every section of `project-tracker.template.epic`, in order, with `None` under one the epic does not need. Every item under `Key terms`, `Scope`, `Non-goals`, `Open questions`, `Risks and irreversible steps`, and `Done when`, and every fact under `Research and sources`, starts with its ID, and no ID labels two items.
