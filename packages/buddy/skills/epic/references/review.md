# Review

Judge an epic, filed or drafted, against `project-tracker.criteria.epic`.

1. **Read it.** A filed epic: read its body, its native tree, each child's body, its blocked-by graph (`epic-plan.mjs graph`), and the result of `epic-plan.mjs check` on GitHub. A draft: read the file or text the user gave. A draft has no tracker, so it skips the `script` parts of EP9 and EP11 and judges them by reading.
2. **Judge** every criterion, EP1 to EP14, in the order of the skill's Plan section. For each failure, name the line that fails it and what would fix it. For EP5, re-read each fact the plan states from its source. A fact you cannot re-read fails.
3. **Read-only or fix.** A review the user asked only to judge, or of an epic they do not own, is read-only: skip to step 5. Otherwise fix the plan as the Plan section's step 3 says: fix, judge again, and repeat until nothing fails or a round fixes nothing new. A fix that needs the user's decision goes under `Open questions`. Keep each round a change of the plan's text and links. A change that adds, splits, merges, or supersedes a child is Revise: name it, and leave it to Revise.
4. **Confirm the fixes** of a filed epic as Revise step 5 does, and apply them as Revise step 6. A draft's fixes are written to the draft.
5. **Present,** in one message: what changed across the rounds, grouped by criterion; the final pass or fail of each criterion, with the line that still fails it; the open questions that need the user, each with a recommendation; and, for a filed epic, [Validate](../SKILL.md#validate) V1 to V5. End with one line, `Failed:` and the IDs of the criteria and checks that still fail, or `none`.
