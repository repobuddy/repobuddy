# Evidence: the axes of work-item levels

Entries are in claim-ID order. All were gathered on 2026-11-16 by four subagent angles (Asana, Linear, practitioner
texts, axis-separating sources). E01-E22 were re-read against raw pages the same day (see "Re-read status").

## Re-read status

- **E01-E22 re-read with curl on 2026-11-16.** Linear, Resend, and the Asana forum, marketing, developer, and article
  pages were readable raw. `help.asana.com` and the Atlassian Community pages are JavaScript shells: their quotes
  rest on a summarizer or a snippet and stay marked so. Entries changed by the re-read say so in their Notes.
- **E23-E41 re-read with curl on 2026-11-16.** SAFe and Patton need a plain `curl/8` user agent (a browser agent is
  blocked); Scrum.org stays blocked, so E37 rests on a summarizer. Patton's PDF and the `?p=1183` blurb were not
  re-read. Entries changed by the re-read say so in their Notes.

**Caveat on every quote.** Pages were fetched through a small summarizing model, so a quoted phrase is that model's
rendering, not a raw re-read. Entries marked `snippet` rest on a search-result summary, not a fetched page. Re-read
the page behind any quote before the paper cites it. Confidence: `strong` is an author's or vendor's statement of its
own definition or practice; `supporting` is reference documentation; `weak` is a snippet, a partner copy, or
inference.

## Asana

### E01 Asana's Guide lists goals, portfolios, projects, tasks; goals can have sub-goals

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Asana Guide, [Asana hierarchy](https://help.asana.com/s/article/asana-hierarchy). Type: vendor help.
- Notes: re-read only through a summarizer (`help.asana.com` is a JavaScript shell); sub-goals were confirmed only
  from a video caption, "Setting and tracking high-level objectives with goals and sub-goals". "Goals are where
  you'll track your team's high-level objectives." The Guide says "Each of your team's
  initiatives should be part of a project", so Asana's own `initiative` is a project, not a level above one.

### E02 Goals are OKR-style: objective, key result, with an owner and a timeframe

- Date: 2026-11-16. Status: supported. Confidence: supporting (marketing page).
- Source: Asana, [Goals](https://asana.com/features/goals-reporting/goals.md). Type: vendor marketing.
- Notes: "Set goals and key results for your company, your team, or yourself, and see how they ladder up." Timeframe is
  "quarter, half, annual, or custom". Plan eligibility is stated two ways on the page.

### E03 A goal's progress is computed or manual, chosen per goal

- Date: 2026-11-16. Status: supported. Confidence: weak (snippet; the help body is a JavaScript shell, unverifiable raw).
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
- Notes: "Portfolios are collections of projects (or other portfolios)." (verified raw). The status list and the
  manual-status claim could not be re-read (JavaScript shell). Status choices: on track, at risk, off track,
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
- Notes: not re-readable: the partner URL returns 404, and the Asana help and Atlassian pages are JavaScript shells
  (only the thread titles were confirmed). Reported wording "To create an epic in Asana, you'll create a portfolio." Most blogs map Asana project to Jira
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
  delivery." The lead-team text is on the Initiatives page ("Designate a lead team to assign ownership over an initiative to a
  specific team") and on Project status ("A project uses the statuses available to its lead team"), not on Projects.

### E13 Project close is manual; progress is computed

- Date: 2026-11-16. Status: supported; the absence of auto-complete is not proven. Confidence: supporting, low on absence.
- Sources: [Project status](https://linear.app/docs/project-status); [Project graph](https://linear.app/docs/project-graph).
  Type: vendor docs.
- Notes: status changes by hand: "To change a project's status, open the project, select its status in the overview
  or project details sidebar, and choose a new status". The page does not say who may. The graph offers "an optimistic
  and pessimistic completion date that includes a buffer of about ±40%".

### E14 A project's target date is chosen at the precision of the team's certainty

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: [Projects](https://linear.app/docs/projects). Type: vendor doc.
- Notes: "Select start and target dates that match your level of certainty. Options are available to choose a year,
  half-year, quarter, month or precise day." This covers start and target dates. Certainty (X5) is a property of the
  date, and the date is a target, not a time box.
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
- Notes: "Design projects so that they can be completed in 1–3 weeks with a team of 1–3 people." (verified raw). The
  earlier quote "break it down into stages" was not found on the page and is dropped. Staff: "If multiple people work
  on it, and it takes over two weeks, that's a project" (verified). On roadmaps: "we break those themes further into
  concrete features that we can build. Those features often become the projects themselves." So a feature becomes one
  project, not several. Linear's project is close to a small shaped bet, while its Jira mapping calls it an epic. This
  fits H3 only loosely: it shows Linear keeps a project small, not that a multi-release outcome stays one item.

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
  server. The re-read did not reproduce that note: the only MCP text on the page is sidebar navigation. Treat the
  note as unconfirmed.

### E22 Practitioners put kind inside a time box; some projects span several cycles

- Date: 2026-11-16. Status: supported. Confidence: weak to supporting (a handbook, plus snippets).
- Sources: Resend, [How we plan our cycles](https://resend.com/handbook/engineering/how-we-plan-our-cycles);
  [Plum](https://build.plumhq.com/how-we-use-linear) (404 on re-read, unverifiable);
  [cadence review](https://cadence.withremote.ai/blog/linear-review).
  Type: company handbook, blogs.
- Notes: Resend: "Our cycle is typically divided into two main fronts: "Foundation" and "New Projects."" Enabler versus
  feature (X6) is used inside a cycle (X3), and projects do not map to it. The cadence review says "Projects are scoped pieces of work that span
  multiple cycles (a feature, a migration)", which sits against Linear's own 1-3 week sizing in E18.

## Practitioner texts

### E23 Cohn: an epic is a large story; no threshold; a theme is a grouping, not a size

- Date: 2026-11-16. Status: supports H1. Confidence: strong (author's own text).
- Source: Cohn, [Stories, Epics, and Themes](https://www.mountaingoatsoftware.com/blog/stories-epics-and-themes).
  Type: author blog.
- Notes: re-read raw. "As defined by the XP teams that invented user stories, an epic is a large user story." The
  body says "There's no magic threshold at which we call a particular story an epic"; the image caption says "no
  precise threshold at which an item becomes an epic". Themes "are not necessarily larger than epics".

### E24 Cohn: a feature is a story big enough to release; initiative is year-scale

- Date: 2026-11-16. Status: supports the axis split; supports H3 weakly. Confidence: strong for feature; medium for
  initiative (an offhand remark).
- Sources: [Stories, Epics, and Themes](https://www.mountaingoatsoftware.com/blog/stories-epics-and-themes);
  [video transcript: do names matter](https://www.mountaingoatsoftware.com/videos/data/agile-epic-user-story-and-feature-do-names-matter.txt).
  Type: author blog, transcript.
- Notes: re-read raw. "a feature is a user story that is big enough to be released or perhaps big enough that users
  will notice and be happier"; suggests a tag, not a level. "Sometimes saga is used to mean something bigger than an
  epic, and initiative is use to means something taking perhaps a year to do." He adds "Something this big shouldn't
  be on your product backlog".

### E25 Patton: the story map separates the backbone from release lanes

- Date: 2026-11-16. Status: supports H3 and X1/X2 independence. Confidence: strong (original essay), medium for slicing.
- Source: Patton, [The new backlog](https://www.jpattonassociates.com/the-new-backlog/). Type: author article.
- Notes: re-read raw. "I don't prioritize the backbone. It just 'is.'" "creating horizontal swim lanes for each
  release", then "I move the stories up and down into each lane". The page has no explicit statement about slicing
  releases across the backbone, and does not say a lane changes an item's level. Levels in the map:
  goals and benefits, users, capabilities, activities (the backbone), tasks, stories. "The really big stories can be
  considered 'epics'", kept for context; he prefers "activity". The essay never says a lane changes an item's level.
  The book and "It's all in how you slice it" were not read. A workshop blurb
  ([Why map](https://jpattonassociates.com/?p=1183)) says "slicing a map to find small viable product releases".

### E26 Pichler: an epic is a coarse story; he roadmaps features and capabilities, not epics

- Date: 2026-11-16. Status: fits Cohn's epic (E23); weakens H2 mildly. Confidence: strong.
- Correction: the earlier "a feature is bigger than an epic" line was a search-snippet attribution. The raw pages do not
  say it, so it is struck. Pichler's own wording makes an epic a sketch of a feature or more, the opposite direction.
- Sources: Pichler, [Epics and ready stories](https://www.romanpichler.com/blog/epics-and-ready-stories/);
  [My product strategy model](https://www.romanpichler.com/blog/my-product-strategy-model/amp/). Type: author blog.
- Notes: "Epics are big, coarse-grained user stories. An epic sketches a feature or bigger piece of functionality. It
  acts as a placeholder for more detailed stories." The roadmap line is Pichler's 2018 reader-comment reply on the
  epics-and-ready-stories page, not the strategy page: "I include capabilities and features on a product roadmap, but
  not epcis [sic]."

### E27 Pichler: goals are outcomes, features sketch the output, releases carry goals

- Date: 2026-11-16. Status: supports the value/output split; silent on span. Confidence: strong.
- Sources: [Release planning advice](https://www.romanpichler.com/blog/release-planning-advice/amp/);
  [My product strategy model](https://www.romanpichler.com/blog/my-product-strategy-model/amp/). Type: author blog.
- Notes: "product goals, which describe the outcomes the product should create"; "the features sketch the output
  required to achieve a goal" (strategy page); "I regard a release as a version of a product", and "goals that describe
  the outcomes or benefits your product should create. I call these goals product goals (and sometimes release goal)"
  (release-planning page). The order goal > feature > epic > story is an inference, not stated. The agile-product-roadmap
  page was dropped: it has neither "outcome" nor "output". He does not use "initiative" and never says whether one goal
  spans releases.

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
- Notes: re-read raw. "Imagine you are releasing into production every two weeks, but need to build a feature that's
  going to take three months to complete." The bliki heading is "Release flags are the last thing you should do". The
  article says release toggles implement "separating [feature] release from [code] deployment" and are
  "transitionary by nature". The earlier "prefers smaller releases first" is not in the bliki and is dropped.

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
- Notes: re-read raw; all quotes exact. "An Epic is a significant solution development initiative." "Business epics deliver value directly to the
  customer." "Enabler epics enhance the architectural runway to support future business or technical needs." Epics
  need Portfolio Leadership approval and "an MVP, a Lean business case, and an estimate of costs". The page is silent on
  PI span.

### E34 SAFe sizes capability and feature to one PI; no primary SAFe page says an epic spans PIs

- Date: 2026-11-16. Status: partial. Confidence: strong for the quotes; the span claim is unsupported.
- Source: SAFe, [Features and capabilities](https://framework.scaledagile.com/features-and-capabilities/). Type: framework spec.
- Notes: re-read raw. A capability "represents large solution functionality whose implementation often spans multiple
  ARTs and is sized to be delivered within a PI". A feature is "sized to be delivered by an Agile Release Train within a
  PI". Features come "from splitting epics or capabilities". A search of `/epic`, `/features-and-capabilities`,
  `/portfolio-kanban`, `/lean-portfolio-management`, and `/program-increment` for "multiple PIs", "several PIs",
  "across PIs" found nothing; the only "spans multiple" hit is ARTs. "Epic spans multiple PIs" appears only in study
  guides, so H3 has no primary SAFe support.

### E35 SAFe: develop on cadence, release on demand

- Date: 2026-11-16. Status: supported. Confidence: medium-high (part behind a login wall).
- Source: SAFe, [Release on demand](https://framework.scaledagile.com/release-on-demand). Type: framework spec.
- Notes: re-read raw (a preview; the login wall was not confirmed). "Develop on cadence. Release on demand."
  "Critically, releases are decoupled from the work to deploy the functionality."
  The PI is a time box (X3); release (X2) is its own decision.

### E36 Shape Up: appetite is the time box, the bet is the commitment, and there is no backlog

- Date: 2026-11-16. Status: supported. Confidence: strong (the authors' own book).
- Sources: [Appetite](https://basecamp.com/shapeup/1.2-chapter-03); [Write the pitch](https://basecamp.com/shapeup/1.5-chapter-06);
  [Bets, not backlogs](https://basecamp.com/shapeup/2.1-chapter-07); [Betting table](https://basecamp.com/shapeup/2.2-chapter-08);
  [Circuit breaker](https://basecamp.com/shapeup/2.3-chapter-09); [Shipping](https://basecamp.com/shapeup/3.6-chapter-15).
  Type: book.
- Notes: "fixed time, variable scope". A bet is "the decision to commit a team to a project for one cycle". The
  circuit breaker cancels "projects that don't ship in one cycle by default" (glossary; exact). "Shipping means merging
  into the main codebase and expecting not to touch it again" is on the circuit-breaker page (2.3), not the Shipping
  page (3.6). Chapters 1.5, 2.2, and 3.6 were not checked for quotes. Certainty is a gate (shaped pitch, then bet), not a hierarchy. Shape Up binds release to the cycle
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
- Notes: re:Work: "Key results should describe outcomes, not activities." "Google sets annual and quarterly OKRs."
  whatmatters.com (not re:Work): an Objective "can be long lived, rolled over for a year or longer", so it need not
  become another level. Doerr's own book was not read.

### E39 Continuous Delivery separates release from deploy, though the pages do not use those words

- Date: 2026-11-16. Status: partial. Confidence: medium.
- Sources: Fowler, [Continuous Delivery](https://martinfowler.com/bliki/ContinuousDelivery.html);
  [continuousdelivery.com](https://www.continuousdelivery.com/). Type: bliki, author site.
- Notes: on Fowler's bliki only (continuousdelivery.com has neither): software that "can be released to production at
  any time"; a retailer rolled out "first to its employees, then to an invited set of premium customers, and finally to
  all customers". The Humble and Farley book was not read.

### E40 SemVer marks the kind of change, not a value level or time box

- Date: 2026-11-16. Status: supported. Confidence: strong.
- Source: [semver.org](https://semver.org/). Type: specification.
- Notes: MAJOR is "incompatible API changes", MINOR adds "functionality in a backward compatible manner", PATCH is
  "backward compatible bug fixes". A release (X2) is a version, not a value tier.

### E41 Kanban: classes of service are a policy axis, not a hierarchy; "no time box" is inferred

- Date: 2026-11-16. Status: partial. Confidence: weak.
- Source: Kanban University, [glossary](https://kanban.university/glossary/). Type: community body.
- Notes: "A specific level of service applied to the treatment of a work item established through a defined set of
  policies." The four archetypes (Expedite, Fixed date, Intangible, Standard) are on the glossary itself. "Usually
  somewhere between daily and weekly" describes the Kanban meeting, not delivery, so it is weak support for "no time
  box". No Anderson text read.

## Scrum.org material supplied by the owner

Both entries were read from PDFs the owner supplied, so the quotes are exact, not summarized. They are not re-fetched pages.

### E42 Scrum.org (Jocham): a fixed goal over a changing plan, two levels of done, release not gated by the Review

- Date: 2026-11-16. Status: supports H3 loosely and X2/X3 separation. Confidence: medium (a practitioner report by a
  co-author of the Expansion Pack; opinion with one anecdote, and the Scrum Guide quotes are second-hand).
- Source: Ralph Jocham, [AI - More Feedback, Less Direction](https://www.scrum.org/resources/blog/ai-more-feedback-less-direction),
  2026-11-15 (PDF supplied by the owner). Type: organisation blog.
- Notes:
  - Goal against plan: "The Sprint Goal still stays fixed inside the Sprint, because a goal that moves with every signal
    gives the team no direction. Scope can shift beneath it". "A threat to the plan is a scope conversation with the
    Product Owner. A signal that kills the goal is a reason to cancel the Sprint."
  - Two levels of done: "The Definition of Output Done settles quality before anything moves on. The Definition of
    Outcome Done sits one level up. It asks whether what shipped moved the metric it was meant to move". His reference
    to the Scrum Guide Expansion Pack: Output Done is "increment successfully built; verification", Outcome Done is
    "business outcome achieved; validation". The Expansion Pack itself was not read.
  - Release against time box, quoting the Scrum Guide: "an Increment may be delivered to stakeholders prior to the end
    of the Sprint"; "The Sprint Review should never be considered a gate to releasing value". He expects Sprint length
    to shrink.
  - Goal as a filter: "Holding the Product Goal as a real filter was always the Product Owner's job"; "testing whether
    a Product Goal can reject a backlog item". Anecdote: a refinement where "the team brought in 150+ items" and the one
    that mattered was "checkout is broken" (from the image).
  - Ownership: with many people able to change the product, "only one is accountable for where it goes"; "If coherence
    is not owned, the product becomes a collage" (quoting Barla).
  - The post never mentions epics, features, or backlog structure.

### E43 Scrum.org: What is Professional Scrum? (infographic)

- Date: 2026-11-16. Status: context only. Confidence: weak (a marketing graphic).
- Source: Scrum.org, What is Professional Scrum? (PDF supplied by the owner). Type: organisation infographic.
- Notes: names the Product Goal and the Sprint Goal ("COMMITMENT to achieve the Sprint Goal, Product Goal and
  Definition of Done") and "Outcome oriented Scrum Teams work on problems that, when solved, deliver value". Scrum's
  commitments are goals, not item types, which agrees with the topic's finding that the Scrum Guide has no epic, story,
  feature, or initiative. It mentions Evidence-Based Management, whose guide was not read.

### E44 Ballarin, Scrum with AI: goal ladder, delivery against learning rhythm, spec as the discovery gate

- Date: 2026-11-16. Status: supports X1 as outcome-bound, X2/X3 separation, and X5 as a gate. Confidence: medium to
  weak (a practitioner book by a Scrum trainer whose firm sells the training; no data of its own on levels; its cited
  figures are second-hand).
- Source: Alex Ballarin, [Scrum with AI](https://itnove.com/book/scrum-with-ai), 2026 (PDF supplied by the owner;
  read whole, so the quotes are exact). Type: book.
- Notes:
  - Goal ladder (ch. 15): Strategic Goal, Intermediate Goals, Immediate Tactical Goals; "the Product Goal is an
    Intermediate Goal for the product; the Sprint Goal, the Immediate Tactical Goal". A key result "is an outcome for
    customers or a benefit for the company, not a deliverable." The logic model separates "What you do" (resources,
    activities, outputs) from "What changes" (outcomes, impact).
  - Two rhythms (ch. 12): "One is the rhythm of delivery ... The other is the rhythm of learning and deciding".
    "The Sprint lasts as long as the answer takes to come back, not as long as the code takes to write." An Increment
    "can be delivered as soon as it meets the Definition of Done, and a Sprint can hold several". "Each bet in the
    Sprint carries both, plus the date when the outcome measure will arrive", with a bet log.
  - Outcome against feature (ch. 11): "'New members book a class in their first week' is an outcome. 'Sports watch
    integration in March' is a feature, and it only makes sense if it serves an outcome." The story map puts the journey
    on top and cuts the first release across it (attributed to Patton, 2014, not read).
  - Spec gate (ch. 9, 5): "An item moves from discovery to delivery when it has its spec"; "the specification (the
    spec) is the refined backlog item". Discovery yields "a hypothesis with its measure", not a feature.
  - Bottom-level size (ch. 5): "each spec produces a change that can be reviewed in one sitting", sliced vertically.
  - Ownership (ch. 3, 18): "Every decision in a Sprint needs a name behind it". Flight Levels (Leopold) are
    strategic, coordination, and operational.
  - "Release Planning and the coordination board are not in the Scrum Guide, which leaves out the medium term."

## Tracker release and time-box terms (second sourcing pass)

Read raw with curl on 2026-11-16 from the vendors' server-rendered docs (Atlassian, Microsoft Learn, GitHub Docs,
GitLab Docs), so the quotes are exact. They fill the release, time-box, and close cells of the tracker mapping.
Microsoft's pages carried stray authoring text addressed to authors; it was ignored.

### E45 Jira: a version is a field and a separate object; it may span several sprints

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Atlassian, [Configure versions in a scrum space](https://support.atlassian.com/jira-software-cloud/docs/configure-versions-in-a-scrum-project/).
  Type: vendor help.
- Notes: "A version is a set of features and fixes released together as a single update to your app." Dragging work items
  into a version "helps you plan your upcoming versions, which may span multiple sprints." A version is something work
  items are assigned to, not a parent.

### E46 Jira: releases are points in time linked by the Fix versions field

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Atlassian, [Enable releases and versions](https://support.atlassian.com/jira-software-cloud/docs/enable-releases-and-versions/).
  Type: vendor help.
- Notes: "Releases represent points in time for your space." Enabling them adds "a new Fix versions field" to work
  types. "You can select more than one version", so one work item can sit in several. A version has a Driver.

### E47 Jira: releasing a version is a manual action

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Atlassian, [Release a version](https://support.atlassian.com/jira-software-cloud/docs/release-a-version-in-your-classic-project/).
  Type: vendor help.
- Notes: "select the version's current status (for example, Unreleased) and then select Release. Choose what to do with
  any unresolved work items, and enter a release date." The page lists a pre-release checklist ("code is checked in,
  reviewed, and merged; builds are passing"). No auto-release was found.

### E48 Jira: the release hub reports a version's status and warns; it does not close

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: Atlassian, [Check the release status of a version](https://support.atlassian.com/jira-software-cloud/docs/check-the-release-status-of-a-version/);
  [Check the progress of a version](https://support.atlassian.com/jira-software-cloud/docs/check-the-progress-of-a-version/).
  Type: vendor help.
- Notes: "The release hub is useful for seeing the status of a version at a point in time." It warns of items "marked as
  done but have open pull requests or unreviewed code". The release burndown shows "the estimated number of sprints
  needed to complete the remaining work".

### E49 Jira: a sprint is a time box and a field, on scrum boards only

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Atlassian, [What is a sprint?](https://support.atlassian.com/jira-software-cloud/docs/what-is-a-sprint/).
  Type: vendor help.
- Notes: "A sprint - also known as an iteration - is a short period in which the development team implements and
  delivers a discrete and potentially shippable application increment". "Only Scrum teams can use sprints." "you ...
  assign issues to sprints" and search by the Sprint field, so it is a field, not a parent.

### E50 Jira: an epic spans many sprints and closes by hand without touching its children

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: Atlassian, [What is an epic?](https://support.atlassian.com/jira-software-cloud/docs/what-is-an-epic/);
  [Manage epics in a scrum space](https://support.atlassian.com/jira-software-cloud/docs/manage-epics-in-a-scrum-project/);
  [Complete a sprint](https://support.atlassian.com/jira-software-cloud/docs/complete-a-sprint/). Type: vendor help.
- Notes: "Epics are almost always delivered over a set of sprints." Children link by the Parent field. To close:
  "change the epic's status to 'Done'. This will set the epic's Epic Status field to 'Done', but will not affect the
  epic's workflow or its Status field, and none of the epic's work items will be affected." Completing a sprint is also
  manual: an unfinished parent "will be moved to a future sprint or to the Backlog".

### E51 Jira: a cross-space release exists only in Plans and sits outside the work-item tree

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Atlassian, [How do single-space and cross-space releases differ?](https://support.atlassian.com/jira-software-cloud/docs/how-do-single-project-and-cross-project-releases-differ/).
  Type: vendor help.
- Notes: "A cross-space release lets you align and track several single-space releases as one release across different
  work streams." "Cross-space releases are only used for planning purposes inside your plan." Plans need Premium or
  Enterprise. This is a release above a release, held outside the tree.

### E52 Jira: not sourced

- Date: 2026-11-16. Status: gap. Confidence: n/a.
- Notes: whether a version auto-releases when its items are Done; the Advanced Roadmaps release pages; the version and
  epic burndown report pages; team-managed spaces, which may differ from company-managed.

### E53 Azure DevOps: iteration paths are sprints and nest "to support releases, subreleases, and sprints"

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Microsoft Learn, [Define iteration paths (sprints) and configure team iterations](https://learn.microsoft.com/en-us/azure/devops/organizations/settings/set-iteration-paths-sprints).
  Type: vendor help.
- Notes: "Iteration Paths, also known as sprints, assign work items to specific time-boxed intervals." "You can create
  a flat or hierarchical structure of iteration paths to support releases, subreleases, and sprints." Release and time
  box share one field here, so Azure DevOps binds X2 to X3 by design.

### E54 Azure DevOps: area paths hold ownership, iteration paths hold time; both are fields

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Microsoft Learn, [Area and iteration paths](https://learn.microsoft.com/en-us/azure/devops/organizations/settings/about-areas-iterations).
  Type: vendor help.
- Notes: "Area paths group work items by team, product, or feature area. Iteration paths group work into sprints,
  milestones, or other time-related periods. Both fields support hierarchical paths." Dates "aren't set by default".

### E55 Azure DevOps: the tree is Epic, Feature, Requirement, Task, with no release type

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Microsoft Learn, [About work items and work item types](https://learn.microsoft.com/en-us/azure/devops/boards/work-items/about-work-items).
  Type: vendor help.
- Notes: "Epics group Features, Features group Requirements (User Stories, Product Backlog Items, Issues, or
  Requirements), and Requirements group Tasks. You connect items across the hierarchy with parent-child links." No
  release work item type appears in the tree. Absence from the page is not proof of absence from the product.

### E56 Azure DevOps: a pipeline "release" is a deployment construct, not a planning object

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Microsoft Learn, [Classic release pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/release/).
  Type: vendor help.
- Notes: "A release is a construct that holds a versioned set of artifacts specified in a CI/CD pipeline." "A release
  can be deployed multiple times to the same stage." Deployments are gated by approvals. No link to the epic tree on
  this page.

### E57 Azure DevOps: Delivery Plans show epics and features spanning iterations

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Microsoft Learn, [Use team delivery plans](https://learn.microsoft.com/en-us/azure/devops/boards/plans/review-team-plans).
  Type: vendor help.
- Notes: "View work items spanning several iterations"; "View rollup progress of Features and Epics". Dates sit in
  start and target date fields. The Target Date field's own definition page returned a 404.

### E58 Azure DevOps: a parent can auto-close when all children complete (opt-in, Services only)

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: Microsoft Learn, [Set work item automation rules](https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/automate-work-item-state-transitions).
  Type: vendor help.
- Notes: "When all child tasks reach a completed state (such as Closed or Done), the parent work item closes
  automatically." "This feature is only available in Azure DevOps Services." Rules are set "at the team backlog
  level". The page does not say whether they reach Feature and Epic levels.

### E59 GitHub: a Release is a tag-based package, separate from milestones and issues

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: GitHub Docs, [About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases).
  Type: vendor docs.
- Notes: "Releases are based on Git tags, which mark a specific point in your repository's history." The release pages
  never mention milestones or issues.

### E60 GitHub: a milestone groups issues in one repository; progress is computed

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: GitHub Docs, [About milestones](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones);
  [Best practices for Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects).
  Type: vendor docs.
- Notes: "You can use milestones to track progress on groups of issues or pull requests in a repository." The page
  shows the due date and "completion percentage". It names no start date and never calls a milestone a release or a
  sprint. "To track how smaller issues fit into the larger goal, use milestones or labels."

### E61 GitHub: a milestone's state is set by hand or API; the percentage is computed

- Date: 2026-11-16. Status: partial. Confidence: supporting.
- Sources: GitHub Docs, [REST: Milestones](https://docs.github.com/en/rest/issues/milestones);
  [Creating and editing milestones](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/creating-and-editing-milestones-for-issues-and-pull-requests).
  Type: vendor API docs, vendor docs.
- Notes: "The state of the milestone. Either open or closed." The UI page lists create, edit, and delete only. Whether
  it auto-closes at 100% is not stated.

### E62 GitHub: an iteration is a Projects custom field, separate from the milestone

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: GitHub Docs, [About iteration fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-iteration-fields).
  Type: vendor docs.
- Notes: "You can create an iteration field to associate items with specific repeating blocks of time." Rollover is
  manual: "you can bulk-move all items from one iteration to another." Iterations are not closed. Milestone is
  built-in issue metadata; iteration is a project field.

### E63 GitHub: sub-issues form the tree; each carries its own milestone and project fields

- Date: 2026-11-16. Status: supported; the span claim is inferred. Confidence: supporting.
- Sources: GitHub Docs, [Adding sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues);
  [Parent issue and sub-issue progress fields](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-parent-issue-and-sub-issue-progress-fields).
  Type: vendor docs.
- Notes: "You can add up to 100 sub-issues per parent issue and create up to eight levels of nested sub-issues." A
  sub-issue can have its own "projects, and milestones". The "Sub-issue progress" field counts completed sub-issues.
  No source says closing the children closes the parent, so treat close as manual.

### E64 GitLab: a Release is a tag snapshot tied to one or more milestones

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: GitLab Docs, [Releases](https://docs.gitlab.com/user/project/releases/). Type: vendor docs.
- Notes: "When a release is created, GitLab automatically tags your code, archives a snapshot, and generates
  audit-ready evidence." "You can associate a release with one or more project milestones."

### E65 GitLab: a milestone can serve as a release or a time box, by convention

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: GitLab Docs, [Milestones](https://docs.gitlab.com/user/project/milestones/). Type: vendor docs.
- Notes: "Milestones can be used to track releases." "Set the milestone due date to represent the release date".
  "Support time-based planning with optional start and due dates." The docs also say to use "Milestones for Program
  Increments, which span 8-12 weeks. Iterations for Sprints, which span 2 weeks."

### E66 GitLab: a milestone has one per item, a computed percentage, and closes by date or by hand

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: GitLab Docs, [Milestones](https://docs.gitlab.com/user/project/milestones/). Type: vendor docs.
- Notes: "Every issue, epic, or merge request can be assigned one milestone." "A milestone closes after its due date.
  You can also close a milestone manually. When a milestone is closed, its open issues remain open." Percentage is
  closed work items over total.

### E67 GitLab: an iteration is a group-level time box in cadences, for issues only

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Source: GitLab Docs, [Iterations](https://docs.gitlab.com/user/group/iterations/) (Premium). Type: vendor docs.
- Notes: "An iteration in GitLab refers to a time-boxed workflow that groups issues to be worked on during a specific
  period of time, usually lasting 1-3 weeks." Iterations need start and end dates and cannot overlap in a cadence.
  "When iteration roll-over is turned on, at the end of the current iteration, all open issues are moved to the next
  iteration." The work-items page lists "Iteration (for issues)".

### E68 GitLab: an epic is the parent, spans milestones and iterations through its children

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: GitLab Docs, [Epics](https://docs.gitlab.com/user/group/epics/); [Work items](https://docs.gitlab.com/user/work_items/).
  Type: vendor docs.
- Notes: "An epic is the parent of one or more issues." Child epics are Ultimate only. "An epic can be assigned one
  group milestone. The epic's own milestone does not affect its dates." "An epic can inherit its start and due dates
  from its child items". Epics "Coordinate work across multiple iterations" and "Manage large initiatives across
  multiple milestones and issues".

### E69 GitLab: an epic closes by hand; progress is computed from its children

- Date: 2026-11-16. Status: supported. Confidence: supporting.
- Sources: GitLab Docs, [Manage epics](https://docs.gitlab.com/user/group/epics/manage_epics/);
  [Child items](https://docs.gitlab.com/user/work_items/child_items/). Type: vendor docs.
- Notes: "Close an epic": select "Close epic" or use "/close". No sentence says it closes when its children close.
  "the epic progress percentage is displayed." Epic health status is set by hand.

### E70 GitHub and GitLab: not sourced

- Date: 2026-11-16. Status: gap. Confidence: n/a.
- Notes: GitHub: a UI page for closing a milestone; auto-close at 100%; whether closing all sub-issues closes the
  parent; an explicit sentence that a parent may span milestones; a vendor link between a Release and a milestone.
  GitLab: whether closing all children closes an epic; whether an iteration closes by date or by action (inferred
  from "closed iteration" reports); the Roadmap and cadence API pages.
