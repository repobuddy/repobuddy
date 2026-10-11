Feature: issue — file one bug, feature, or task on the tracker

  The skill gathers the details, searches for an existing issue, confirms with the user, creates
  the issue through the tracker's capabilities reference, and reports the URL. It files at the
  issue level only and never creates a duplicate.

  # ── Use cases 1–3, 8 — engage ──

  @trigger
  Scenario Outline: engages to file one item of tracked work, not to comment or plan
    Given a developer in a repo where to-question and an epic-planning skill are also installed
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

  # ── Use cases 1–3 — file ──

  @behavior
  Scenario: searches at least twice and shows each hit before creating
    Given the user says "file a bug: the cache returns stale entries after a restart"
    And the tracker is GitHub
    When issue runs its duplicate check
    Then it searches with the full title, then with the core noun and verb
    And it lists each hit with number, title, state, and URL

  @behavior
  Scenario: stops at a confirmed duplicate
    Given a search hit the user confirms is the same issue
    When issue continues
    Then it gives the existing issue's URL
    And it creates nothing

  @behavior
  Scenario: does not create without confirmation
    Given no duplicate was found
    When issue has the details ready
    Then it summarizes title, category, type or label, and key points
    And it waits for the user's go-ahead before creating

  @behavior
  Scenario Outline: maps each category to the tracker's type on a repo with issue types
    Given a GitHub repo whose issueTypes are Bug, Feature, and Task
    And the user confirms a <category> issue
    When issue creates it
    Then it passes --type "<type>"

    Examples:
      | category | type    |
      | bug      | Bug     |
      | feature  | Feature |
      | task     | Task    |

  @behavior
  Scenario: falls back to labels on a repo without issue types
    Given a GitHub repo whose issueTypes is null
    And the repo has the labels bug and enhancement
    When issue creates a confirmed feature
    Then it passes --label enhancement
    And it does not pass --type

  @behavior
  Scenario: collects environment details for a bug from the machine
    Given the user reports a bug in a package with a Node toolchain
    When issue gathers details
    Then it reads OS, runtime, and package versions itself
    And it does not ask the user for them

  @rubric
  Scenario: the body fits the category
    Given a confirmed task "migrate the build to tsdown"
    When issue writes the body
    Then the body has a description and a done-when, and no steps-to-reproduce section
    # rubric: threshold 7 of 9
    #   3 — states what done looks like, concretely
    #   3 — leaves out sections that do not apply to a task
    #   3 — omits internal file names, commit SHAs, and private-tracker details

  # ── Use cases 6–7 — hosts ──

  @behavior
  Scenario: refuses a host with no tracker set up
    Given the origin remote is bitbucket.org
    When issue resolves the tracker
    Then it says no tracker is set up for that host
    And it files nothing anywhere

  @behavior
  Scenario: files on GitLab through the fallback
    Given the origin remote is gitlab.com and no GitLab capabilities reference exists
    When the user confirms a bug
    Then issue uses glab issue create with the label bug if the repo has it

  # ── Use case 8 and the boundaries ──

  @behavior
  Scenario: suggests another level for an oversized item and still files at issue level
    Given the user asks for one issue covering five independently shippable features
    When issue shows its confirmation
    Then it says the item looks too big for one issue and suggests an epic
    And it files one issue if the user does not change the level

  @behavior
  Scenario: does not file a vulnerability publicly
    Given the user describes an unauthenticated remote code execution in the package
    When issue classifies the request
    Then it points to the repository's private security channel
    And it creates no issue
