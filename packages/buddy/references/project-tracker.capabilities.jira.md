---
description: What the Jira Cloud tracker can do for issue, epic, and initiative skills; operations, levels, categories, scope, and visibility.
tags: [project-tracker, jira, issue]
implements: project-tracker.capabilities@1
contract: 1
extends: [default]
---

## Tracker

- Name: `jira`
- Visibility: private, unless the project lets anyone on the web browse it. Read it with an anonymous request, sent without the token: `curl -s -o /dev/null -w '%{http_code}' "https://<site>/rest/api/2/project/<KEY>"`. `200` is public; any other code is private.
- Levels held: issue (a standard issue type, hierarchy level 0); epic (the `Epic` type, level 1); initiative only when the project has an issue type at level 2, which needs a custom hierarchy (Jira Premium or Enterprise). Read them in Kinds.
- Categories held: bug, feature, task, as issue types at the issue level. An epic or an initiative has one type each, so on Jira it carries no category.
- Jira Cloud only; Jira Data Center and Server are not covered. Needs `curl` and `jq` (`curl --version`, `jq --version`), and an Atlassian API token for the user: the environment variables `JIRA_EMAIL` (the account's email) and `JIRA_API_TOKEN` (made at `https://id.atlassian.com/manage-profile/security/api-tokens`). Never write the token to a file in the repository or print it.
- Untested: no command in this reference has run against a Jira site. They follow Atlassian's REST API documentation. Each one marked *(untested)* must be checked on a Jira Cloud site before it is relied on; until then, show the user the command and its output, and stop on any error instead of improvising.

Placeholders used below: `<site>` is the Jira site's host, such as `acme.atlassian.net`; `<KEY>` is the project key, such as `ACME`; `<key>` is an item's key, such as `ACME-123`. Every call goes through this shell function, defined in the same command that uses it. It passes the credentials to `curl` on standard input, so the token never appears in the process list:

```bash
jira() { printf 'user = "%s:%s"\n' "$JIRA_EMAIL" "$JIRA_API_TOKEN" \
  | curl -sS --fail-with-body -K - -H 'Accept: application/json' -H 'Content-Type: application/json' "$@"; }
```

## Detect

- No host selects Jira. A repository's `origin`, on Bitbucket, GitHub, GitLab, or anywhere else, never makes this tracker apply: a skill uses Jira only through a `project-tracker.routing` pin the user chose in `project-tracker` set-up. Where a skill with no routing looks for the tracker whose `Detect` matches the host or the repository, this reference matches neither.
- The scope is a site and a project key, recorded by the team. Read the `Site:` and `Project:` bullets at the end of this section; a project adds them with an override, `.agents/references/project-tracker.capabilities.jira.md`:

  ```md
  ---
  extends: [repobuddy]
  merge: combine
  ---

  ## Detect

  - Site: acme.atlassian.net
  - Project: ACME
  ```

  When either bullet is missing, the scope is not resolved: ask the user for the site and the project key, use them for this run, and suggest recording them with `reference customize project-tracker.capabilities.jira --extends repobuddy`. Never guess a site from the repository's host or workspace.
- Logged in: `JIRA_EMAIL` and `JIRA_API_TOKEN` are set, and `jira "https://<site>/rest/api/3/myself" | jq -r .accountId` prints an id. When a variable is unset or the call fails with `401`, tell the user to create an API token and export both variables, and stop. *(untested)*
- The project exists and the user can see it: `jira "https://<site>/rest/api/3/project/<KEY>" | jq -r .key` prints `<KEY>`. *(untested)*

## Kinds

Read the project's issue types and their hierarchy levels *(untested)*:

```bash
jira "https://<site>/rest/api/3/project/<KEY>" \
  | jq -r '.issueTypes[] | "\(.hierarchyLevel)\t\(.id)\t\(.name)\t\(.subtask)"'
```

- Level issue is a type at hierarchy level `0`. The type carries the category: bug is `Bug`; feature is the first of `Story`, `Feature`, `New Feature`; task is `Task`. When a team renamed or removed a type, use the closest name at level `0`; when none fits, ask which type to use.
- Level epic is the type at level `1`, named `Epic` by default.
- Level initiative is a type at level `2`, often named `Initiative`. With no type at level `2`, the project holds no initiative.
- A type at level `-1` is a subtask: a child of an issue, never of an epic. Do not file a work item as a subtask unless the user asks.
- Use only the types the call lists, by `id`. Do not create issue types; that needs a Jira administrator.

## Search

Run at least two passes over the project's items, open and closed *(untested)*:

```bash
jira -G "https://<site>/rest/api/3/search/jql" \
  --data-urlencode 'jql=project = "<KEY>" AND text ~ "<keywords>" ORDER BY created DESC' \
  --data-urlencode 'fields=summary,status,issuetype' --data-urlencode 'maxResults=10' \
  | jq -r '.issues[] | {key, title: .fields.summary, state: .fields.status.statusCategory.key, type: .fields.issuetype.name, level: .fields.issuetype.hierarchyLevel}'
```

- Use the full title for the first pass and the core noun and verb for the second. Escape a `"` in the keywords as `\"`, and drop JQL's reserved characters (`+ - & | ! ( ) { } [ ] ^ ~ * ? \ /`) from them.
- `text ~` matches the summary, the description, and comments. The older `/rest/api/3/search` endpoint is retired; use `/search/jql`.
- Each hit is a key, title, state, and URL (see Url). State is read from the status category: `new` and `indeterminate` read as open, `done` as closed. Level is `0` for an issue, `1` for an epic, `2` for an initiative.

## Create

Write the body to a temporary file; never inline user text in the shell beyond the title. Jira renders wiki markup, not Markdown: convert the body before the create (`## Heading` to `h2. Heading`, `**bold**` to `*bold*`, `[text](url)` to `[text|url]`, a code fence to `{code}` … `{code}`, `- [ ] item` to `* item`). The REST API version 2 takes the description as that text; version 3 would need Atlassian Document Format.

```bash
jq -n --arg project "<KEY>" --arg type "<issue type id>" --arg title "<title>" \
  --rawfile body <file> --arg parent "<parent key, or empty>" '{
  fields: ({project: {key: $project}, issuetype: {id: $type}, summary: $title, description: $body}
    + (if $parent == "" then {} else {parent: {key: $parent}} end))}' > <request.json>
jira -X POST --data @<request.json> "https://<site>/rest/api/2/issue" | jq -r '{id, key}'
```

- The type is the one Kinds read for the level and category: a level `0` type for an issue, the level `1` type for an epic, the level `2` type for an initiative.
- `parent` attaches the new item under an existing one: an issue under an epic, an epic under an initiative. The parent must be one level up and, without a cross-project plan, in the same project. *(untested)*
- A required field the project adds (a component, a team) fails the create with `400` and names the field in `errors`; ask the user for its value and add it to `fields`.
- The call prints the new item's `id` and `key`; its URL is built as Url says.
- When a create exits non-zero, list the newest items before any retry: the Search call with the JQL `project = "<KEY>" AND reporter = currentUser() ORDER BY created DESC` and `maxResults=3`. A timeout after the item was written can leave it behind.

## Link

- Child of: set the parent on the child *(untested)*:

  ```bash
  jira -X PUT --data '{"fields":{"parent":{"key":"<parent key>"}}}' "https://<site>/rest/api/2/issue/<child key>"
  ```

  An issue's parent is an epic; an epic's parent is an initiative. An item has one parent, and setting a new one moves it. An existing issue in another project attaches only when the site allows cross-project parents.
- Detach: the same call with `{"fields":{"parent":null}}`. *(untested)*
- Related, blocking, blocked by: list the site's link types first, since a team can rename them *(untested)*:

  ```bash
  jira "https://<site>/rest/api/2/issueLinkType" | jq -r '.issueLinkTypes[] | "\(.name)\t\(.outward)\t\(.inward)"'
  jira -X POST --data '{"type":{"name":"<Relates or Blocks>"},"inwardIssue":{"key":"<key>"},"outwardIssue":{"key":"<other key>"}}' \
    "https://<site>/rest/api/2/issueLink"
  ```

  Which item gets the outward phrase (`blocks`) and which the inward (`is blocked by`) is easy to get backwards: read the link back after the write (below) and check its direction. When it is reversed, delete it with `jira -X DELETE "https://<site>/rest/api/2/issueLink/<link id>"` and post it with the keys swapped.
- Read an item's parent and links, and its children *(untested)*:

  ```bash
  jira "https://<site>/rest/api/2/issue/<key>?fields=parent,issuelinks" \
    | jq '{parent: .fields.parent.key, links: [.fields.issuelinks[] | {id, type: .type.name, inward: .inwardIssue.key, outward: .outwardIssue.key}]}'
  jira -G "https://<site>/rest/api/3/search/jql" --data-urlencode 'jql=parent = "<key>"' \
    --data-urlencode 'fields=summary,status,issuetype' | jq -r '.issues[] | {key, title: .fields.summary, state: .fields.status.statusCategory.key}'
  ```

## Retype

The REST API does not change an item's level: an issue type at another hierarchy level is a Move in the Jira UI, which the API does not offer. Every change is a new item, created with Create at the new level with the old item's title and body, then linked; the old item closes as moved after the user confirms. A level the routing puts on another tracker is a move, not a retype.

Rewrite a body from a file, converted as Create says *(untested)*: `jq -n --rawfile body <file> '{fields: {description: $body}}' > <request.json>`, then `jira -X PUT --data @<request.json> "https://<site>/rest/api/2/issue/<key>"`.

| Change | Steps | Open children |
|---|---|---|
| issue → epic | new item: Create an epic with the issue's title and body; relate the issue to it (`Relates`); close the issue as moved to the epic. Rewrite the epic's body when the skill moves the acceptance criteria into a child. *(untested)* | subtasks cannot sit under an epic: list them, and with the user's agreement recreate each as an issue under the new epic, then close the subtask as moved |
| epic → initiative | new item, needs a type at level `2`: run Create for an initiative, then set the epic's parent to it (Link); the epic keeps its type, body, and key *(untested)* | stay under the epic; the epic becomes the initiative's first epic |
| epic → initiative, no level `2` type | **Unsupported**: the project's hierarchy has no level above epics | — |
| epic → issue | new item: Create an issue at level `0` with the epic's title and body, relate it to each open child, then close the epic as moved *(untested)* | child issues are detached (`parent` null) and related to the new issue; never closed |
| initiative → epic | new item: Create an epic with the initiative's title and its body without the `Metric` section; close the initiative as moved *(untested)* | an epic cannot hold epics: child epics are detached and related to the new epic; never closed |

Limits: an item has one parent; a parent is exactly one level up. Before any change, list the item's children (Link, read) so the user sees every item it touches.

## Close

Jira closes an item through a workflow transition. Read the item's transitions, and pick one whose target status is in the `done` category *(untested)*:

```bash
jira "https://<site>/rest/api/2/issue/<key>/transitions?expand=transitions.fields" \
  | jq -r '.transitions[] | select(.to.statusCategory.key == "done") | "\(.id)\t\(.name)\t\(.to.name)\t\(.fields | has("resolution"))"'
```

Say the reason in a comment, then transition:

```bash
jq -n --rawfile body <comment file> '{body: $body}' > <comment.json>
jira -X POST --data @<comment.json> "https://<site>/rest/api/2/issue/<key>/comment"
jira -X POST --data '{"transition":{"id":"<id>"},"fields":{"resolution":{"name":"<resolution>"}}}' \
  "https://<site>/rest/api/2/issue/<key>/transitions"
```

- Send `fields.resolution` only when the transition's last column is `true`; otherwise send `{"transition":{"id":"<id>"}}` alone. Read the site's resolutions with `jira "https://<site>/rest/api/2/resolution" | jq -r '.[].name'`.
- Done is the resolution `Done`, without a comment, or with one the user asks for. Not planned is `Won't Do` (or the closest the site has), with a comment `Not planned` and why. Moved is `Duplicate` when the destination is on this site, otherwise `Won't Do`, with a comment naming the destination, unless the destination is a private tracker and this project is public (then say only that it is tracked internally).
- Several `done` transitions, or none: show the list and ask which one. A project may route closing through review states; never walk several transitions without the user's yes.

## Url

- An item's URL is `https://<site>/browse/<key>`. Create returns the key; the item's `self` is an API URL, not the one to show.
- `https://<site>/browse/<key>` parses to site and key, and so does a board URL carrying `selectedIssue=<key>`. The project key is the part of `<key>` before the last `-`.
- The item ref's `id` is the key, such as `ACME-123`.

## Ownership

Read whether the logged-in user may administer the project *(untested)*:

```bash
jira "https://<site>/rest/api/3/mypermissions?projectKey=<KEY>&permissions=ADMINISTER_PROJECTS" \
  | jq -r .permissions.ADMINISTER_PROJECTS.havePermission
```

- `true` is `owned`: the user is a project administrator, or a Jira administrator.
- `false` is `not owned`.
- Any other output or an error means unknown.

## Board

**Unsupported.** A Jira board shows a project's items through its filter, so there is nothing to add, and its columns are workflow statuses, set by a transition rather than a single-select field.
Workaround: move the item to a status with a transition, as Close reads them, or set the column by hand on the board.

## Transfer

**Unsupported.** This reference has no tested move command for Jira yet.
Workaround: move the item in the Jira UI (Move), then rewrite the parent's body or links with its new key.

## Depend

**Unsupported.** This reference has no tested batch blocked-by command for Jira yet.
Workaround: add each blocking link by hand, as `Link` says.

## Sync body

**Unsupported.** `epic-plan.mjs sync-body` reads GitHub sub-issues only, and Jira shows an epic's children natively.
Workaround: rewrite the `Child Issues` list by hand from `Link`'s children read.
