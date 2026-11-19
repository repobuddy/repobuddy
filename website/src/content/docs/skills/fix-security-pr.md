---
title: fix-security-pr
description: Fix a pull request that fails an audit, CVE, Dependabot, or Snyk check so CI passes.
---

`fix-security-pr` reads why a pull request fails a security check, finds the safe version, applies the fix, verifies
the audit locally, and pushes. It does not scan a repository for new vulnerabilities.

## When to use

- "fix the security PR" or "resolve the vulnerability failure"
- "unblock the Dependabot PR"
- "`pnpm audit` fails in CI"

## What it does

1. Finds the PR and reads the failing run's log for the audit, CVE, Snyk, or `GHSA-*` signal.
2. Extracts the package, vulnerable range, safe version, severity, advisory ID, and whether the dependency is direct or
   transitive.
3. Detects the package manager (pnpm, npm, yarn, bun) and whether the repository is a monorepo.
4. Bumps a direct dependency, or adds an override or resolution at the root for a transitive one. A stale Dependabot
   branch is rebased onto its base branch.
5. Re-runs the audit at the level CI uses, commits, pushes, and watches the new run.

## Edge cases

- When CI fails on a stricter audit level than the one checked, it matches CI's `--audit-level`.
- When no safe version exists, it tells you before it removes the package or adds an audit ignore.
- When the Dependabot PR already merged and CI still fails on `main`, it fixes `main` directly.
