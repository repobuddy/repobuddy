---
name: create-issue
description: "Create a bug report or feature request on GitHub, GitLab, or similar platforms. Searches for existing similar issues first to avoid duplicates. Use this skill when asked to 'create an issue', 'file a bug', 'open a feature request', or 'report a problem'."
---

# Create Issue

Creates a well-formed bug report or feature request on the appropriate issue tracker, after checking for existing similar issues to avoid duplicates.

## Supported Platforms

Detect the platform from the git remote URL:

| Remote pattern | Platform | CLI tool |
|---|---|---|
| `github.com` | GitHub | `gh` |
| `gitlab.com` or self-hosted GitLab | GitLab | `glab` |
| `bitbucket.org` | Bitbucket | `gh` with Bitbucket extension or browser |

```bash
git remote get-url origin
```

## Steps

### 1. Gather issue details

If the user has not already provided them, ask for:
- **Title** — short, specific summary of the bug or request
- **Type** — bug or feature request
- **Description** — what is happening / what is wanted, steps to reproduce (for bugs), expected vs actual behavior

Do not ask for information the user has already provided.

### 2. Gather environment and version details

For bug reports, collect the system and package information that will help maintainers reproduce and triage the issue.

Include relevant details such as:
- **Host environment** — OS/distribution, kernel, architecture, container/WSL/CI context when relevant
- **Runtime and tooling** — Node/Python/runtime version, package manager, compiler/transpiler version, browser version, framework CLI version
- **Package or app versions** — the affected package version, and any closely related dependency versions that materially affect the bug
- **Version split notes** — if the package under test uses one toolchain version but the failing downstream consumer uses another, capture both explicitly

Prefer discovering exact versions from the local environment or repo when possible instead of asking the user. If the issue is a feature request, include environment details only when they materially affect the request.

### 3. Search for similar existing issues

Before creating, search for duplicates. Use the title keywords and key terms from the description.

**GitHub:**
```bash
gh issue list --repo <owner>/<repo> --state all --search "<keywords>" --limit 10
```

**GitLab:**
```bash
glab issue list --all --search "<keywords>"
```

Search at least twice with different keyword combinations (e.g. full title, then core noun/verb only) to maximize recall.

Present any matches to the user:
- List each result: issue number, title, state (open/closed), URL
- Ask if any of them is the same issue they want to report

If a match is found and the user confirms it is the same issue, stop — do not create a duplicate. Instead, provide the URL of the existing issue and suggest the user add a comment or reaction if they want to signal the issue affects them too.

### 4. Confirm creation

If no duplicates found (or user confirms none match), summarize what will be created:
- Title
- Type (bug / feature request)
- Key points from the description
- Environment and version details that will be included, when relevant

Ask for confirmation before proceeding.

### 5. Create the issue

**GitHub:**
```bash
gh issue create \
  --repo <owner>/<repo> \
  --title "<title>" \
  --label "<bug|enhancement>" \
  --body "$(cat <<'EOF'
## Description

<description>

## Steps to Reproduce (bugs only)

1. ...

## Expected Behavior

<expected>

## Actual Behavior

<actual>

## Environment

- OS: ...
- Architecture: ...
- Runtime: ...
- Package manager: ...
- Affected package: ...
- Related toolchain/compiler: ...

## Notes

<version split, container/WSL/CI context, or other triage-relevant details>
EOF
)"
```

**GitLab:**
```bash
glab issue create \
  --title "<title>" \
  --label "<bug|feature>" \
  --description "<body>"
```

For feature requests use label `enhancement` (GitHub) or `feature` (GitLab). For bugs use label `bug`.

If labels don't exist in the repo, omit the `--label` flag rather than erroring.

### 6. Confirm and report

After creation, output the issue URL so the user can navigate to it directly.

## What NOT to Do

- Do not create an issue without checking for duplicates first
- Do not skip the confirmation step
- Do not invent labels — only use labels that exist or the platform defaults (`bug`, `enhancement`)
- Do not include internal file names, commit SHAs, or implementation details in the issue body unless the user specifically asks

## Verification

- [ ] Gathered environment and package/runtime/toolchain version details when relevant
- [ ] Searched for duplicates with at least two keyword combinations
- [ ] User confirmed no duplicate exists
- [ ] User confirmed the issue details before creation
- [ ] Issue URL returned to user after creation
