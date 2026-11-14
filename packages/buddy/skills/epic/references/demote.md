# Demote (initiative → epic)

1. **Read the initiative.** Parse it with the source tracker's `Url`; read its body and its child epics (the `Link` section's tree). When its level is not initiative, say what it is and stop. When the tracker holds no initiative level, say so and stop.
2. **Warn about the metric.** Quote the `Metric` section from its body and say an epic has no metric, so it is dropped. Ask whether to keep the text under the epic's `Non-goals` or `Scope` as a note; never carry it as the done-when.
3. **Level check.** Read the initiative level's `Too small` in `project-tracker.levels`. When the initiative meets none of it, say so and ask whether to go on.
4. **Ask about each child epic, one by one.** Show its title, URL, state, and open children. Offer what the reference's `Retype` row for initiative → epic allows: keep it attached as the row says, or detach it to stand alone as an epic. When the user wants it folded in as an issue, that is an epic → issue change: say it belongs to `issue` and leave the child attached until then. A child epic is never closed by this mode.
5. **Where the epic lives.** Resolve the tracker for level epic and the initiative's category; the same tracker retypes in place, another is a move (run [Moves](moves.md) step 1 now).
6. **Confirm.** Show the retype (in place or new item, the steps, the limits), the new body (from `project-tracker.template.epic`, without the `Metric` section, with the note from step 2 if kept), and every child epic with what happens to it. Wait for a yes.
7. **Retype.** Run the row's steps, rewriting the body when the row says how (when it does not, say the `Metric` section is still in the body), and each child's detach; or Moves.
8. **Read back and report.** The epic's URL, each child epic with what happened to it, and the dropped metric.
