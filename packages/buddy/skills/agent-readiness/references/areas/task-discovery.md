# Task discovery (weight 5)

How an agent learns what "done" means for a task it picks up.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `contributing` | 3 | no | script: `CONTRIBUTING.md` at the root, in `.github/`, or in `docs/` |
| `issue-templates` | 3 | no | script: `.github/ISSUE_TEMPLATE/` or `.gitlab/issue_templates/` |

## What the script cannot see

- whether CONTRIBUTING matches how work is done now
- a definition of done that names the verify command
