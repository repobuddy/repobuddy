---
name: code-review
description: Use this skill when reviewing code through the Linus, Uncle Bob, and Fowler lenses — reports split verdicts.
---

# Code Review

Apply when reviewing a diff, branch, or PR and a single verdict would hide a real design tradeoff.

## When to use

- Reviewing a change set before merge, when design quality matters more than defect count
- Deciding whether an abstraction earns its keep
- A review has stalled on taste, and the disagreement needs naming rather than settling

Not for mechanical defect hunting — tests, type checkers, and linters find those first. Run them before this skill and treat their output as given.

These are **lenses named after well-known engineering stances**, not statements by the people named. Never present a verdict as a quotation, and never invent one.

## Workflow

### 1. Establish the change set

Resolve the base before reading anything:

| Situation | Base |
| --- | --- |
| User named a commit, tag, or branch | Use it verbatim |
| Working on a feature branch | `git merge-base HEAD <default-branch>` |
| Uncommitted work | `HEAD` |

Read the full diff with `git diff <base>...HEAD`. Read whole files for any file the diff touches in more than one place — a lens applied to a hunk in isolation produces false verdicts.

### 2. Run three independent passes

Complete each pass before starting the next. Do not carry one lens's conclusion into another.

**Linus — does the structure survive contact with reality?**

| Check | Fails when |
| --- | --- |
| Data structures precede code | The design is a pile of functions with the shape of the data left implicit |
| Special cases | A branch exists that a better data layout would delete |
| Indentation depth | Logic nests past three levels |
| Compatibility | An existing caller, signature, or on-disk format breaks without a migration |
| Cost of generality | An abstraction is added for a caller that does not exist |
| Error paths | A failure is swallowed, logged-and-continued, or left to a nil check downstream |

**Uncle Bob — will the next reader understand it without archaeology?**

| Check | Fails when |
| --- | --- |
| Single responsibility | One unit changes for more than one reason |
| Dependency direction | A policy-level module imports a detail-level one |
| Naming | A name needs a comment to be understood |
| Function scope | A function mixes levels of abstraction, or its name hides a side effect |
| Comments | A comment restates the code or apologizes for it |
| Tests | Behavior added without a test, or a test asserts implementation rather than outcome |

**Fowler — can this design keep changing?**

| Check | Fails when |
| --- | --- |
| Smells | Long method, large class, feature envy, primitive obsession, data clumps |
| Change locality | One conceptual change touches many files (shotgun surgery), or one file absorbs unrelated changes (divergent change) |
| Preparatory refactoring | A hard change was forced in rather than made easy first |
| Domain language | Names in code diverge from the names the domain uses |
| Reversibility | The change bakes in a decision that is expensive to revisit |
| Refactoring safety | Structure moved without tests covering the moved behavior |

Each pass ends in one verdict — `APPROVE`, `APPROVE WITH CHANGES`, or `REJECT` — plus findings anchored to `file:line`. A finding with no anchor is not a finding; drop it.

### 3. Report the split

Never average the three into one score. Never let a majority silence a dissent.

```markdown
## Verdicts

| Lens | Verdict | Headline |
| --- | --- | --- |
| Linus | REJECT | `parser.ts:40` — three-level nesting hides the state machine |
| Uncle Bob | APPROVE WITH CHANGES | `parser.ts:12` — `handle()` mixes I/O and parsing |
| Fowler | APPROVE | no smell above threshold |

## Where they disagree

**Abstraction depth (`parser.ts:12`)** — Uncle Bob wants `handle()` split by level of
abstraction; Linus reads the extra indirection as cost without a caller to justify it.
The split pays off only if a second parser is coming. It is not in this change set.

## Agreed

- `parser.ts:40` — the nesting is a problem under all three lenses.
```

Lead with what all three agree on: unanimous findings are the ones to fix first. Then name each tension as a tradeoff with the condition that resolves it, and say which way the current change set points. Recommend, but leave the call to the reviewer.

## Anti-patterns

- Averaging three verdicts into a score, or reporting only the majority
- Running the passes together, so one lens's finding seeds another's
- Caricature — profanity, catchphrases, or persona voice in place of a criterion
- Attributing a verdict to the real person as though quoted or sourced
- Findings with no `file:line` anchor
- Re-reporting what a linter or type checker already flagged
- Declaring a tension resolved when the change set does not settle it

## References

```bash
npx cyber-skills@0.4.3 governance show skill-design
```

- Refactoring catalog and smell names — https://refactoring.com/catalog/
- Linux kernel coding style — https://docs.kernel.org/process/coding-style.html
