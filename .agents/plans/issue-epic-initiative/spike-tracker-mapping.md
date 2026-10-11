> Spike report for [the plan](../issue-epic-initiative.plan.md). Reference names normalized to ADR 0003 after the spike; the plan records the decisions taken from it.

# Spike: tracker mapping for issue / epic / initiative adapters
Date 2026-10-11. Read-only. [V] = verified by command output here; [D] = from docs page (URL given); [U] = unverified.

## Decisions (short)
- GitHub: native in `gh` 2.102.0. Epic = parent issue (type Feature, label `epic`) with sub-issues. Initiative = parent issue of epics (nesting up to 8 levels), same mechanism; GitHub Projects/milestones are optional views, not the level.
- GitLab: epics need Premium/Ultimate. Free fallback = parent issue + tasks/`epic` label. `glab` is NOT installed here and has no epic command in docs; use `glab api`.
- Bitbucket: drop it.

## GitHub
Installed: `gh version 2.102.0 (2026-09-30)` [V]. Auth: logged in [V].

Sub-issues [V from `gh issue create --help` / `gh issue edit --help`]:
- create child: `gh issue create --parent <num|url> ...`
- attach existing: `gh issue edit <parent> --add-sub-issue <num|url,...>`
- detach: `gh issue edit <parent> --remove-sub-issue <n>` or `gh issue edit <child> --remove-parent`
- set parent: `gh issue edit <child> --parent <num|url>`
- list children / parent: `gh issue view <n> --json subIssues,subIssuesSummary,parent` (fields listed in `gh issue list --help` JSON fields [V]). REST alternative: `GET /repos/{o}/{r}/issues/{n}/sub_issues` (per_page max 100), `GET .../parent` [D https://docs.github.com/en/rest/issues/sub-issues]. REST POST needs `sub_issue_id` = issue `id` (not number), optional `replace_parent`; sub-issue must share the parent's repo OWNER [D same URL].
- GraphQL fallback: mutations `addSubIssue`, `removeSubIssue`, `reprioritizeSubIssue` exist; AddSubIssueInput = issueId, subIssueId, subIssueUrl, replaceParent [V introspection].
- Limits: 100 sub-issues per parent, 8 levels deep, cross-repo allowed [D https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues]. (REST doc: same owner only.)
- Availability: works on public repo repobuddy/repobuddy (org-owned) and `subIssuesSummary` returned [V]. Docs page gives no plan restriction [U for private/free-plan]. A user-owned private repo: sub-issue fields exist in schema; not exercised (read-only).

Issue types (kinds):
- Read: `gh api graphql -f query='{repository(owner:"O",name:"R"){issueTypes(first:20){nodes{id name}}}}'` [V]. repobuddy/repobuddy returned Task, Bug, Feature [V]. A user-owned repo returned `issueTypes: null` [V] -> types unavailable for user repos (org-only: https://docs.github.com/en/issues/tracking-your-work-with-issues/configuring-issues/managing-issue-types-in-an-organization). Defaults task/bug/feature, editable, max 25 [D same].
- Set: `gh issue create --type Bug`, `gh issue edit N --type Bug`, `--remove-type` [V]. Filter: `gh issue list --type Bug` [V]. Mutation `updateIssueIssueType`/`createIssueType` exist [V].
- Fallback when `issueTypes` is null/empty: labels `bug`, `enhancement` (GitHub default labels) [U: names are repo-specific; check `gh label list`]; task -> no label or `task`.

Level mapping: epic and initiative are NOT built-in types; defaults offer only Task/Bug/Feature. Org can add custom types (e.g. "Epic", "Initiative") but that needs org admin [D]. Recommend: epic = type Feature (category stays) + label `epic`; initiative = label `initiative`; level is defined by having sub-issues. Reason: works on user repos, no admin rights, keeps two-axis model (category = type, level = structure/label). If org has an "Epic" type, `kinds` may offer it, but do not require it.

Promote/demote [V flags]:
- issue -> epic: no type change needed; add `--add-sub-issue` children (or `gh issue create --parent N`), add label `epic`: `gh issue edit N --add-label epic`. Optionally set type.
- epic -> issue: `--remove-sub-issue` each child (or fold children into a task list in the body), `--remove-label epic`. Children are not deleted.
- epic -> initiative: add label `initiative`, keep epics as sub-issues.
- initiative -> epic: swap label.

Search for duplicates:
- `gh issue list -S "<terms> in:title,body" --state all` is repo-scoped, accepts advanced syntax [V --help]. `gh search issues "<terms>" --repo O/R` is cross-repo and supports `--search-type semantic|hybrid` [V --help]. Recommend `gh issue list -S` first, `gh search issues --search-type hybrid` as second pass.
- Filters: `--type NAME` on `gh issue list` [V]. Query qualifiers `type:Bug`, `has:sub-issues-progress`, `no:parent-issue`, `parent-issue:O/R#N` were accepted without error on `gh issue list -S` [V]; `no:parent-issue` and `has:sub-issues-progress` returned results; `type:Bug` returned empty (consistent, no bug-typed issues) [V]. Semantic correctness of the filters beyond that [U]. Docs: advanced issue search page linked in --help.

Adapter ops:
| op | command |
|---|---|
| detect | remote host `github.com` (`git remote get-url origin`); `gh auth status` |
| kinds | graphql `issueTypes` (above); empty/null -> `gh label list --json name` |
| search | `gh issue list -S "..." --state all --json number,title,url,state` (+ `gh search issues`) |
| create | `gh issue create -t -F body --type X` or `-l bug` fallback; epic/initiative add `-l epic` |
| link | `gh issue create --parent P` / `gh issue edit P --add-sub-issue C` |
| promote | add label + sub-issues; demote: remove them |
| url | `gh issue create` prints URL; `gh issue view N --json url` |

Section for GitHub risks: gh >= version with --parent/--type is new (these flags exist in 2.102.0; minimum version [U]); older gh needs `gh api`. `--type` errors on repos without types [U: not tested, would create].

## GitLab
`glab`: not installed (`command not found`) [V]. Docs list `glab work-items` as EXPERIMENTAL, no epic/link/issue-type commands found in README [D https://gitlab.com/gitlab-org/cli/-/raw/main/README.md]; `glab issue create` exists. Treat `glab api` (REST/GraphQL) as the portable path. GitLab not exercised [no GitLab auth/repo here].

Tiers / model:
- Issues: Free, Premium, Ultimate [D https://docs.gitlab.com/user/project/issues/]; issues are work items, GA in 18.7 [D same].
- Epics: Premium or Ultimate; group-level; work item epics GA in 18.1 [D https://docs.gitlab.com/user/group/epics/]. Child epics: Ultimate only. Issue under epic OK on Premium. Hierarchy: epic > child epics (7 levels), epic > issues (5000 direct children; epic holds either epics or issues, not mixed), issue > tasks (all tiers listed) [D https://docs.gitlab.com/user/work_items/child_items/]. An issue has at most one parent epic [D same].
- REST epics API deprecated in 17.0, use Work Items API from 18.1; `POST /groups/:id/epics` still documented (title, description, labels, parent_id) [D https://docs.gitlab.com/api/epics/]. Add-issue endpoint: epic issues API [U, not read]. Work Items API is GraphQL (mutations `workItemCreate`, hierarchy via `workItemUpdate` hierarchyWidget) [U: could not read schema; verify with introspection on a real instance].
- Issue create REST: `POST /projects/:id/issues` with `issue_type` in issue|incident|test_case|task; `epic_id` Premium+; "promote issue to epic" Premium+ [D https://docs.gitlab.com/api/issues/]. Update accepts issue|incident|test_case only [D same].

Free-tier fallback: epic = ordinary issue labeled `epic` whose body holds a task list of child issue references (`- [ ] #12`), or use native tasks under the issue (`issue_type=task`, Free) for small children; link with "related" issue links (Links API [U]). Milestones group work by delivery; initiative = issue labeled `initiative` listing epic issues, or a milestone. Detect tier by attempting `GET /groups/:id` plan or probing the epics endpoint: 403/404 -> fallback [U, not tested].

Kinds on GitLab: no org types. Built-in issue types issue/incident/test_case/task [D]. bug/feature/task: use scoped labels `type::bug`, `type::feature`, `type::task` or plain `bug`, `feature`; task category may map to `issue_type=task` only if it is a child of an issue (tasks are children) [U]. GitLab's own project uses `type::bug`, `type::feature`, `type::maintenance` [U]. Recommend label fallback: `bug`, `feature`/`enhancement`, via `glab label list` check.

Adapter ops:
| op | command |
|---|---|
| detect | remote host gitlab.com or self-managed host; `glab auth status` |
| kinds | `glab label list`; tier probe for epics |
| search | `glab issue list --search "..." --all` |
| create | `glab issue create -t -d -l bug`; epic (Premium): `glab api -X POST groups/:id/epics -f title=...` |
| link | Premium: epic issues API / `workItemUpdate`; Free: task list in parent body + label |
| promote | Premium: quick action `/promote_to_epic` [U]; Free: add label + task list |
| url | `glab issue create` prints URL; `web_url` in API |

## Bitbucket
Atlassian announcement: native Issues and Wiki fully deprecated and removed from Bitbucket Cloud, no UI or API access; use Jira [D https://community.atlassian.com/forums/discussion/3193882/announcing-sunset-of-bitbucket-issues-and-wikis, found via search; page not fetched directly; dates in the post are inconsistent]. Recommendation: remove the `bitbucket.org` row from the issue skill's detect list (current `file-issue/SKILL.md` line 20 lists it, "gh with Bitbucket extension or browser" [V]). Bitbucket repos should route to the `work-tracker` reference (Jira adapter by a tracker package).

## Per-level mapping
| Level | GitHub | GitLab Premium+ | GitLab Free |
|---|---|---|---|
| issue | issue, type Bug/Feature/Task or label | issue, labels | issue, labels |
| epic | parent issue + sub-issues, label `epic` (type Feature) | group epic (work item) with child issues | issue labeled `epic` + task list / tasks |
| initiative | parent issue of epics, label `initiative` | parent epic (Ultimate) or labeled epic (Premium: no nesting) | issue labeled `initiative` listing epics, or milestone |

## Open risks
1. Org-owned vs user-owned GitHub: types only for orgs; fallback labels must exist (`gh label list`) or create step must offer to proceed without.
2. `gh issue create --type` on a repo without types: behavior untested (read-only spike).
3. Minimum `gh` version for `--parent/--type/--add-sub-issue` unknown; need version gate or `gh api` fallback.
4. Cross-repo parents: CLI allows URLs; REST says same owner only.
5. GitLab Work Items GraphQL inputs unverified; epic REST is deprecated, so the adapter should target GraphQL. Needs a test on a real GitLab Premium instance.
6. `glab` absent and its work-items command is experimental; require `glab api`.
7. Premium has no nested epics, so initiative on GitLab Premium needs the label fallback.
8. Search qualifiers (`parent-issue:`, `no:parent-issue`) accepted but semantics only lightly tested.
9. Bitbucket removal is a breaking change for current file-issue users; note in the changeset.
