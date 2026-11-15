# Evidence

Date for all entries: 2026-11-15.

## Claim E1: Agents need explicit commit rules; one logical change per commit is the common instruction
Status: supports | Confidence: medium
Source: awesome-copilot git-commit, getsentry commit, commit-work (all skills that exist to give agents this rule). Type: skill sources (E9-E11).
Notes: The existence and install counts (48.7K, 4.9K, 4.2K) show demand. Install count is popularity, not quality.

## Claim E2: Git's contributor guide says split long descriptions into finer commits; message explains why
Status: supports | Confidence: high
Source: Git SubmittingPatches. URL: https://git-scm.com/docs/SubmittingPatches. Type: project docs.
Notes: Quote: "If your description starts to get too long, that's a sign that you probably need to split up your commit to finer grained pieces." Also "convey the why behind your change". The page does not say "self-contained".

## Claim E3: Conventional Commits makes the message a machine input (changelog, semver)
Status: supports | Confidence: high
Source: Conventional Commits 1.0.0. URL: https://www.conventionalcommits.org/en/v1.0.0/. Type: specification.
Notes: `fix` maps to PATCH, `feat` to MINOR, breaking to MAJOR. Only `feat` and `fix` are defined; other types come from the Angular convention (E10).

## Claim E4: Agent Skills is an open, cross-harness format
Status: supports | Confidence: medium
Source: Codex, Cursor, Copilot docs (E6-E8). Type: official docs.
Notes: Each loads SKILL.md folders from `.agents/skills`; Cursor and Copilot also read `.claude/skills`.

## Claim E5: Claude Code runs skills and shell commands with timeouts and no controlling terminal for hooks
Status: supports | Confidence: medium
Source: Tools reference (Timeout section, default 2 min, max 10 min). URL: https://code.claude.com/docs/en/tools-reference ; hooks doc URL: https://code.claude.com/docs/en/hooks (hook processes "run in their own session without a controlling terminal").
Notes: The hooks-doc statement is about Claude Code's own hooks, not git hooks. That git hooks fire on `git commit` from Bash is an inference (unverified). No doc read says interactive commands hang; inferred from lack of TTY.

## Claim E6: Codex loads skills from `.agents/skills`; default sandbox has no network and read-only `.git`
Status: supports (limit) | Confidence: medium
Source: https://learn.chatgpt.com/docs/build-skills ; https://learn.chatgpt.com/docs/agent-approvals-security (redirected from developers.openai.com/codex/...). Type: official docs.
Notes: "Even inside writable roots, `.git`, `.agents`, `.codex`, and `.aws` are read-only." Non-interactive: `codex exec --sandbox workspace-write`, `-a never`. Whether `git add` is blocked in practice is untested (unverified).

## Claim E7: Cursor loads Agent Skills; skills page does not cover sandbox or TTY
Status: mixed | Confidence: low-medium
Source: https://cursor.com/docs/context/skills (official). Third-party: https://skills.cat/skills/swiftlysingh/toolbox/cursor-agent (claims CLI needs a real TTY) vs print-mode guides.
Notes: Contradiction left open. Treat the TTY claim as unverified.

## Claim E8: Copilot CLI supports agent skills; git permission is per-tool; may append a Co-authored-by trailer
Status: mixed | Confidence: low-medium
Source: https://docs.github.com/en/copilot/concepts/agents/about-agent-skills (official, skill surface and locations). Shell flags: third-party SKILL wrappers via search (https://skills.sh/giuseppe-trisciuoglio/developer-kit-claude-code/copilot-cli). Trailer: https://devactivity.com/insights/developer-control-over-ai-assisted-commits-the-push-to-disable-copilot-s-co-authored-by-trailer (secondary summary of a GitHub discussion).
Notes: Official docs do not state hook behavior on `git commit`. Trailer and `--allow-tool` details are unverified against official docs.

## Claim E9: commit-work plans a split, is lean, but uses interactive git and asks questions
Status: supports | Confidence: high
Source: ~/.claude/plugins/cache/agent-toolkit/commit-work/3027f20f3181/skills/commit-work/SKILL.md and references/commit-message-template.md (both read in full). Listed upstream as softaworks/agent-toolkit@commit-work, 4.2K installs: https://skills.sh/softaworks/agent-toolkit/commit-work
Notes: Quotes: "Prefer patch staging for mixed changes: `git add -p`"; "Prefer an editor for multi-line messages: `git commit -v`"; "Inputs to ask for (if missing)". Verification step 7 is after the commit message, not a gate.

## Claim E10: github `git-commit` is the safest published skill, with merge-state handling
Status: supports | Confidence: high
Source: https://raw.githubusercontent.com/github/awesome-copilot/main/skills/git-commit/SKILL.md (read in full). Listing: https://skills.sh/github/awesome-copilot/git-commit (48.7K).
Notes: "Do not use `git add -p` or `git add -i`. These commands wait for input from a person." Checks MERGE_HEAD, CHERRY_PICK_HEAD, unmerged files; uses `-m` or `-F`; no `--no-verify`, no amend, no push. No split plan, no check run before commit.

## Claim E11: getsentry `commit` is a message-style skill
Status: supports | Confidence: medium
Source: https://raw.githubusercontent.com/getsentry/skills/main/skills/commit/SKILL.md (first 80 lines read). Listing: https://skills.sh/getsentry/skills/commit (4.9K).
Notes: Separate `-m` args, "never ... open an interactive editor". Creates a feature branch if on main (a branch action the Intent does not include).

## Claim E12: caveman-commit only writes a message
Status: supports | Confidence: high
Source: https://raw.githubusercontent.com/juliusbrussee/caveman/main/skills/caveman-commit/SKILL.md. Listing: https://skills.sh/juliusbrussee/caveman/caveman-commit (437K).
Notes: "Does not run `git commit`, does not stage files."

## Claim E13: commit-all commits everything at once and can hand off to push/PR
Status: supports | Confidence: medium
Source: https://raw.githubusercontent.com/sentimony/skills/main/skills/commit-all/SKILL.md (first 60 lines read). Listing: https://skills.sh/sentimony/skills/commit-all (3.7K).

## Claim E14: om-check-and-commit runs a validation gate then commits and pushes
Status: supports | Confidence: medium
Source: https://raw.githubusercontent.com/open-mercato/skills/main/skills/om-check-and-commit/SKILL.md. Listing: https://skills.sh/open-mercato/skills/om-check-and-commit (3.5K).

## Claim E15: setup-pre-commit installs hooks, not a commit workflow
Status: supports | Confidence: low
Source: listing name and `npx skills find commit` output only (551K): https://skills.sh/mattpocock/skills/setup-pre-commit. Body not read; unverified beyond the name.

## Claim E16: repobuddy's skill already has the Intent's safety rules, lacks in-progress-operation handling
Status: supports | Confidence: high
Source: packages/buddy/skills/commit/SKILL.md (read in full, HEAD 9e38bad0). `grep` of it: no mention of MERGE_HEAD, cherry-pick, or sandbox.
Notes: The working tree has uncommitted edits to `packages/buddy/skills/commit/evals/`; the SKILL.md itself was clean.

## Contradictions
- E7: Cursor TTY requirement (third-party) vs headless `--print` guides.
- Installed skills lists: only `find-skills` and `wait-what` in `~/.claude/skills` and `~/.agents/skills`; `commit-work:commit-work` and `repobuddy:commit` are plugin skills (from the session's skill list). No other commit skill is installed.
