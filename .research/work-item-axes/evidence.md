# Evidence: the axes of work-item levels

Entries are in claim-ID order. All were gathered on 2026-11-16 by four subagent angles (Asana, Linear, practitioner
texts, axis-separating sources).

**Caveat on every quote.** Pages were fetched through a small summarizing model, so a quoted phrase is that model's
rendering, not a raw re-read. Entries marked `snippet` rest on a search-result summary, not a fetched page. Re-read
the page behind any quote before the paper cites it. Confidence: `strong` is an author's or vendor's statement of its
own definition or practice; `supporting` is reference documentation; `weak` is a snippet, a partner copy, or
inference.

## Asana

### E01 Asana's Guide lists goals, portfolios, projects, tasks; goals can have sub-goals

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Asana Guide, [Asana hierarchy](https://help.asana.com/s/article/asana-hierarchy). Type: vendor help.
- Notes: "Goals are where you'll track your team's high-level objectives." The Guide says "Each of your team's
  initiatives should be part of a project", so Asana's own `initiative` is a project, not a level above one.

### E02 Goals are OKR-style: objective, key result, with an owner and a timeframe

- Date: 2026-11-16. Status: supported. Confidence: supporting (marketing page).
- Source: Asana, [Goals](https://asana.com/features/goals-reporting/goals.md). Type: vendor marketing.
- Notes: "Set goals and key results for your company, your team, or yourself, and see how they ladder up." Timeframe is
  "quarter, half, annual, or custom". Plan eligibility is stated two ways on the page.

### E03 A goal's progress is computed or manual, chosen per goal

- Date: 2026-11-16. Status: supported. Confidence: weak (snippet; the help body was truncated).
- Source: Asana Guide, [Progress, status, and connecting work to goals](https://help.asana.com/s/article/progress-status-and-connecting-work-to-goals).
  Type: vendor help.
- Notes: automatic goals draw on sub-goals, projects, portfolios, or tasks; "Numeric measures such as revenue must be
  updated manually." The only computed close in Asana's stack.

### E04 Numeric sub-goal rollup shipped only in May 2024

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Asana forum, [goal/sub-goal numeric reporting](https://forum.asana.com/t/goal-subgoal-automatic-numeric-reporting-up-doesnt-count-subgoals/349686/4.md).
  Type: practitioner forum.
- Notes: thread opened 2023-02-24; reply of 2024-05-16: "Sub-goals rollups are now available".

### E05 Portfolios group projects or other portfolios; status is set by hand

- Date: 2026-11-16. Status: supported (rollup absence unconfirmed). Confidence: supporting; weak for the status claim.
- Sources: Asana developers, [Object hierarchy](https://developers.asana.com/docs/object-hierarchy);
  Asana Guide, [Portfolio progress and reporting](https://help.asana.com/s/article/portfolio-progress-and-reporting)
  (snippet). Type: vendor API docs, vendor help.
- Notes: "Portfolios are collections of projects (or other portfolios)." Status choices: on track, at risk, off track,
  on hold, complete, dropped. No source derives portfolio status from children.

### E06 Project, section, task, subtask, milestone, custom field

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: [Object hierarchy](https://developers.asana.com/docs/object-hierarchy);
  [How to set and achieve project milestones](https://asana.com/resources/project-milestones). Type: vendor docs.
- Notes: "A section is a group of tasks within a project." Tasks may sit in zero, one, or many projects. Subtasks nest to
  5 levels ("We do not recommend making sub-subtasks"). A milestone is a "zero-duration checkpoint", "don't represent
  work to be done". Completion is manual (a forum request asks for auto-complete from linked tasks).

### E07 Asana has no native epic, initiative, or sprint object

- Date: 2026-11-16. Status: supported by absence. Confidence: supporting.
- Sources: [Object hierarchy](https://developers.asana.com/docs/object-hierarchy);
  [Asana hierarchy](https://help.asana.com/s/article/asana-hierarchy). Type: vendor docs.
- Notes: neither lists one. No official Asana-to-Jira, Scrum, or SAFe term map was found. Third-party comparison tables
  ("Epics: use projects/sections") are low weight.

### E08 Asana's own agile article defines the epic by size, time box, and owner, and names no object

- Date: 2026-11-16. Status: supported. Confidence: strong (Asana's published wording).
- Source: Asana, [What is an Agile epic?](https://asana.com/resources/agile-epic.md). Type: vendor article.
- Notes: "An epic is a large body of work, composed of smaller to-dos and user stories, that your team completes over
  multiple sprints." Epics "aim for anywhere from 1-4 months", timeboxed, with a product owner "responsible for
  completion". Yearly goals break into initiatives (about 1-3 a quarter), then epics, then stories. This puts
  initiative above epic, against E01.

### E09 Asana staff gave three different epic mappings

- Date: 2026-11-16. Status: contested. Confidence: strong as real-use reports; old (2017-18).
- Source: Asana forum, [Tips for Agile in Asana](https://forum.asana.com/t/tips-for-agile-in-asana/2406).
  Type: practitioner forum (an Asana Customer Success Manager).
- Notes: 2017-05-05 "Epics = sections", "User stories = tasks", a fresh Board project per sprint. 2017-05-11 epics as
  "color-coded, drop-down Custom Fields", stories as sections. 2018-08-02 stories as tasks, "custom fields for your
  stages, values, and estimates".

### E10 A partner copy of Asana's agile help maps epic to portfolio; Jira-to-Asana mappings disagree

- Date: 2026-11-16. Status: contested. Confidence: weak (snippets, a partner copy, forum posts).
- Sources: [Asana for agile and scrum, partner copy](https://platinumpartner.freshdesk.com/support/solutions/articles/65000187638-asana-for-agile-and-scrum);
  Atlassian Community [migration thread](https://community.atlassian.com/t5/Jira-questions/How-Can-I-Migrate-Asana-Projects-to-JIRA-To-Manage-Them-In-Scrum/qaq-p/2905549)
  and [Atlas "Initiative" thread](https://community.atlassian.com/forums/Jira-questions/Why-a-quot-Project-quot-in-Atlas-is-called-quot-Initiative-quot/qaq-p/2979073).
  Type: partner copy, practitioner forum.
- Notes: reported wording "To create an epic in Asana, you'll create a portfolio." Most blogs map Asana project to Jira
  epic; one maps Atlas project to Jira initiative. Re-verify against `help.asana.com/s/article/asana-for-agile-and-scrum`.

## Linear

### E11 Linear's stated hierarchy has no story and no issue types

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Linear, [Jira terminology translated](https://linear.app/docs/jira-terminology-translated). Type: vendor doc.
- Notes: "Workspace > Initiative > Projects > Milestones > Issues > Sub-issues". "We don't have 'stories' since we aim
  to reduce the complexity and number of layers." Issue kinds go in "labels, label groups, parent issues, and custom
  views". Epic maps to project; sprint maps to cycle.

### E12 A project is an outcome-bounded grouping with one lead

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: [Conceptual model](https://linear.app/docs/conceptual-model); [Projects](https://linear.app/docs/projects);
  [Method introduction](https://linear.app/method/introduction). Type: vendor docs, vendor method essay.
- Notes: "Projects group issues together around a shared outcome." "Issues can only be associated with one project at a
  time." Method: "Every project should have a named owner who's responsible for writing the project brief and
  delivery." Lead team sets ownership.

### E13 Project close is manual; progress is computed

- Date: 2026-11-16. Status: supported; the absence of auto-complete is not proven. Confidence: supporting, low on absence.
- Sources: [Project status](https://linear.app/docs/project-status); [Project graph](https://linear.app/docs/project-graph).
  Type: vendor docs.
- Notes: any user sets status by hand. The graph gives computed progress and a forecast with "a buffer of about ±40%".

### E14 A project's target date is chosen at the precision of the team's certainty

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: [Projects](https://linear.app/docs/projects). Type: vendor doc.
- Notes: dates at "year, half-year, quarter, month, or day precision"; pick "the timeframe that matches your level of
  certainty about the end date". Certainty (X5) is a property of the date, and the date is a target, not a time box.
  Relevant to spec question Q7.

### E15 Project milestones are stages inside a project; progress is computed from issues

- Date: 2026-11-16. Status: supported. Confidence: supporting; strong for the practice quote.
- Sources: [Project milestones](https://linear.app/docs/project-milestones);
  [How we run projects at Linear](https://linear.app/now/how-we-run-projects-at-linear). Type: vendor doc, vendor essay.
- Notes: "Project milestones represent different stages in a project's lifecycle." Staff: "Milestones let people decide
  different definitions of being done for different stages of the project." Release-stage use is a paraphrase.

### E16 Initiatives group projects around objectives; one owner; five manual statuses; sub-initiatives nest five deep

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: [Initiatives](https://linear.app/docs/initiatives); [Sub-initiatives](https://linear.app/docs/sub-initiatives);
  [Team initiatives, 2026-08-13](https://linear.app/changelog/2026-08-13-team-initiatives). Type: vendor docs, changelog.
- Notes: statuses "Proposed, Planned, Active, Completed, or Canceled". Sub-initiatives "up to five levels deep";
  "Initiatives can have multiple parents", so the tree is a DAG (Enterprise plan, per snippet). A team can now lead an
  initiative, so ownership (X4) varies independently of value level (X1).

### E17 A cycle is a team-owned repeating time box, separate from projects and releases

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: [Use cycles](https://linear.app/docs/use-cycles); [Method introduction](https://linear.app/method/introduction).
  Type: vendor doc, method essay.
- Notes: "Cycles are time-boxed periods where a team works on completing a pre-defined set of work." "Unlike sprints,
  cycles are not tied to releases." Rollover is automatic. Method: "Don't overload cycles", "Create momentum – don't
  sprint". An issue sits in a project and a cycle independently.

### E18 Linear's Method sizes a project at 1-3 weeks and 1-3 people

- Date: 2026-11-16. Status: supported. Confidence: strong (Linear's own method).
- Sources: [Scope projects](https://linear.app/method/scope-projects);
  [How we run projects at Linear](https://linear.app/now/how-we-run-projects-at-linear). Type: method essay.
- Notes: "Design projects so that they can be completed in 1–3 weeks with a team of 1–3 people." "If there is no way to
  scope down the project, then break it down into stages." Staff: "If multiple people work on it, and it takes over two
  weeks, that's a project"; roadmap features "can split into several projects". So Linear's project is close to a small
  shaped bet, while its Jira mapping calls it an epic. Supports H3.

### E19 Issues are tasks; user stories are rejected

- Date: 2026-11-16. Status: supported. Confidence: strong.
- Source: [Write issues, not user stories](https://linear.app/method/write-issues-not-user-stories). Type: method essay.
- Notes: "If it's not a task, then it doesn't belong in the issue tracker." Vague ideas belong in documents, so
  certainty (X5) is handled outside the tracker.

### E20 Sub-issues inherit team, priority, and project; auto-close of the parent is opt-in

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: [Parent and sub-issues](https://linear.app/docs/parent-and-sub-issues);
  [Auto-close changelog](https://linear.app/changelog/2024-09-06-auto-close-parent-and-sub-issues). Type: vendor docs.
- Notes: "Labels are not inherited." No depth limit stated. The only computed close in Linear's tree, and a team setting.
  The Linear guide [Making the most of Linear](https://linear.app/docs/making-the-most-of-linear) says to use projects,
  not parent/sub-issues, for roadmap work.

### E21 Labels carry kind, not level; Releases is a separate object closed by CI

- Date: 2026-11-16. Status: partial. Confidence: supporting; labels page read only as a snippet.
- Sources: [Teams](https://linear.app/docs/teams); [Label groups changelog](https://linear.app/changelog/2022-11-10-label-groups);
  [Releases](https://linear.app/docs/releases). Type: vendor docs.
- Notes: label groups add one nesting level, one label per group per issue. No native issue-type field found. Releases
  (Business and Enterprise) "connect your CI/CD tool to Linear to know which issues ship in each release"; a continuous
  release is created complete from commit references. The Releases page carried a note aimed at AI agents about an MCP
  server; it was ignored.

### E22 Practitioners put kind inside a time box, and keep projects short

- Date: 2026-11-16. Status: supported. Confidence: weak to supporting (a handbook, plus snippets).
- Sources: Resend, [How we plan our cycles](https://resend.com/handbook/engineering/how-we-plan-our-cycles);
  [Plum](https://build.plumhq.com/how-we-use-linear) (snippet); [cadence review](https://cadence.withremote.ai/blog/linear-review) (snippet).
  Type: company handbook, blogs.
- Notes: Resend: "Our cycle is typically divided into two main fronts: "Foundation" and "New Projects."" Enabler versus
  feature (X6) is used inside a cycle (X3), and projects do not map to it.

## Practitioner texts

### E23 Cohn: an epic is a large story; no threshold; a theme is a grouping, not a size

- Date: 2026-11-16. Status: supports H1. Confidence: strong (author's own text).
- Source: Cohn, [Stories, Epics, and Themes](https://www.mountaingoatsoftware.com/blog/stories-epics-and-themes).
  Type: author blog.
- Notes: "As defined by the XP teams that invented user stories, an epic is a large user story." "there is no precise
  threshold at which an item becomes an epic." Themes "are not necessarily larger than epics".

### E24 Cohn: a feature is a story big enough to release; initiative is year-scale

- Date: 2026-11-16. Status: supports the axis split; supports H3 weakly. Confidence: strong for feature; medium for
  initiative (an offhand remark).
- Sources: [Stories, Epics, and Themes](https://www.mountaingoatsoftware.com/blog/stories-epics-and-themes);
  [video transcript: do names matter](https://www.mountaingoatsoftware.com/videos/data/agile-epic-user-story-and-feature-do-names-matter.txt).
  Type: author blog, transcript.
- Notes: "a feature is a user story that is big enough to be released"; suggests a tag, not a level. "initiative is use
  to means something taking perhaps a year to do." "Sometimes saga is used to mean something bigger than an epic."

### E25 Patton: the story map separates the backbone from release lanes

- Date: 2026-11-16. Status: supports H3 and X1/X2 independence. Confidence: strong (original essay), medium for slicing.
- Source: Patton, [The new backlog](https://www.jpattonassociates.com/the-new-backlog/). Type: author article.
- Notes: "I don't prioritize the backbone. It just 'is.'" "horizontal swim lanes for each release." Levels in the map:
  goals and benefits, users, capabilities, activities (the backbone), tasks, stories. "The really big stories can be
  considered 'epics'", kept for context; he prefers "activity". The essay never says a lane changes an item's level.
  The book and "It's all in how you slice it" were not read. A workshop blurb
  ([Why map](https://jpattonassociates.com/?p=1183)) says "slicing a map to find small viable product releases".

### E26 Pichler: an epic is a coarse story; a feature is bigger and goes on the roadmap

- Date: 2026-11-16. Status: contradicts E24; weakens H2 mildly. Confidence: strong for the epic text; weak for the
  "feature bigger than an epic" line (a search snippet; the fetch did not return it).
- Sources: Pichler, [Epics and ready stories](https://www.romanpichler.com/blog/epics-and-ready-stories/);
  [My product strategy model](https://www.romanpichler.com/blog/my-product-strategy-model/amp/). Type: author blog.
- Notes: "Epics are big, coarse-grained user stories." "An epic sketches a feature or bigger piece of functionality."
  Author comment: "I include capabilities and features on a product roadmap, but not epcis [sic]."

### E27 Pichler: goals are outcomes, features sketch the output, releases carry goals

- Date: 2026-11-16. Status: supports the value/output split; silent on span. Confidence: strong.
- Sources: [Agile product roadmap](https://www.romanpichler.com/blog/agile-product-roadmap/);
  [Release planning advice](https://www.romanpichler.com/blog/release-planning-advice/amp/);
  [My product strategy model](https://www.romanpichler.com/blog/my-product-strategy-model/amp/). Type: author blog.
- Notes: "product goals, which describe the outcomes the product should create"; "the features sketch the output
  required to achieve a goal"; "I regard a release as a version of a product." The order on X1 is goal > feature >
  epic > story. He does not use "initiative" and never says whether one goal spans releases.

### E28 Fowler: story and feature are the same concept; no epic page

- Date: 2026-11-16. Status: supports H1. Confidence: medium (a short bliki entry).
- Source: Fowler, [UserStory](https://www.martinfowler.com/bliki/UserStory.html). Type: bliki.
- Notes: "You also hear the same concept referred to as a feature." Stories are "usually a matter of person-days".

### E29 Thoughtworks: the epic's original meaning has weakened

- Date: 2026-11-16. Status: supports H1. Confidence: medium (practitioner blog, by Matt Riley, 2020-06-11, not Fowler).
- Source: [User stories: a tale of epic confusion](https://www.thoughtworks.com/en-sg/insights/blog/user-stories-tale-epic-confusion).
  Type: blog.
- Notes: "the original definition of 'epic' has weakened over the years." He quotes Cohn: "just a label we apply to a
  large story".

### E30 Fowler: a long feature is hidden behind a release toggle; it stays one feature

- Date: 2026-11-16. Status: supports H3. Confidence: strong (author's own bliki); the best single settler.
- Sources: Fowler, [Feature Toggle](https://martinfowler.com/bliki/FeatureToggle.html);
  [Feature Toggles article](https://martinfowler.com/articles/feature-toggles.html). Type: bliki, article.
- Notes: "Imagine you are releasing into production every two weeks," "but need to build a feature that's going to take
  three months to complete." Release toggles implement "separating [feature] release from [code] deployment" and are
  "the last thing you should do"; he prefers smaller releases first.

### E31 Cagan and SVPG: outcomes versus outputs; the team objective carries ownership

- Date: 2026-11-16. Status: supports X1 as an outcome axis. Confidence: medium (essays about teams, not trackers).
- Sources: SVPG, [Product vs feature teams](https://www.svpg.com/product-vs-feature-teams/);
  [Changing how you decide which problems to solve](https://www.svpg.com/changing-how-you-decide-which-problems-to-solve/);
  [Outcomes are hard](https://www.svpg.com/outcomes-are-hard/). Type: author blog.
- Notes: empowered teams are "focused on and measured by outcomes (rather than output)"; leaders "assign those problems
  to the relevant product teams through team objectives". No page used "product initiative" or "epic".

### E32 Jeffries and XP: the card is the only unit

- Date: 2026-11-16. Status: neutral. Confidence: strong.
- Source: Jeffries, [Card, Conversation, Confirmation](https://ronjeffries.com/xprog/articles/expcardconversationconfirmation/).
  Type: author article.
- Notes: the planning game selects "user stories to make up the most valuable small releases". No level vocabulary.

## Sources that separate the axes

### E33 SAFe: an epic is a portfolio bet with an MVP and a business case; business versus enabler is a kind

- Date: 2026-11-16. Status: supports H1. Confidence: strong for definitions.
- Source: SAFe, [Epic](https://framework.scaledagile.com/epic). Type: framework spec.
- Notes: "An Epic is a significant solution development initiative." "Business epics deliver value directly to the
  customer." "Enabler epics enhance the architectural runway to support future business or technical needs." Epics
  need Portfolio Leadership approval and "an MVP, a Lean business case, and an estimate of costs". The page is silent on
  PI span.

### E34 SAFe sizes capability and feature to one PI; the "epic spans PIs" claim is secondary only

- Date: 2026-11-16. Status: partial. Confidence: strong for the quotes; weak for the span claim.
- Source: SAFe, [Features and capabilities](https://framework.scaledagile.com/features-and-capabilities/). Type: framework spec.
- Notes: a capability is "sized to be delivered within a PI"; a feature is something an ART can complete "within a PI";
  features come from "splitting epics or capabilities". "Epic spans multiple PIs" appears only in study guides, so the
  SAFe support for H3 in `topic.md` is the weakest link until a primary quote is found.

### E35 SAFe: develop on cadence, release on demand

- Date: 2026-11-16. Status: supported. Confidence: medium-high (part behind a login wall).
- Source: SAFe, [Release on demand](https://framework.scaledagile.com/release-on-demand). Type: framework spec.
- Notes: "Develop on cadence. Release on demand." "releases are decoupled from the work to deploy the functionality."
  The PI is a time box (X3); release (X2) is its own decision.

### E36 Shape Up: appetite is the time box, the bet is the commitment, and there is no backlog

- Date: 2026-11-16. Status: supported. Confidence: strong (the authors' own book).
- Sources: [Appetite](https://basecamp.com/shapeup/1.2-chapter-03); [Write the pitch](https://basecamp.com/shapeup/1.5-chapter-06);
  [Bets, not backlogs](https://basecamp.com/shapeup/2.1-chapter-07); [Betting table](https://basecamp.com/shapeup/2.2-chapter-08);
  [Circuit breaker](https://basecamp.com/shapeup/2.3-chapter-09); [Shipping](https://basecamp.com/shapeup/3.6-chapter-15).
  Type: book.
- Notes: "fixed time, variable scope". A bet is "the decision to commit a team to a project for one cycle". The
  circuit breaker cancels "projects that don't ship in one cycle by default". "Shipping means merging into the main
  codebase". Certainty is a gate (shaped pitch, then bet), not a hierarchy. Shape Up binds release to the cycle
  (X2 = X3). Re-betting a multi-cycle effort as a new project is an inference.

### E37 Scrum.org: an epic or feature can span several sprints

- Date: 2026-11-16. Status: supported. Confidence: medium.
- Source: Scrum.org, [What are epics and features](https://www.scrum.org/resources/blog/what-are-epics-and-features).
  Type: organisation blog.
- Notes: "The delivery of a complete epic or feature can span multiple Sprints." It does not mention releases.

### E38 OKR: the objective is why, key results are measured outcomes, both bound to a period

- Date: 2026-11-16. Status: supported. Confidence: medium (re:Work is primary; whatmatters.com is Doerr-affiliated).
- Sources: Google re:Work, [Set goals with OKRs](https://rework.withgoogle.com/en/guides/set-goals-with-okrs);
  [What Matters](https://www.whatmatters.com/faqs/okr-meaning-definition-example). Type: practitioner guide, vendor site.
- Notes: "Key results should describe outcomes, not activities." "Google sets annual and quarterly OKRs." An objective
  can be "long lived, rolled over for a year or longer" without becoming another level. Doerr's own book was not read.

### E39 Continuous Delivery separates release from deploy, though the pages do not use those words

- Date: 2026-11-16. Status: partial. Confidence: medium.
- Sources: Fowler, [Continuous Delivery](https://martinfowler.com/bliki/ContinuousDelivery.html);
  [continuousdelivery.com](https://www.continuousdelivery.com/). Type: bliki, author site.
- Notes: software that "can be released to production at any time"; a retailer rolled out to employees, then premium
  customers, then everyone. The Humble and Farley book was not read.

### E40 SemVer marks the kind of change, not a value level or time box

- Date: 2026-11-16. Status: supported. Confidence: strong.
- Source: [semver.org](https://semver.org/). Type: specification.
- Notes: MAJOR is "incompatible API changes", MINOR adds "functionality in a backward compatible manner", PATCH is
  "backward compatible bug fixes". A release (X2) is a version, not a value tier.

### E41 Kanban: classes of service are a policy axis, not a hierarchy; "no time box" is inferred

- Date: 2026-11-16. Status: partial. Confidence: weak.
- Source: Kanban University, [glossary](https://kanban.university/glossary/). Type: community body.
- Notes: "A specific level of service applied to the treatment of a work item established through a defined set of
  policies." The four archetypes (expedite, fixed date, intangible, standard) come from a snippet. Cadence is "usually
  somewhere between daily and weekly". No Anderson text read.
