# project-tracker

Records which issue tracker holds each kind of work, so [`issue`](../issue/README.md) files where your team decided instead of guessing. A team may keep bugs in GitHub issues and epics in a private tracker; this skill writes that down once, as the project's `project-tracker.routing` reference. When all work goes to the tracker of the `origin` host (GitHub or GitLab), you need no routing: that tracker is the default.

## When to use

- "set up which tracker holds bugs and which holds epics"
- "send feature requests to a different tracker"
- "show me where issues get filed in this project"
- "check that my tracker routing still works"

## What it does

- **Set up** lists the installed `project-tracker.capabilities.<tracker>` references and drafts a routing from what it can read: the remote host, which trackers are linked to the repo and not only installed, what each tracker holds, and any line in `AGENTS.md` that says where work goes. It shows each route with its signal and asks one confirmation, and asks a question only where the signals conflict or say nothing. When the only signal is the host's tracker, it says that tracker is already used by default and writes nothing: a routing is written only for a different tracker or for work split across trackers. Each level (issue, epic, initiative) and category (bug, feature, task) is pinned as `<plugin>/project-tracker.capabilities.<tracker>`. It also asks, for each pair of trackers, whether moving an item closes the source as moved or keeps it open as a mirror. It writes `.agents/references/project-tracker.routing.md` after you confirm.
- **Show** describes each route and move in plain words. With no routing, it names the host's tracker in use, for example "GitHub, from the origin host".
- **Change** edits the routes you name and keeps the rest.
- **Check** reports a route whose tracker is missing, held by two plugins, on a contract version the skill does not know, a level and category that no route covers, or a route the signals no longer support (for example, an Asana route after the project link is removed). With no routing on a GitHub or GitLab host, it reports the host's tracker in use and no problem. It writes nothing.

repobuddy ships capabilities for GitHub, GitLab, and Jira Cloud. Jira is never picked from the host: set-up lists it, and work goes there only when you route it. Record its site and project key with an override of `project-tracker.capabilities.jira`, as its `Detect` section shows. Its commands follow Atlassian's documentation and have not yet run against a Jira site.

Without a routing, `issue`, `epic`, and `initiative` file on the tracker of the `origin` host. A host with no tracker they can use, such as Bitbucket, needs a routing: they stop and point here. With a routing, they file on the routed tracker.

## Safety

- It never writes the routing without your confirmation.
- A private tracker's details never go into a public one: it refuses a move policy from a private tracker to a public one.
- It does not file, move, or retype an item, and it writes no capabilities reference.

## Install

```sh
npx skills add repobuddy/repobuddy --skill project-tracker
```
