# Addition: Commit Discipline

## Covered when

The merged view already tells the agent **whether to commit a finished unit of work without being
asked**. Any of these counts:

- a rule to commit each unit of work as soon as it is complete, under any heading
- an explicit rule the other way: commit only when the user asks, or never commit. The repository
  has decided; an addition would contradict it.
- a `## Commit Discipline` section written by cyberplace's `init-commit-discipline`, with or without
  its **Auto-commit rule**. Count it as covered even without that rule, so it goes to the stale check
  instead of being offered a second section beside it.

Rules about how to stage or how to write a message, with nothing about when to commit, are not
coverage. Neither is a commit rule that appears only in a skill body: this addition is for the
always-loaded file.

## Stale when

Compare the `## Commit Discipline` section already in the file against each wording in
[commit-discipline.history.md](commit-discipline.history.md) by the procedure in [../enhance.md](../enhance.md), step 3, with the
text below as the current text.

The retired wordings end with a `### References` bullet naming the commit skill the owner chose when
the section was written, such as `commit-work`. Treat that bullet as one sentence whatever skill it
names.

cyberplace wrote the **Auto-commit rule** paragraph only when the owner opted in, so the history
holds the wording with it. A section that is that wording without the paragraph reads as a
`conflict`: it is the retired wording, with auto-commit declined. Treat it as from a retired wording,
and when you offer the current text in its place, say that the current text commits without being
asked, which that section does not.

## Offer this text verbatim

```markdown
## Commit Discipline

Commit each unit of work as soon as it is complete and verified, without waiting to be asked. Finishing several units before committing, or putting two units in one commit, breaks this rule.

A unit of work is one coherent change that can be reverted on its own: one feature, one bugfix, one refactor, one config change, or one test expansion for one concern. A red-green-refactor cycle alone is not a unit.

Commit with the `commit` skill from repobuddy. Where it is not installed, stage only this unit's files by name, leave unrelated changes unstaged, and never commit with failing checks.
```

## Where it belongs

**Recommend this repository's root `AGENTS.md`.**

The rule changes the repository's history, so every agent that works in it should follow the same
one: the owner's, a contributor's, and any agent CI runs. Whether a repository wants a commit per
unit is its own convention, like its commit message format.

Offer the owner's global file as the alternative, and name what each one buys:

| Destination | Reaches | Costs |
| --- | --- | --- |
| this repository's `AGENTS.md` | everyone who clones it, and any agent CI runs | a copy per repository |
| the owner's global file, `~/.agents/AGENTS.md` | every repository the owner opens, the owner only | the owner's agents also commit unasked in repositories whose rules say nothing about it |

The global file fits an owner who wants this in every repository they work in. Its cost is worth
saying: in a repository that is not theirs and does not ask for it, their agent commits anyway.

## Do not edit it

The wording is fixed. Do not add the repository's commit types, its commitlint rules, or its
validation command: those belong to the `commit` skill, which reads them from the repository, or to
the owner's own paragraphs. Offer it as written or not at all.

If the text is ever revised, append the outgoing wording to `commit-discipline.history.md`, newest
first, exactly as it was offered, with `prose-update retire`. Write the new wording so it only adds
sentences after the old ones where it can: such a revision merges without collision.
