# Glossary

The project's ubiquitous language. Every load-bearing term defined once, in plain words.

| Term | Means |
|---|---|
| **Skill** | A `SKILL.md` file plus the material it loads, installed into a consumer's agent. The unit this repo ships. |
| **Public skill** | A skill under `skills/`, shipped to consumers. Contrast **repo-private skill** under `.agents/skills/`, which carries `metadata: internal: true` and is never shipped. |
| **Asset** | Material a skill loads at runtime rather than inlining — for `to-question`, the per-platform syntax references under `assets/`. Part of the skill's unit, not a `design/` rule. |
| **Target platform** | Where composed text is destined to be pasted (Slack, Asana, Jira, Linear, GitHub, GitLab, email). It selects the **markup dialect**, nothing else. |
| **Comment target** | A tracker (Jira, Linear, Asana, GitHub, GitLab) where the composed text is pasted as a **comment on an item that already exists** — never as a new item. Creating items belongs to `create-issue`. |
| **Markup dialect** | The syntax a platform accepts. Slack's mrkdwn and Jira's wiki markup are not Markdown, so the same content renders differently or not at all. |
| **Composition** | Turning a half-formed question into structured content — the sections, the options, the actual questions. Distinct from **rendering**. |
| **Rendering** | Expressing already-structured content in one platform's markup dialect. |
| **Delivery** | Getting rendered text to the platform. `to-question` hands off at the clipboard; it never posts. |
| **Section template** | The fixed content shape `to-question` composes into: Context → Use Cases → Problem → Options → Questions (+ optional Research). |
| **Handoff sink** | Where a composed artifact is left for the user. Today: a file at `/tmp/question.md` plus the system clipboard. |
