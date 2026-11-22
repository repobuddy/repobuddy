---
'repobuddy': minor
---

Ship `project-tracker.capabilities.jira`, Jira Cloud's capabilities reference, so `project-tracker` set-up lists Jira and can route levels and categories to it, and `issue`, `epic`, and `initiative` file, search, and link there through `curl` and an API token. Issues are standard issue types, epics the `Epic` type, and initiatives a level-2 type when the project's hierarchy has one; the site and project key come from a project override. Jira is never picked from the host: a Bitbucket repository, or any other, gets Jira only after the user routes to it. Board, Transfer, Depend, and Sync body are unsupported. Its calls follow Atlassian's documentation and have not yet run against a Jira site; each is marked untested.
