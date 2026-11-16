# fix-security-pr

Diagnoses why a pull request fails a security or vulnerability check and fixes it so CI passes. It reads the failing
log, finds the advisory and the safe version, applies a direct bump or an override, verifies the audit locally, and
pushes. It hands back a PR whose security check is green, or tells you when no safe version exists. It does not scan a
repository for new vulnerabilities.

## When to use

- "fix the security PR"
- "resolve the vulnerability failure"
- "unblock the Dependabot PR"
- "`pnpm audit` fails in CI"

## What it does

1. Finds the PR and reads the failing run's log for the audit, CVE, Snyk, or GHSA signal
2. Extracts the package, vulnerable range, safe version, severity, advisory ID, and whether the dependency is direct or
   transitive
3. Detects the package manager (pnpm, npm, yarn, bun) and whether the repository is a monorepo
4. Bumps a direct dependency, or adds an override or resolution at the root for a transitive one; rebases a stale
   Dependabot branch
5. Re-runs the audit at the level CI uses, commits, pushes, and watches the new run

When no fix is released, it tells you before it ignores an advisory.
