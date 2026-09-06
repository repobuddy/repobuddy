# Shape: unblock

Use when the person is **stuck and needs a named human to do a named thing** — "can someone unblock
me". Same situation as a question (stuck, needs a person), different structure: the reader is not
being asked to weigh alternatives, they are being asked to act.

Signals for this shape: *blocked*, *stuck*, *waiting on*, *can't proceed until*, *need access to*,
*need a review before*, *nobody has*, or any request that already names a deadline.

## Sections

| Section | Carries | Required |
|---|---|---|
| _(opening line)_ | What is blocked and what you need, in one line, unlabelled | yes |
| Blocked on | The specific thing standing in the way — the error, the missing access, the unanswered decision. One paragraph, plus the exact error text in a code block if there is one | yes |
| What I've already tried | Each attempt and what it produced. This is what stops the reader replying with something already ruled out | yes |
| What I need from you | **The named ask** — a person, role, or team, plus one concrete action | yes |
| By when | A date or time, and what slips if it is missed | yes |
| Link | Where the work is: the PR, ticket, branch, or run | if applicable |

## Rules

- **The ask is a slot, not a sentiment.** "What I need from you" names *who* and *one action they
  can take* — "@dana: approve the staging role change" or "someone on platform: re-run the release
  job with the new token". Never "any help appreciated", "thoughts?", or "let me know". A ping with
  an unnamed ask is the failure this shape exists to prevent.
- **If the user has not said who or what, ask them before drafting.** Those two facts are what make
  a ping work, and guessing at them produces a draft that looks finished and does nothing.
- **State the deadline even when there is none.** Write "no hard deadline, but it blocks the 0.9
  release notes" rather than dropping the section — a missing "by when" reads as *not urgent*, and
  the reader schedules it accordingly.
- **No Options section.** If you find yourself deriving alternatives for the reader to choose
  between, this is the wrong shape — that is [question.md](./question.md).
- **Keep it short.** A ping is scanned, not read. If "already tried" runs past four bullets, the
  reader is being asked to debug rather than to act.

## Rendering

The sections above are the shape; the markup is the target's. Load the dialect file in `../assets/`
for the target platform and render the section headers its way — `*bold*` with an emoji for Slack,
`## Heading` for the Markdown family, `h2.` for Jira. Then run the format checker as usual.

The Markdown family's per-platform limits are rows in `assets/markdown.md`'s capability table, and
two of them bite this shape in particular: **Asana has no tables and no real heading hierarchy**, so
"already tried" is a list there and the section headers are styled text; **Linear caps headings at
`####`**, so sub-attempts cannot nest past it.

### Slack (the default target)

````
*Blocked on the staging IAM role — I need someone with prod-admin to grant it.*

🚧 *Blocked on*

The deploy job can't assume `staging-deployer`; every run since Tuesday fails at the assume-role
step, so nothing has reached staging in three days.

```
AccessDenied: User arn:aws:iam::…:user/ci is not authorized to perform sts:AssumeRole
```

🔁 *Already tried*

• Re-ran the job with a fresh token — same error
• Checked the trust policy against the docs — the CI principal is missing from it
• Asked in #infra on Tuesday — no reply

🙋 *What I need from you*

@dana (or anyone with prod-admin): add our CI principal to the `staging-deployer` trust policy.
Two-line change, I can send the exact JSON.

⏰ *By when*

Thursday. After that the 0.9 release notes slip, since nothing can be verified on staging.

🔗 <https://example.com/ci/run/812|The failing run>
````

### Markdown family and Jira

Same sections, the target's headings, no emoji unless the user asks for them:

````
Blocked on the staging IAM role — I need someone with prod-admin to grant it.

## Blocked on
…

## Already tried
…

## What I need from you
…

## By when
…
````
