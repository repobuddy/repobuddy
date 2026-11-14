# Moves

A level change crosses trackers when the routing puts the epic level on another tracker than the source item. Retype cannot be in place then.

1. **Read the policy.** Find the `Moves` row whose `From` is the source tracker's pin and `To` the target's. No row means `moved`. Read each tracker's `Visibility` from its `Tracker` section. Private source and public target: stop, with or without a row, and say a private tracker's details never go into a public one.
2. **Confirm** as the mode says, adding: the item to be created on the target, what happens to the source (`moved`: closed as moved; `mirror`: kept open and linked), and every child of the source, with where it stays.
3. **Create** the item at level epic on the target tracker, from the source's text, with a link back to the source in its body.
4. **Link the source.** Comment on the source with the new item's URL. When the source is public and the target private, the comment says only that the work is tracked internally, with no title or URL.
5. **Source after the move.** `moved`: run the source tracker's `Close` with the reason moved. `mirror`: leave it open.
6. **Children.** A child of the source stays where it is. Link each open one from the new item's body (a public new item names a private child only as tracked internally). Re-parent a child only when the target tracker can hold it natively and the user asked. Never close one.
