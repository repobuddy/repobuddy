# Revise

Change an epic that exists: its scope, its children, where they live, or their blockers. Every change keeps the body and the native tree in step.

1. **Read the epic.** Parse it with the tracker's `Url`. Read its body, its native tree (the `Link` section), each child's state and body, and its blocked-by graph (`epic-plan.mjs graph` on GitHub). When its level is not epic, say what it is and stop: an issue is Promote, an initiative is Demote.
2. **Name the change.** Sort the request into one or more of these kinds, and run each through the steps below:

   | Kind | What changes |
   |---|---|
   | **Re-scope** | the outcome, key terms, scope, or non-goals |
   | **Add** | a new child, filed as Create step 8 files one |
   | **Split** | one child becomes two or more; the original keeps the first part, and the new ones are filed |
   | **Merge** | two or more children become one; the others are closed as not planned, each with a comment naming the one that holds their work |
   | **Supersede** | a child is replaced by another item, often a design issue; it is detached and closed as not planned, with a comment naming what replaced it |
   | **Move** | a child or a design issue goes to another repository, with `Transfer` |
   | **Re-block** | the blocked-by graph changes |

3. **Re-settle the plan.** Start the skill's Plan section from the first section the change touches, and carry it through every section after that. A re-scope reopens everything. A split or a merge reopens the children, the dependencies, the executors, and the done-when. When the change adds an outcome or a job, run the research step for it (EP13), and add what it finds to the research artifact.
4. **Search for duplicates** for each new child, as in Create step 5.
5. **Confirm.** Show, in one message, every write the change makes, in the order it will run: each item created, retitled, re-bodied, detached, attached, transferred, or closed, with its title and URL and its reason; each blocker added or removed (the `depend` dry run on GitHub); the epic's new body; and the final pass or fail of each planning criterion. A transfer and a close are irreversible: name them as such. Wait for a yes.
6. **Apply,** in this order, so no link points at nothing:
   1. Create the new children, as Create step 8 does.
   2. Transfer each moving item with `Transfer`, and record its new URL.
   3. Rewrite the bodies of the children that changed.
   4. Detach each superseded or merged child (`Link`), then close it as not planned with its comment (`Close`).
   5. Apply the blocker changes with `Depend`, pruning links the new plan drops.
   6. Rewrite the epic's body, with a redirect note on every reference to a moved item, then run `Sync body`.
7. **Read back and report.** Run [Validate](../SKILL.md#validate) V1 to V5. Report the epic's URL, every child the change touched with what happened to it, and each check that fails.
