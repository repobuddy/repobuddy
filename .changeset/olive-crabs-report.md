---
'repobuddy': patch
---

`to-question`: route public venues to `research-workbench:community-post` instead of the Markdown baseline.

An unlisted platform is no longer automatically a fallback case. An unlisted *private* venue —
Notion, Teams — still resolves to the Markdown baseline with the fallback announced. An unlisted
*public* venue — Stack Overflow, X/Bluesky, Reddit, Discord, Telegram, Facebook/LinkedIn — is now
routed to `community-post`, which researches first.

Previously the skill would compose a Reddit or Discord post on the Markdown baseline, which looked
like a supported target and was not: every `to-question` target writes to an audience that already
has the context, so the template opens by asking the question directly and treats Context as what the
thread does not already cover. A public audience has none of that, and owes prior art and a check for
an existing answer besides — both stated non-goals of this skill.
