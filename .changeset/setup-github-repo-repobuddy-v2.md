---
"repobuddy": patch
---

`setup-github-repo`: the release example calls `repobuddy/.github/.github/workflows/pnpm-release-changeset-oidc.yml@v2`, the one shared home for every owner, instead of an `<org>/.github` placeholder. The skill says to pin the released tag `v2`, never `@main` or the retired `v1`, and to move callers off `cyberuni/.github` and `stable-packages/.github`. The approval-step link points at the `v2` tag.
