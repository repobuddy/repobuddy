# Promote (issue → epic)

1. **Read the issue.** Parse its URL or number with the source tracker's `Url`, and read its title, body, state, category, and level. When its level is not issue, say what it is and stop. When it is closed, ask before going on.
2. **Level check.** Read the issue level's `Too big` in `project-tracker.levels`. When the issue does not meet it, say so and ask whether to go on.
3. **Plan.** Run [Create](create.md) steps 1 and 3, starting from the issue's own text: its outcome becomes the epic's, and its acceptance criteria (`Done when`, `Expected`, a checklist) move into a **first child**, so the epic keeps one done-when, its children's.
4. **Where the epic lives.** Resolve the tracker for level epic and the issue's category. The same tracker as the issue: retype in place. Another tracker: a move; run [Moves](moves.md) step 1 now, before any search, so a private item's text never reaches a public tracker.
5. **Search for duplicates** for each new child, as in Create step 5.
6. **Confirm.** Show what the retype does, read from the reference's `Retype` row for issue → epic (in place or a new item, the steps, the limits), or from Moves; the final pass or fail of each planning criterion; the epic's new body; and each child, the first one with the moved criteria. A row that is silent or unsupported means: create the epic, link the issue, and close it as moved.
7. **Retype.** In place: run the row's steps, and rewrite the body from the epic template when the row says how; when it does not, leave the body and say the criteria are now in the first child. On another tracker: run Moves.
8. **Create the children**, read back, and report, as Create steps 8 to 11. The report says whether the epic kept the issue's URL.
