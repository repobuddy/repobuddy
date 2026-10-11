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
  Scenario: writes a task body that fits the category and keeps private details out
    Given the user confirms a task "migrate the build to tsdown" in a public repo
    And the user's request cites commit 9f2c1ab and an internal tracker item at tracker.internal.example/ENG-41
    When issue writes the body
    Then the body is graded:
      """
      dimensions:
        done_when: 3          # the body states what done looks like as a checkable end state, not
                              # as "the migration is finished"
        category_fit: 3       # the body has no steps-to-reproduce, expected, or actual section
        public_safety: 3      # neither the commit SHA nor the internal tracker address appears
      threshold: 7
      """
    And the body scores at or above the threshold

  @behavior
  Scenario: files on GitLab through the fallback
    Given the origin remote is gitlab.com
    And no GitLab capabilities reference is installed
    And the repo has the label bug
    When the user confirms a bug
    Then issue runs glab issue create with --label bug

  # ── Extensions 5–9 — the paths that do not file ──

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
