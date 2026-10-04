# Pilot: buddy-agent-harness, the comment lever

The first `agent-readiness bench` pilot (#690, for #672). It asks whether cutting source comments
down to what a name cannot say ([buddy-agent-harness#139](https://github.com/repobuddy/buddy-agent-harness/issues/139),
landed as [#140](https://github.com/repobuddy/buddy-agent-harness/pull/140)) changes what an agent
spends, or how often it succeeds.

This folder mirrors the skill's own layout (`.agents/readiness/bench/` in the benched repo):

- `tasks.json` and `checks/`: the task set, as committed to buddy-agent-harness in
  [7655f22](https://github.com/repobuddy/buddy-agent-harness/commit/7655f222586d9edf3bb8f632da4893cf29f84838).
  Repobuddy does not run them; they target buddy-agent-harness's source.
- `results/`: the two results files `bench` wrote, unchanged. Their `transcript` paths point into the
  buddy-agent-harness checkout they ran in. The transcripts themselves are not committed: they hold
  machine-local paths, and the skill git-ignores `results/` for that reason.

Re-read the comparison for free with:

```sh
node packages/buddy/skills/agent-readiness/scripts/agent-readiness.mjs bench compare \
  .agents/readiness/pilots/buddy-agent-harness/results/before-6fbed36.json \
  .agents/readiness/pilots/buddy-agent-harness/results/after-ebb1a8f.json
```

## Protocol

- **Before:** [6fbed36](https://github.com/repobuddy/buddy-agent-harness/commit/6fbed365227364c50fc24e07d68e9b74c5c58b49),
  the parent of #140. **After:** [ebb1a8f](https://github.com/repobuddy/buddy-agent-harness/commit/ebb1a8ff89b65d9ace3a35652693947cd12d40c8),
  the merge of #140. #140 had already landed, so both were benched with `--ref` on the same task set
  (buddy-agent-harness main at 2eebd6f), and the two trees differ only by #140.
- `bench --runs 5` from repobuddy main (81745f1): Sonnet, the `claude -p` runner, `bypassPermissions`,
  a $0.50 cap per run. 4 tasks × 5 runs at each SHA, 40 runs, $2.79. Both benches ran at the same
  time from separate checkouts, so drift in the API hits both alike. No run was capped or errored.
- **Tasks**, aimed at the files #140 cut hardest:
  - `fix-credential-segments`, `fix-divergence-direction`: a seeded bug in `mcp-secrets.ts` and in
    `git-bridge-state.ts`; pass is a green `pnpm verify` with the tests untouched.
  - `pat-credential-segment`: a small feature, treat `pat` as a credential segment; pass is green
    `verify` plus `checks/pat-credential-segment.mts`.
  - `skills-projection-answer`: a question about the harness registry, answered into `ANSWER.md`. At
    "before", one comment there was stale (it said Claude Code is the only harness with a skills
    projection).
- **`score`** at each SHA: comment share 29% → 17% (1604 → 768 of 5457 → 4625 non-test source
  lines), the noise area 67% → 100% (the orphaned JSDoc in `doctor-guidance.ts` went), level 2 at both.

## Results (before → after)

Pass rate **20/20 → 20/20**. Cost per success **$0.072 → $0.068**.

Change in the mean, after over before, with the exact permutation p (5 runs vs 5). `*` marks p < 0.05.

| task | output tokens | cache read | turns | tool calls | wall time | cost |
|---|---|---|---|---|---|---|
| fix-credential-segments | −15% (0.13) | −5% (0.62) | −8% (0.63) | −10% (0.63) | −15% (0.04 *) | −4% (0.33) |
| fix-divergence-direction | −2% (0.63) | −1% (0.06) | 0% (1.00) | 0% (1.00) | −1% (0.86) | −6% (0.10) |
| pat-credential-segment | −8% (0.22) | +1% (1.00) | −2% (1.00) | −3% (1.00) | −14% (0.21) | −5% (0.48) |
| skills-projection-answer | −4% (0.25) | −2% (0.008 *) | 0% (1.00) | 0% (1.00) | −9% (0.54) | −9% (0.008 *) |
| **pooled** (geometric mean of the task ratios) | −8% (0.02 *) | −2% (0.65) | −3% (0.49) | −3% (0.50) | −10% (0.03 *) | **−6% (0.008 *)** |

Uncached input tokens are flat (8–20 per run), so the table leaves them out; the comparison holds 35 tests.

## An earlier run of the same pair

The same two SHAs were benched once before, on 2026-10-02 with repobuddy 1.12.0, the same tasks
cherry-picked onto each SHA, and the same settings ([reported on #690](https://github.com/repobuddy/repobuddy/issues/690#issuecomment-5950580848)).
Its results files were not kept. It found:

- pass rate 20/20 → 20/20, cost per success $0.069 → $0.071, pooled cost +1% (p 0.68);
- `skills-projection-answer` cost −9% (p 0.01), as here;
- `pat-credential-segment` +28% tokens and +27% turns (p 0.03), which this run does not reproduce
  (−5% cost, turns flat, p ≥ 0.48).

## Conclusion

- **Pass rate: no effect measurable.** Every run of both benches passed at both SHAs. These tasks are
  too easy to move it; they measure cost only.
- **Tokens and cost: a small saving at most, about 0–6% per successful task.** The one effect both
  runs agree on is the question task, about 9% cheaper, where the agent reads `harness-registry.ts`
  and its cut comments. The feature task's rise in the first run did not come back, so it was most
  likely noise. The pooled −6% here is significant, but the first run's pooled +1% was not, and the
  gap between the two runs is as large as the effect: day-to-day variance sits at the same scale.
- **For the weights (#705):** comment density is a weak cost lever on this repo, worth a few percent
  where an agent reads the commented file and nothing it can see elsewhere. That supports keeping
  `noise` at or below its starting weight of 15, not raising it. A stronger test needs harder tasks
  where pass rate can move, and 10+ runs a side.
