---
description: What the GitLab tracker can do for issue, epic, and initiative skills; operations, levels, categories, tiers, and visibility.
tags: [project-tracker, gitlab, issue]
contract: 1
---

## Tracker

- Name: `gitlab`
- Visibility: public for a `public` project; private for an `internal` or `private` one (an internal project is open to every signed-in user of the instance, so it is not public). Read it with `glab api "projects/<project-enc>" --jq .visibility`.
- Levels held: issue on every tier; epic on every tier (a group epic on Premium and Ultimate, an issue labelled `epic` on Free); initiative on Ultimate only.
- Categories held: bug, feature, task, as labels.
- Needs `glab`, logged in to the host. Check with `glab --version` and `glab auth status --hostname <host>`. Every call goes through `glab api` (REST and GraphQL); glab's `work-items` command is experimental, so it is not used. Epics as work items need GitLab 18.1 or later.
- Untested: no command in this reference has run against a GitLab instance. They follow GitLab's documentation. Each one marked *(untested)* must be checked on a Free and a Premium instance before it is relied on; until then, show the user the command and its output, and stop on any error instead of improvising.

Placeholders used below: `<host>` is the remote's host; `<project>` is the project's full path (`group/sub/project`) and `<project-enc>` the same with each `/` written `%2F`; `<group>` is the project's parent group full path and `<group-enc>` its encoded form; `<iid>` is the number shown in the URL. Pass `--hostname <host>` on every `glab api` call outside the repository's own directory.

## Detect

- The `origin` remote host is `gitlab.com`, or `glab auth status --hostname <host>` succeeds for a self-managed host: `git remote get-url origin`. *(untested)*
- `glab auth status --hostname <host>` succeeds. When `glab` is missing or logged out, run the `init-buddy` skill if it is installed; otherwise tell the user to install `glab` and run `glab auth login --hostname <host>`.
- The project is `<project>` from the remote. The group is `glab api "projects/<project-enc>" --jq .namespace.full_path`; when `.namespace.kind` is `user`, the project has no group, so it has no group epics and counts as Free for the epic level. *(untested)*
- The tier: `glab api "namespaces/<group-enc>" --jq .plan` gives `free`, `premium`, or `ultimate` (a trial may print another name, and the field may be missing on some instances). When it is missing or not one of those three, read the work item types (Kinds) instead: an `Epic` type that is listed and `enabled` means Premium or better. Child epics need Ultimate, and only `plan` tells Premium from Ultimate; when it cannot be read, treat the tier as Premium. *(untested)*

## Kinds

Read the labels the project can use, its own and its groups':

```bash
glab api "projects/<project-enc>/labels?include_ancestor_groups=true&per_page=100" --jq '.[].name'
```

- The label carries the category. Bug is the first of `bug`, `type::bug` that exists; feature is the first of `feature`, `enhancement`, `type::feature`; task is the first of `task`, `type::task`, `type::maintenance`. When none exists, create the item without a category label and say so. *(untested)*
- Level, Free: an `epic` or `initiative` label on an issue. An issue with neither is an issue.
- Level, Premium and Ultimate: an epic is a work item of type `Epic` in the group; one with the `initiative` label is an initiative (Ultimate only). Issues stay in the project.
- Use only labels that exist. Do not create labels, except a missing level label after the user says yes to it (see **Retype**, Limits). The REST create call creates a missing label silently, so check the list first.
- A GraphQL write needs global IDs, read them before it *(untested)*:

```bash
glab api graphql -f query='{namespace(fullPath:"<group or project>"){workItemTypes{nodes{id name enabled}}}}' \
  --jq '.data.namespace.workItemTypes.nodes[] | select(.enabled != false) | "\(.name) \(.id)"'
glab api graphql -f query='{group(fullPath:"<group>"){labels(searchTerm:"<label>",includeAncestorGroups:true){nodes{id title}}}}' \
  --jq '.data.group.labels.nodes[] | "\(.title) \(.id)"'
```

An epic takes only group labels; a project label cannot go on it.

## Search

Run at least two passes over issues, open and closed:

```bash
glab api "projects/<project-enc>/issues?state=all&in=title,description&per_page=10&search=<url-encoded keywords>" \
  --jq '.[] | {iid, title, state, web_url}'
```

On Premium and Ultimate, also search the group's epics *(untested)*:

```bash
glab api graphql -f query='{namespace(fullPath:"<group>"){workItems(search:"<keywords>",types:[EPIC],state:all,first:10){nodes{iid title state webUrl}}}}' \
  --jq '.data.namespace.workItems.nodes[]'
```

Use the full title for the first pass and the core noun and verb for the second. Each hit is an iid, title, state (`opened` reads as open, `closed` as closed), and URL. *(untested)*

## Create

Write the body to a temporary file; never inline user text in the shell beyond the title.

An issue, or an epic on Free *(untested)*:

```bash
glab api --method POST "projects/<project-enc>/issues" \
  -f title="<title>" -F description=@<file> -f labels="<category label>[,epic|,initiative]" \
  --jq '{iid, web_url}'
```

- For an epic on Free, add the `epic` label. Free has no initiative.
- With a parent: on Premium and Ultimate, create the issue, then attach it under the epic (Link). On Free an issue cannot be a child of an issue: a child of a Free epic is a task, created with the work item call below in the project, type `Task`, parent the epic's issue. A task must be in the same project as its parent.

An epic on Premium and Ultimate, or a child task on Free, through GraphQL with the body read from the file *(untested)*:

```bash
jq -n --arg path "<group for an epic, project for a task>" --arg title "<title>" \
  --arg type "<Epic or Task type id>" --rawfile body <file> \
  --argjson labels '["<label id>"...]' --arg parent "<parent work item id, or empty>" '{
  query: "mutation($input: WorkItemCreateInput!){workItemCreate(input:$input){workItem{id iid webUrl} errors}}",
  variables: {input: ({namespacePath: $path, title: $title, workItemTypeId: $type,
    descriptionWidget: {description: $body}, labelsWidget: {labelIds: $labels}}
    + (if $parent == "" then {} else {hierarchyWidget: {parentId: $parent}} end))}}' > <request.json>
glab api graphql --input <request.json> --jq '.data.workItemCreate'
```

- For an initiative (Ultimate), the type is `Epic` and the labels include `initiative`'s group label id.
- A parent epic on Premium takes issues only; a child epic needs Ultimate.
- The call prints the new item's `iid` and `webUrl`; a non-empty `errors` is a failure.
- When a create exits non-zero or returns `errors`, list the newest items before any retry: `glab api "projects/<project-enc>/issues?state=all&order_by=created_at&per_page=3" --jq '.[] | {iid, title, web_url}'`, or the group's newest epics with the Search query and `sort:CREATED_DESC`. A GraphQL error after the item was written can leave it behind.

## Link

Writes use the work item's global ID. Read it from an iid *(untested)*:

```bash
glab api graphql -f query='{namespace(fullPath:"<project or group>"){workItem(iid:"<iid>"){id}}}' --jq .data.namespace.workItem.id
```

- Child of (Premium and Ultimate: an issue under an epic; Ultimate: an epic under an epic; every tier: a task under an issue). Set the parent on the child *(untested)*:

  ```bash
  glab api graphql -f query='mutation{workItemUpdate(input:{id:"<child id>",hierarchyWidget:{parentId:"<parent id>"}}){errors}}'
  ```

  An item has one parent; setting a new one moves it, and moving an issue between epics needs Ultimate. An existing issue in a project outside the epic's group attaches by its URL: read its id with `workItemsByReference(contextNamespacePath:"<group>",refs:["<url>"]){nodes{id}}`. Limits: 5000 direct children per epic, epics nested 7 levels, a task in the same project as its issue, and a new child issue only in a project inside the epic's group; read the tree before attaching. *(untested)*
- On Free, an existing issue cannot become a child of an issue. Relate it to the epic instead, and add `- [ ] <project>#<iid>` to the epic's description.
- Detach: the same mutation with `parentId:null`. *(untested)*
- Related, blocking, blocked by *(untested; blocking links may need Premium)*:

  ```bash
  glab api graphql -f query='mutation{workItemAddLinkedItems(input:{id:"<id>",workItemsIds:["<other id>"],linkType:RELATED}){errors}}'
  ```

  `linkType` is `RELATED`, `BLOCKS`, or `BLOCKED_BY`; at most 10 items per call.
- Read the tree *(untested)*:

  ```bash
  glab api graphql -f query='{namespace(fullPath:"<path>"){workItem(iid:"<iid>"){widgets{... on WorkItemWidgetHierarchy{parent{iid webUrl} children{nodes{iid title state webUrl workItemType{name}}}}}}}}'
  ```

## Retype

Free changes level in place with a label. Premium and Ultimate change between an issue and an epic by making a new item, because an epic lives in the group and an issue in the project. A level the routing puts on another tracker is a move, not a retype.

Rewrite a body from a file: an issue with `glab api --method PUT "projects/<project-enc>/issues/<iid>" -F description=@<file>`; an epic with `workItemUpdate` `descriptionWidget:{description:…}`, sent with `--input` as in Create. *(untested)*

| Change | Tier | Steps | Open children |
|---|---|---|---|
| issue → epic | Free | in place: add the `epic` label (`PUT projects/<project-enc>/issues/<iid>` with `add_labels=epic`); rewrite the body when the skill moves its acceptance criteria into a child; then link the children | tasks stay as its children |
| issue → epic | Premium, Ultimate | new item: post the note `/promote_to Epic` on the issue (`POST projects/<project-enc>/issues/<iid>/notes` with `body=/promote_to Epic`). GitLab creates an epic in the parent group and copies title, description, comments, and group labels. Read the issue afterwards; if it is still open, close it as moved to the epic. Rewrite the new epic's body when the skill moves the criteria into a child. *(untested)* | tasks cannot sit under an epic: list them, and with the user's agreement recreate each as an issue under the new epic, then close the task as moved |
| epic → initiative | Ultimate | in place: add the `initiative` label with `workItemUpdate` `labelsWidget:{addLabelIds:[…]}` *(untested)* | child epics and issues are kept |
| epic → initiative | Premium, Free | **Unsupported**: an initiative holds epics, and only Ultimate nests epics | — |
| epic → issue | Free | in place: remove the `epic` label (`remove_labels=epic`) | tasks kept |
| epic → issue | Premium, Ultimate | new item: GitLab has no epic-to-issue conversion. Create an issue in the project the user names with the epic's title and description, relate it to each open child, then close the epic as moved *(untested)* | child issues are detached (`parentId:null`) and related to the new issue; never closed |
| initiative → epic | Ultimate | in place: remove the `initiative` label (`removeLabelIds`); rewrite the body to drop the `Metric` section *(untested)* | kept, on Ultimate an epic may hold epics, unless the user asks to detach one (`parentId:null`); a child is never closed |

Limits: 5000 children per epic, epics nested 7 levels (Ultimate). The level label must exist: `glab api "projects/<project-enc>/labels?include_ancestor_groups=true&search=<label>" --jq '.[].name'` for an issue's, `groups/<group-enc>/labels?search=<label>` for an epic's. When it does not, ask before creating it: `glab api --method POST "projects/<project-enc>/labels" -f name=<label> -f color=#6699cc` (on Free), or `groups/<group-enc>/labels` for an epic's. *(untested)* Before a promote, list the issue's tasks and the epic's children so the user sees every item the change touches.

## Close

GitLab has no close reason. Say the reason in a comment, then close.

```bash
glab api --method POST "projects/<project-enc>/issues/<iid>/notes" -F body=@<comment file>
glab api --method PUT "projects/<project-enc>/issues/<iid>" -f state_event=close
```

An epic on Premium and Ultimate *(untested)*:

```bash
glab api graphql -f query='mutation{createNote(input:{noteableId:"<epic id>",body:"<reason>"}){errors}}'
glab api graphql -f query='mutation{workItemUpdate(input:{id:"<epic id>",stateEvent:CLOSE}){errors}}'
```

Done closes without a comment, or with one the user asks for. Not planned comments `Not planned` and why. Moved comments with the destination, unless the destination is a private tracker and this project is public (then say only that it is tracked internally).

## Url

- REST create and read return `web_url`; GraphQL returns `webUrl`. Use them rather than building a URL.
- `https://<host>/<project>/-/issues/<iid>` and `https://<host>/<project>/-/work_items/<iid>` parse to project and iid.
- `https://<host>/groups/<group>/-/epics/<iid>` and `https://<host>/groups/<group>/-/work_items/<iid>` parse to group and iid. GitLab redirects the older `/epics/` and `/issues/` forms to `/work_items/`.
- The item ref's `id` is `<project>#<iid>` for an issue or task and `<group>&<iid>` for an epic.
