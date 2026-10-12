Feature: issue — file one bug, feature, or task on the tracker

  The skill gathers the details, searches for an existing issue, confirms with the user, creates
  the issue through the tracker's capabilities reference, and reports the URL. It files at the
  issue level only and never creates a duplicate.

  # ── Use cases 1–4 — file an item ──

  @trigger
  Scenario Outline: engages to file one item of tracked work, not to comment or plan
    Given a developer in a repo where to-question and community-post are also installed
    When the developer says "<query>"
    Then issue being selected is <should_trigger>

    Examples:
      | query                                                            | should_trigger |
      | file a bug about the webhook retries dropping the last attempt   | yes            |
      | open a feature request for dark mode                             | yes            |
      | create a ticket to migrate the build to tsdown                   | yes            |
      | add a task to track the node 26 upgrade                          | yes            |
      | report this crash upstream on github                             | yes            |
      | help me word this question for the jira ticket I'll paste        | no             |
      | write up a slack ping, I'm blocked on the staging role           | no             |
      | break this project into an epic with child issues                | no             |
      | close issue 12 as not planned                                    | no             |

  @behavior
  Scenario: files an ordinary defect instead of treating it as a vulnerability
    Given the user reports that the cache returns stale entries after a restart
    And the report describes no way to read or change data the user is not allowed to
    When issue classifies the request
    Then it continues to gather details and search
    And it does not point to a private security channel

  @behavior
  Scenario Outline: maps each category to the tracker's type on a repo with issue types
    Given the origin remote is github.com
    And the repo's issueTypes are Bug, Feature, and Task
    And the user confirms a <category> issue
    When issue creates it
    Then it passes --type "<type>"

    Examples:
      | category | type    |
      | bug      | Bug     |
      | feature  | Feature |
      | task     | Task    |

  @behavior
  Scenario: collects environment details for a bug from the machine
    Given the user reports a bug in a package with a Node toolchain
    When issue gathers details
    Then it reads OS, runtime, and package versions itself
    And it does not ask the user for them

  @behavior
  Scenario: searches at least twice and shows each hit before creating
    Given the user says "file a bug: the cache returns stale entries after a restart"
    And the origin remote is github.com
    And the first search returns two issues the user does not call the same
    When issue runs its duplicate check
    Then it searches again with the core noun and verb instead of the full title
    And it lists each hit with number, title, state, and URL

  @behavior
  Scenario: adds no level suggestion to an item that fits one issue
    Given the user asks for one issue about a retry limit that one person can ship in one pull request
    When issue shows its confirmation
    Then the confirmation contains no suggestion to file at another level

  @behavior
  Scenario: creates only after the summary is confirmed
    Given no search hit is the user's issue
    And issue has shown the summary
    When the user says "yes, file it"
    Then issue creates the issue
    And it reports the new issue's URL

  @behavior
  Scenario: falls back to labels on a repo without issue types
    Given the origin remote is github.com
    And the repo's issueTypes is null
    And the repo has the labels bug and enhancement
    When issue creates a confirmed feature
    Then it passes --label enhancement
    And it does not pass --type

  @quality @rubric
  Scenario: writes a task body whose end state and scope can be checked
    Given the user confirms a task "migrate the build to tsdown" in a public repo
    And the user says the build runs on webpack today and CI must stay under ten minutes
    When issue writes the body
    Then the body is graded:
      """
      dimensions:
        end_state_checkability: 3  # a reader can tell from the body alone whether the task is
                                   # finished, by a stated check rather than "the migration is done"
        scope_statement: 3         # the body names what moves from what to what, and what stays
                                   # untouched, so two readers would not scope it differently
      threshold: 5
      """
    And the body scores at or above the threshold

  @behavior
  Scenario: keeps a commit SHA and an internal tracker address out of a public issue body
    Given the repo is public
    And the user confirms a task "migrate the build to tsdown"
    And the user's request cites commit 9f2c1ab and an internal tracker item at tracker.internal.example/ENG-41
    When issue writes the body
    Then the body does not contain 9f2c1ab
    And the body does not contain tracker.internal.example

  @behavior
  Scenario: leaves bug-only sections out of a task body
    Given the user confirms a task "migrate the build to tsdown"
    When issue writes the body
    Then the body has no Steps to Reproduce heading
    And the body has no Expected Behavior heading

  @behavior
  Scenario: ships a Validate section whose mechanical assertions pass
    Given the issue skill as shipped in packages/buddy/skills/issue
    When its SKILL.md is read
    Then it has a Validate section
    And the description in its frontmatter is at most 120 characters
    And its frontmatter name equals its directory name
    And its capabilities reference is byte-identical to the copy in packages/buddy/references

  @behavior
  Scenario: lists the capabilities references and loads the one that matches the host
    Given the origin remote is github.com
    And exactly one reference named project-tracker.capabilities.github is installed
    And a fuzzier search hit named project-tracker.routing is also returned
    When issue resolves the tracker
    Then it loads project-tracker.capabilities.github
    And it does not load project-tracker.routing

  @behavior
  Scenario: reads the bundled GitHub reference when the reference command cannot run
    Given the origin remote is github.com
    And the reference command exits with an error
    When issue resolves the tracker
    Then it reads references/project-tracker.capabilities.github.md in its own folder

  @behavior
  Scenario: writes a bug body with steps, expected, and actual behavior
    Given the user confirms a bug "cache returns stale entries after a restart"
    And the user says a restart then a read returns the pre-restart value instead of the new one
    When issue writes the body
    Then the body has a Steps to Reproduce section
    And the body has an Expected Behavior section
    And the body has an Actual Behavior section

  @behavior
  Scenario: writes a feature body with the need and use cases, and no bug sections
    Given the user confirms a feature "export the report as CSV"
    When issue writes the body
    Then the body has a Use Cases section
    And the body has no Steps to Reproduce heading

  @behavior
  Scenario: omits the label when the repo does not have it
    Given the origin remote is github.com
    And the repo's issueTypes is null
    And the repo has no label named enhancement
    When issue creates a confirmed feature
    Then the create command has no --label option
    And the create command has no --type option

  @behavior
  Scenario: files on GitLab through the fallback
    Given the origin remote is gitlab.com
    And no GitLab capabilities reference is installed
    And the repo has the label bug
    When the user confirms a bug
    Then issue runs glab issue create with --label bug

  # ── Extensions 5–12 — the paths that do not file ──

  @behavior
  Scenario: stops with an upgrade message when gh is older than 2.98.0
    Given the origin remote is github.com
    And gh --version reports 2.97.0
    When issue resolves the tracker
    Then it tells the user to upgrade gh
    And it runs no create command

  @behavior
  Scenario: asks which capabilities reference to use when two match
    Given the origin remote is github.com
    And two plugins each ship project-tracker.capabilities.github
    When issue resolves the tracker
    Then it lists both qualified names and asks which to use
    And it loads neither before the user answers

  @behavior
  Scenario: asks for the category when the request does not give one
    Given the user says "file this" and gives no word that says bug, feature, or task
    When issue gathers the details
    Then it asks which category the item is
    And it runs no search before the user answers

  @behavior
  Scenario: stops at a confirmed duplicate
    Given a search hit the user confirms is the same issue
    When issue continues
    Then it gives the existing issue's URL
    And it creates nothing

  @behavior
  Scenario: creates nothing when the user declines
    Given no search hit is the user's issue
    And issue has shown the summary
    When the user says "no, hold off"
    Then issue runs no create command
    And it reports that nothing was filed

  @behavior
  Scenario: does not file a vulnerability publicly
    Given the user describes an unauthenticated remote code execution in the package
    When issue classifies the request
    Then it points to the repository's private security channel
    And it runs no create command

  @behavior
  Scenario: refuses a host with no tracker set up
    Given the origin remote is bitbucket.org
    When issue resolves the tracker
    Then it says no tracker is set up for that host
    And it runs no create command

  @behavior
  Scenario: suggests another level for an oversized item and still files at issue level
    Given the user asks for one issue covering five independently shippable features
    When issue shows its confirmation
    Then it says the item looks too big for one issue and suggests an epic
    And it files one issue if the user does not change the level

  @behavior
  Scenario: suggests not tracking an item too small for an issue
    Given the user asks for an issue to fix a one-character typo in a code comment
    When issue shows its confirmation
    Then it says the item looks too small to track as an issue
    And it files one issue if the user does not change the level
