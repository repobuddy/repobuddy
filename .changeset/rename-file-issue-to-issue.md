---
"repobuddy": major
---

**Breaking:** the `file-issue` skill is now `issue`. Invoke `/issue` (or `npx skills add repobuddy/repobuddy --skill issue`) where you used `file-issue`; `npx skills remove file-issue` drops the old one.

- It files a bug, a feature, or a task. On GitHub the category is the issue type (`Bug`, `Feature`, `Task`); a repository without issue types gets the `bug` or `enhancement` label.
- GitHub's commands now live in a shipped `project-tracker.capabilities.github` reference. Filing on GitHub needs `gh` 2.98.0 or later.
- Bitbucket is no longer a target; its native issue tracker is gone.
- It suggests a different level when an item looks too big or too small, and never files a security vulnerability publicly.
