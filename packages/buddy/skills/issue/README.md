# issue

Files one item of tracked work (a bug, a feature, or a task) on the repository's issue tracker. It searches for an existing issue first and asks you before it creates anything, so it does not file a duplicate. It was called `file-issue` before 3.0.

## When to use

- "file a bug for this"
- "open a feature request"
- "add a task to track the migration"
- "report this problem upstream"
- "give me a prompt to file this from the agent that has that repo" (`--as-prompt`)

## What it does

1. **Decides what the issue is about.** When you name a dependency ("file this against X"), or the failure leads into its code, it lists the `project-tracker.intake.<key>` documents installed (a library's plugin ships one) and loads the one whose `Applies to` names the package. That document's tracker and destination replace the routing for this one filing, its `Before filing` steps run before the summary, its `Criteria` are checked before the create, and its `Template` sections join the body. With no matching document, it files nothing in this repository and points at the dependency's own tracker (the `bugs` field of its `package.json`, else its repository).
2. **Finds the tracker.** When the project has a `project-tracker.routing` (set up by [`project-tracker`](../project-tracker/README.md)), it files on the tracker routed for the category and never guesses: a missing or ambiguous pin, or no matching route, stops it with the problem named. Without a routing it lists the installed `project-tracker.capabilities.<tracker>` references and loads the one that matches the `origin` remote: the host's tracker is the default, so it needs no routing. GitHub and GitLab ship with this skill. GitLab's commands follow GitLab's documentation and have not yet run against a GitLab instance. Any other host, Bitbucket included, gets no filing and a pointer to `project-tracker` set-up, which routes its work. Jira is never picked from the host: it is used only when a routing names it.
3. **Gathers the details:** title, category (bug, feature, or task), and a description. It asks only for what you have not said.
4. **Collects environment and versions** for a bug, from your machine and the repo where it can.
5. **Searches for duplicates** in open and closed issues, at least twice. If you say a hit is your issue, it stops and gives you that URL.
6. **Confirms** the title, category, and details, and waits for your go-ahead.
7. **Creates the issue.** On GitHub the category is the issue type (`Bug`, `Feature`, `Task`); a repository without issue types gets the `bug` or `enhancement` label instead.
8. **Reports the URL.**

## Hand off with `--as-prompt`

With `--as-prompt`, it does all of the above up to the summary, then writes nothing to the tracker. It replies with one copyable prompt for another agent, for example one with the target repository checked out or logged in to its tracker. The prompt names the tracker and repository, gives the exact title and body, lists the duplicate searches already run and what they found, and tells the receiving agent to search again before filing, to file the body from a file, and to report back the issue URL. Since nothing is filed, it does not ask for your go-ahead, unless the item looks too big or too small. It still never turns a security vulnerability into a prompt. When this session cannot reach the tracker, it still writes the prompt and says the search was not run.

If the item looks too big or too small for one issue, it says so and suggests another level. It never changes the level itself.

## Safety

- It never creates an issue without a duplicate search and your confirmation. With `--as-prompt` it creates nothing.
- It uses only labels and issue types the repository has.
- It never files a security vulnerability publicly; it points to the private channel.
- It keeps internal file names, commit SHAs, and anything from a private tracker out of the body.

## Requirements

`gh` 2.98.0 or later for GitHub, logged in. [`init-buddy`](https://github.com/repobuddy/repobuddy/blob/main/packages/buddy/skills/init-buddy/README.md) sets it up.

## Upgrading from `file-issue`

Invoke `issue` (`/issue`) where you invoked `file-issue`. Bitbucket is no longer a target.

## How to invoke

Ask for it directly, or run `/issue` where slash commands are supported. Add `--as-prompt` for a prompt to hand to another agent.

## Install

```sh
npx skills add repobuddy/repobuddy --skill issue
```
