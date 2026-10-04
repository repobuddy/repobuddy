---
"repobuddy": minor
---

`init-buddy`'s `gh-api-guard` hook now also guards `glab api`. It reads `glab`'s own flags (`--form` counts as a field that switches the request to POST, and any `@file` field is asked about) and allows only GET requests and GraphQL queries with no mutation, asking for everything else. The skill registers it for GitLab with a second `if: "Bash(glab api *)"` hook entry.
