---
'repobuddy': minor
---

Remove the `setup-github-pages` skill. Its GitHub Pages setup is now the `deploy` command of the
`website` skill, which also covers GitLab, Codeberg, Bitbucket, and Azure. Run `/website deploy` where
you ran `/setup-github-pages`. The generated workflow now uses the current major versions of the Pages
actions and runs only for changes under the site directory.
