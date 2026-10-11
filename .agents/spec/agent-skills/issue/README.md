---
spec-type: behavioral
concept:
  - tracked-work
  - duplicate-prevention
  - tracker-capabilities
---

# issue

## What

A person has found a defect, wants a capability, or has a chore to track, and wants it on the
repository's issue tracker as one well-formed item. Left alone, an agent files it without looking
for an existing one, invents labels the repository does not have, and puts the wrong shape of text
in the body.

`issue` files **one item of tracked work**: a **bug**, a **feature**, or a **task**. It gathers the
details, searches for a duplicate, confirms with the person, creates the item, and reports the URL.
It replaces `file-issue` ([ADR 0003](../../design/decisions/0003-split-file-issue-by-level.md)); the
rename is breaking and ships with a major changeset.

**The skill owns the workflow; a capabilities reference owns the tracker.** The tracker's commands
live in `project-tracker.capabilities.<tracker>`, found by listing that name prefix. This unit ships
`project-tracker.capabilities.github` and nothing else. Until GitLab's reference ships, `issue` keeps
a short GitLab fallback inline; Bitbucket is dropped because its native tracker is gone.

**Category and level are separate.** Category (bug, feature, task) says why the work exists. This
skill creates at the issue level only. When an item looks too big or too small, it suggests another
level in the confirmation and files at this one unless the person changes it. It does not promote or
demote.

**What the tracker does with the category.** On GitHub the issue type carries it (`Bug`, `Feature`,
`Task`). A repository without issue types, such as a user-owned one, gets the `bug` or `enhancement`
label, and a task gets a label only if the repository has `task`.

### Non-goals

- Epics, initiatives, and level changes ([ADR 0003](../../design/decisions/0003-split-file-issue-by-level.md): the `epic` and `initiative` skills).
- Comments on an existing item (`to-question`).
- Closing, retyping, or moving an existing item.
- Security vulnerabilities: never a public issue; the skill points to the private channel.

### Settled by the spikes

- Minimum `gh` is 2.94.0, the first release with `--type`, `--parent`, and `--add-sub-issue`
  (release notes of v2.94.0, 2026-06-10). Checked against 2.102.0.
- `--type` on a repository without issue types is **untested**. The reference reads `issueTypes`
  first and never passes `--type` when it is null.

## Use Cases

1. A maintainer reports a bug and gets a duplicate check, a confirmation, and a bug-shaped issue.
2. A contributor proposes a feature and gets a feature-shaped issue.
3. A maintainer tracks a chore and gets a task-shaped issue.
4. A reporter whose problem is already filed is sent to the existing issue and files nothing.
5. A reporter in a user-owned repository, with no issue types, gets the category as a label.
6. A reporter with a GitLab remote still files, through the fallback.
7. A reporter on an unsupported host (Bitbucket) is told so and nothing is filed.
8. A reporter whose item is too large for one issue is told, and chooses.

## Control Flow

1. Resolve the tracker: list `project-tracker.capabilities.` names, load the one whose Detect matches
   the remote; fall back to the skill's shipped GitHub copy, then the GitLab fallback; else stop.
2. Gather title, category, description; for a bug, environment.
3. Search at least twice. A confirmed match ends the run with the existing URL.
4. Confirm title, category, type or label, key points. No confirmation, no write.
5. Create per the reference's Kinds and Create; report the URL.

## Scenario map

See [issue.feature](./issue.feature). Measurement policy: [eval.md](./eval.md).
