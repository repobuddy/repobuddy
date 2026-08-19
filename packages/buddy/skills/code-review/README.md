# code-review

Review a change set through three named engineering lenses — Linus, Uncle Bob, and Fowler — and report where they disagree instead of averaging them away.

## When to use

- "review this branch"
- "would Linus approve this?"
- "is this abstraction worth it?"
- "review this PR for design, not bugs"

## What it does

Resolves the change set against a base commit, then runs three independent review passes. Each lens applies its own criteria — Linus on data structures, special cases, and the cost of generality; Uncle Bob on responsibility, dependency direction, and naming; Fowler on smells, change locality, and reversibility — and returns its own verdict.

The output leads with the findings all three agree on, then names each disagreement as an explicit tradeoff with the condition that would resolve it. A split verdict is the point, not a failure: where the lenses conflict is where a real design decision is waiting.

The lenses are named after well-known engineering stances. They are not quotations, and the skill does not attribute its verdicts to the people named.

## Install

```sh
npx skills add repobuddy/repobuddy --skill code-review
```
