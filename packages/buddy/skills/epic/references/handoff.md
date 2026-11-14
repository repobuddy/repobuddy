# Handoff

Check that an epic, filed or drafted, is ready to run unattended, by an agent fleet or a person who was not in the planning, and write its run order.

1. **Read the epic** as Review step 1 does. A draft has no tracker: judge V1 to V5 by reading its body, and say so.
2. **Judge readiness.** The epic is ready when all of these pass:
   - [Validate](../SKILL.md#validate) V1 to V5.
   - EP6 to EP11: no undecided design is a delivery child, every child names its executor, every step an agent cannot do is a person's, every irreversible step waits for a confirmation, every blocker is needed, every done-when is reachable, and every child stands alone.
   - Every open spike or design issue that a child waits on is a blocker of that child.
3. **Write the run order.** From `epic-plan.mjs graph`, build the table of wave, child, executor, and blocked by, with one row per open child. Under it, write one line saying what an agent does at a person's step: it stops, posts on the issue what the person must do, and waits. The executor comes from each child's body. A child with none fails EP7, so do not guess one.
4. **Confirm and write.** Show the run order, and each failing check with what fixes it. When the body's run order differs from the new one, wait for a yes, rewrite the body's `Run order` section, and run `check` again.
5. **Report** `Ready` or `Not ready`, then the run order, then each failing check or criterion with its fix. A not-ready epic names the mode that fixes it: Revise for a plan change, Review for the plan's text.
