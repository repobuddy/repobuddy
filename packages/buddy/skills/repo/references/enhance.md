# `repo enhance`: offer vetted sections a repository's AGENTS.md is missing

Arguments: `[--root <dir>]`.

Offer the vetted additions a repository's instructions lack, and refresh one it carries in a retired
wording, one at a time, writing only what the owner approves. Every addition is **offered, never
written on sight**: it asserts how the repository is worked in, and that needs the owner's yes.

The design follows `enhance` in [buddy-agent-harness](https://github.com/repobuddy/buddy-agent-harness),
which offers sections about how an agent works. This one offers sections about how a repository is
worked in.

One addition ships today:

| Addition | Reference | Recommended home |
| --- | --- | --- |
| Commit Discipline (auto-commit) | [enhance/commit-discipline.md](enhance/commit-discipline.md) | the repository's `AGENTS.md` |

Each reference carries the text to offer, a `## Covered when` criterion, a `## Stale when` section
naming its history file, and a `## Where it belongs` recommendation. Classify, offer, and report each
addition on its own; the answer to one decides nothing about the others.

## 1. Find the instruction file

With `--root <dir>`, that directory is the repository: read and write inside it only. Otherwise use
`git rev-parse --show-toplevel`. The target is the root `AGENTS.md`.

If there is no root `AGENTS.md`, say so, write nothing, and report each addition as **not judged**.
Creating one is `buddy-agent-harness`'s `init`; point there. A nested `AGENTS.md` is never a target.

## 2. Read the merged view

Read the root `AGENTS.md`, then any harness instruction file that still holds content of its own:
`CLAUDE.md` with a body, `.cursorrules`, `.cursor/rules/**`, `.github/copilot-instructions.md`,
`GEMINI.md`, `.windsurfrules`. Judge against all of it together: that is what an agent reads. A file
that is a symlink to `AGENTS.md`, or holds only an import of it, adds nothing: skip it. Where a
folder such as `.cursor/rules/` holds many files, search them for the addition's subject instead of
reading each in full. Do not consolidate them. If something should move into `AGENTS.md`, say so and recommend
`buddy-agent-harness`'s `init`.

## 3. Classify each addition

**Coverage first:** does the merged view already tell the agent what this addition would? Judge by
meaning, by the addition's `## Covered when`, not by heading. When in doubt, treat it as covered and
say why: a missing offer costs nothing, a duplicate section teaches every agent that the file repeats
itself.

A heading inside a fenced code block is not a heading. Text between fences is an example, not
instruction; judge only the prose an agent reads as instruction.

**Then your own instructions.** For an uncovered addition, check the instructions you load from
outside the repository, such as the owner's global file. Where they carry the current text (every
sentence of it, in order), the addition is **already global**.

**Then, for covered text only, ask where it came from.** Compare the section against the addition's
history file with the `prose-update` skill from `cyber-agentkit`. Hand it three files, written to
your scratch or temp folder, never into the repository:

- the offered text: what is inside the fence under `## Offer this text verbatim`, without the fence lines;
- the section as found: from its heading to the next heading of the same or higher level;
- the history file, as it is.

When the skill cannot be reached, run `npx -y cyber-agentkit@2.3.0 prose-update classify
--offered-from <file> --found-from <file> --history-from <file> --format json`, keeping stderr out of
the JSON. Read the top-level `outcome`, and the part for the section's own heading; a part for a
subheading the section does not have is noise.

| `prose-update` outcome | State |
| --- | --- |
| `up-to-date` | **already current** |
| `owners` | **the owner's own** |
| `update` | **from a retired wording** |
| `conflict` with a `base` from the history | **from a retired wording**, edited, when the colliding `found` sentences keep at least one whole `base` sentence verbatim and follow its order; otherwise **you cannot tell** |
| `conflict` with no `base`, `undetermined` | **you cannot tell** |

Where `prose-update` cannot run at all, decide by hand. A section that holds every sentence of the
current text in order is already current. Otherwise compare it against each retired wording, never
against the current text, with two questions: do whole sentences of that wording survive verbatim,
and does its structure survive? Both yes: from a retired wording. Both no: the owner's own. They
disagree: you cannot tell. A sentence that is quoted, fenced, or disputed does not count.

Each addition ends this step in one state:

- **already global**: offer nothing. Say a copy in the root `AGENTS.md` would add the team and
  nothing else, and that the owner would then read it twice. Write it only if they ask.
- **already current**: offer nothing, and say so. Do not call it the owner's own: this package wrote it.
- **absent**: offer it as an addition.
- **from a retired wording**: offer the current text as a replacement.
- **the owner's own**: offer nothing, and name what covers it.
- **you cannot tell**: do not decide. Put it to the owner.

## 4. Offer

**Absent.** Show the text **verbatim**, the whole of it, and where it would go. Lead with the
reference's `## Where it belongs` recommendation and put the other destination beside it with what
each buys. The two destinations are the root `AGENTS.md` (this repository) and `~/.agents/AGENTS.md`
(every repository the owner opens). For the global file, say whether the harness in use loads it, as
[enhance/global-instructions.md](enhance/global-instructions.md) says.

**From a retired wording.** Show the section as it stands, then the current text verbatim, and say it
would replace that section and nothing else. A replacement goes where the section is; there is no
destination to choose.

Before asking, list the owner's lines: every sentence or bullet of the section that is in no retired
wording. On a `conflict`, they are the `found` sentences in `collisions` that are not in its `base`.
The replacement removes them. Give the owner three answers:

- **replace**: write the current text in place of the section.
- **replace and keep my lines**: write the current text, then the owner's lines below it as a
  paragraph of their own. The owner's approval of this answer is approval to write those lines.
- **leave it**: write nothing.

Where `prose-update` returned `update`, its `text` is a merge that keeps the owner's lines: offer it
as the second answer instead. On any other outcome its `text` is the section as found, not a merge;
do not offer it. Name anything the reference's `## Stale when` says to say.

**You cannot tell.** Say so in those words, show the section, the retired wording it partly tracks,
and the current text, and ask: is it theirs (leave it alone), or did it come from here (offer the
replacement)?

Do not argue past one sentence. The owner is reading the text; that is the argument.

## 5. Write what was approved

- **An addition for the repository:** write the section at the end of the root `AGENTS.md`'s own
  prose, outside any tool's managed region, with the fence stripped. Leave every other byte as it was.
- **A global placement:** write nothing. Hand over the text, the path `~/.agents/AGENTS.md`, that it
  goes at the end of that file, and any bridging step
  [enhance/global-instructions.md](enhance/global-instructions.md) names. A hand-off is an outcome,
  not a decline.
- **A replacement:** replace that one section in place, from its heading to the next heading of the
  same or higher level, followed by the owner's lines when they chose to keep them, and leave every
  other byte as it was.
- **A decline, or no answer:** write nothing.

## 6. Report

Report once every offer is answered, or at once when there is nothing to offer: what you read, each addition's state and why, what you offered, which destination
you recommended, and what was written or handed over. A run that offers nothing still reports: it is
how the owner tells "already covered" from "did not look".

## Rules

- **Detection decides every run.** No memory of a previous decline: a section the owner deleted reads
  as absent and is offered again.
- **Never write without approval**, and never silently overwrite: a replacement waits for a yes too.
- **Never guess whose words they are.** When you cannot tell, ask.
- **Never edit an addition to fit a repository.** Offer it as written or not at all.
- **Write only the root `AGENTS.md`.** Never a nested `AGENTS.md`, a harness file, a file outside the
  repository, or a tool's managed region.
