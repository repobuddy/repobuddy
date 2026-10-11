---
subject: packages/buddy/skills/issue/SKILL.md
eval:
  layers: [trigger, behavior, quality]
  judge:
    model: claude-sonnet-4-6
    default_threshold: 4
  trigger:
    activation_threshold: 0.8
    runs: 3
---

# issue — measurement policy

The subject is `packages/buddy/skills/issue/SKILL.md` together with
`references/project-tracker.capabilities.github.md`, which holds the commands the judge follows.

**All three layers carry signal.** Trigger: the skill sits beside `to-question`, which shares its
vocabulary ("ticket", "issue"), and an epic-planning skill. Behavior: duplicate search, confirmation,
and category mapping are conduct. Quality: whether a body fits its category is a gradient.

**`activation_threshold` is 0.8**, for the same reason as `to-question`: the skill is chosen against a near-identical sibling.

**The rubric scenario carries its own threshold (7 of 9)**, which overrides `default_threshold`.

## The rubric: what each dimension pays for

`writes a task body whose end state and scope can be checked` has two dimensions, each worth 3,
threshold 5. Two properties the first draft scored are now booleans, because nobody would trade them
for strength elsewhere: leaking a commit SHA or internal address
(`keeps a commit SHA and an internal tracker address out of a public issue body`) and carrying
bug-only sections (`leaves bug-only sections out of a task body`).

| Dimension | Plausible wrong subject | What it banks | Trade |
|---|---|---|---|
| `end_state_checkability` | restates the title as the goal ("migration is finished") | 0 to 1 | A precise scope can pay a little for a weak end state, because the reader can still derive a check from a well-scoped task. |
| `scope_statement` | copies the user's sentence and names no boundary | 0 to 1 | A checkable end state can pay a little for a loose scope, because the check pins the scope. |

The best wrong subject banks end-state 1 and scope 3, or the reverse, so 4 of 6, strictly under the
threshold of 5. A subject strong on one and absent on the other scores 3 and fails. The cut has not
been measured against a judge's noise (cSEM); that needs a non-author run, so treat 5 as ungrounded.

## Known weaknesses

A judged run reads a narrated transcript. Five scenarios assert that a command ran or did not:
`creates only after the summary is confirmed`, `creates nothing when the user declines`, `stops at a
confirmed duplicate`, `does not file a vulnerability publicly`, and `refuses a host with no tracker
set up`. A transcript cannot show that nothing was created, so treat their passes as unproven. The
same limit is recorded for `to-question`. Real filing is verified by hand on a throwaway issue that is
closed at once, never by an eval.

The untested `--type` call on a repository without issue types is deliberately never made: the
`falls back to labels` scenario asserts it is not passed.
