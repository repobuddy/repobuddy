# Glossary

The project's ubiquitous language. Every load-bearing term defined once, in plain words.

| Term | Means |
|---|---|
| **Skill** | A `SKILL.md` file plus the material it loads, installed into a consumer's agent. The unit this repo ships. |
| **Public skill** | A skill under `skills/`, shipped to consumers. Contrast **repo-private skill** under `.agents/skills/`, which carries `metadata: internal: true` and is never shipped. |
| **Bundled reference** | Material a skill loads at runtime rather than inlining — for `to-question`, the dialect and shape files under `references/`. Part of the skill's unit, not a `design/` rule. The agentskills layout also allows `assets/`, for static resources rather than documentation. |
| **Target platform** | Where composed text is destined to be pasted (Slack, Asana, Jira, Linear, GitHub, GitLab, email). It selects the **markup dialect**, nothing else. |
| **Comment target** | A tracker (Jira, Linear, Asana, GitHub, GitLab) where the composed text is pasted as a **comment on an item that already exists** — never as a new item. Creating items belongs to `issue`. |
| **Markup dialect** | The syntax a platform accepts. Slack's mrkdwn and Jira's wiki markup are not Markdown, so the same content renders differently or not at all. |
| **Composition** | Turning a half-formed question into structured content — the sections, the options, the actual questions. Distinct from **rendering**. |
| **Rendering** | Expressing already-structured content in one platform's markup dialect. |
| **Delivery** | Getting rendered text to the platform. `to-question` hands off at the clipboard; it never posts. |
| **Section template** | The fixed content shape `to-question` composes into: Context → Use Cases → Problem → Options → Questions (+ optional Research). |
| **Handoff sink** | Where a composed artifact is left for the user. Today: a file at `/tmp/question.md` plus the system clipboard. |
| **Routing skill** | A skill whose body routes a request to one of several modes, each with its own steps. Named after its noun, bare (`session`, `epic`); a single-procedure skill keeps a verb-noun name. See ADR 0002. |
| **Category** | Why a piece of tracked work exists: bug, feature, or task. Independent of **level**. |
| **Level** | How much structure a piece of tracked work needs: **issue**, **epic**, or **initiative**. Each level is defined by checks a team can override, not by size words. See ADR 0003. |
| **Issue** | The base level: one deliverable, one owner, ships in one or a few PRs within an iteration. Done when it ships. Asana calls it a task. Owner: the `issue` skill (formerly `file-issue`). |
| **Epic** | Several independently shippable issues that together deliver one outcome. Done when its children are done. Owner: the `epic` skill. |
| **Initiative** | Several epics aimed at a measurable goal, across teams or quarters. Done when the goal's metric is met, not when its children close. Owner: the `initiative` skill. |
| **Shell** | An epic filed with a title, an owner, and a one-line outcome, and no child issues yet. `initiative` files its epics as shells; `epic` breaks one down when its work starts. |
| **Promote / demote** | Move tracked work up or down a level, keeping its category. Run by the skill of the level being entered. How it happens (in place or a new item, what the children do, the limits) comes from the tracker's capabilities reference, which a team can override; a change that crosses trackers follows the routing; the skill keeps the confirmations and the guards. |
| **Capabilities reference** | What one tracker supplies to the level skills: the operations (`detect`, `kinds`, `search`, `create`, `link`, `retype`, `close`, `url`), the levels and categories it holds, and its visibility. Shipped under the shared name `project-tracker.capabilities.<tracker>` by whichever package provides the tracker, and found by listing that prefix. Not the same as a **target platform**, which only selects a markup dialect. See ADR 0003. |
| **Routing** | The project's `project-tracker.routing` reference: which tracker holds each level and category, and how work moves between trackers. Written by the `project-tracker` skill. |
| **Pin** | A tracker's qualified reference name in the routing: `<plugin>/project-tracker.capabilities.<tracker>`, or the bare name when the project itself defines the tracker. The plugin qualifier keeps two plugins that ship the same tracker apart. See ADR 0003. |
| **Scaffold recipe** | A reference a plugin ships as `scaffold.recipe.<name>` that holds the details of one kind of project: its inputs, files, pinned settings, checks, and steps after the first push. Its format is `scaffold.contract`, which repobuddy owns; the `scaffold` skill applies it and names no recipe itself. |
