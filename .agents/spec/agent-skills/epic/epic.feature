@frozen
Feature: epic — plan an epic and its children, and move work into the epic level

  The skill settles an epic's outcome before its children, files the epic and each child after one
  confirmation, and changes an issue or an initiative into an epic in place or by a move between
  trackers. How a level changes comes from the tracker's capabilities reference; the guards do not.

  @trigger
  Scenario Outline: engages to plan an epic or move work into the epic level, not to file one issue
    Given a developer in a repo where issue, project-tracker, and to-question are also installed
    When the developer says "<query>"
    Then epic being selected is <should_trigger>

    Examples:
      | query                                                            | should_trigger |
      | break this project into an epic with child issues                | yes            |
      | plan the sso rollout as an epic                                  | yes            |
      | this issue is bigger than we thought, make it an epic            | yes            |
      | demote the onboarding initiative to an epic, we dropped the metric | yes          |
      | file a bug about the webhook retries dropping the last attempt   | no             |
      | set up which tracker holds bugs and which holds epics            | no             |
      | help me word this question for the jira ticket I'll paste        | no             |
      | close issue 12 as not planned                                    | no             |

  @behavior
  Scenario: points a vulnerability to the private channel and files nothing
    Given the user asks to plan an epic to fix a flaw that lets any user read another tenant's invoices
    When epic classifies the request
    Then it points to the repository's private channel
    And it runs no search and no create

  @behavior
  Scenario: names the owning skill for a level change out of the epic level
    Given the user asks to turn epic #40 into a plain issue
    When epic picks a mode
    Then it says the change belongs to the issue skill
    And it writes nothing

  @behavior
  Scenario: asks for the outcome and done-when before naming any child
    Given the user says "plan an epic for the billing rewrite"
    And the request states no outcome
    When epic starts Create
    Then its first question asks for the outcome and how anyone will know it is done
    And it proposes no child issue before both are answered

  @behavior
  Scenario: files an unknown as a spike child, not a guess
    Given the outcome and done-when are settled
    And whether the payment provider supports partial refunds is not known
    When epic audits the scope for gaps and breaks it down
    Then the breakdown has a child task titled "Spike: " followed by the refund question
    And that spike is ordered before the children that depend on its answer
    And no other child assumes an answer to it

  @behavior
  Scenario: stops when the epic level has no route
    Given the project has the route "issue, any, repobuddy/project-tracker.capabilities.github" and no other
    When epic resolves the tracker for an epic of category feature
    Then it names epic and feature as the unrouted pair
    And it suggests project-tracker change
    And it runs no search

  @behavior
  Scenario: attaches an existing item instead of filing a duplicate child
    Given the breakdown has a child titled "Add the refund webhook"
    And the search finds open issue #51 "Refund webhook" and the user says it is that child
    When epic confirms and files the plan
    Then #51 is attached to the epic as a child
    And no new issue is created for that child
    And #51 is not closed

  @behavior
  Scenario: breaks down a shell epic instead of filing a second one
    Given epic #60 on GitHub has an Outcome section and no children, filed as a shell under an initiative
    And the search finds #60 and the user says it is the epic
    When epic confirms and files the plan
    Then it creates no new epic
    And each new child is created with #60 as its parent
    And #60 stays under its initiative

  @behavior
  Scenario: writes nothing when the user declines the plan
    Given epic has shown the epic and three children for confirmation
    When the user declines
    Then epic runs no create, edit, link, or close command

  @behavior
  Scenario: creates a missing level label only on a yes
    Given the GitHub repository has no epic label
    When epic shows the plan for confirmation
    Then the confirmation names the epic label as missing and to be created
    And gh label create runs only after the user says yes to it

  @behavior
  Scenario: checks for a stray child before filing the next one
    Given the epic is filed and the second child's gh issue create exits non-zero
    And the newest issues show that child was created anyway
    When epic continues the batch
    Then it does not create the second child again
    And it uses the stray issue as the second child

  @behavior
  Scenario: promotes an issue in place and moves its criteria into a first child
    Given issue #42 on GitHub has a Done when section with three criteria
    And the routing puts epics of #42's category on the same GitHub tracker
    When the user confirms promoting #42
    Then epic adds the epic label to #42 instead of creating a new epic
    And the first child it creates carries the three criteria
    And it reports that the epic kept #42's URL

  @behavior
  Scenario: stops promoting an item that is not an issue
    Given #40 on GitHub carries the epic label
    When the user asks epic to promote #40
    Then epic says #40 is already an epic
    And it writes nothing

  @behavior
  Scenario: moves a promoted issue to the tracker that holds epics
    Given issue #42 is on a public GitHub repository
    And the routing puts epics on a private Asana tracker with no Moves row for that pair
    When the user confirms promoting #42
    Then epic creates the epic in Asana with a link back to #42
    And it comments on #42 that the work is tracked internally, with no Asana title or URL
    And it closes #42 as not planned with that comment, because no row means moved

  @behavior
  Scenario: stops a move from a private tracker to a public one
    Given a task is on a private Asana tracker
    And the routing puts epics on a public GitHub repository
    When the user asks epic to promote the task
    Then epic says a private tracker's details never go into a public one
    And it writes nothing

  @behavior
  Scenario: warns the metric is dropped and asks about each child epic
    Given initiative #30 on GitHub has a Metric section and child epics #31 and #32
    When the user asks epic to demote #30
    Then epic quotes the metric and says an epic drops it
    And it asks about #31 and about #32 separately before the confirmation

  @behavior
  Scenario: stops demoting on a tracker that holds no initiative
    Given the routing puts initiatives on Asana, whose Tracker section holds issue and epic only
    When the user asks epic to demote an Asana initiative
    Then epic says Asana holds no initiative level
    And it writes nothing

  @behavior
  Scenario: leaves a child epic attached when it should become an issue
    Given epic is demoting initiative #30 with child epic #31
    When the user says #31 should become an issue
    Then epic says that change belongs to the issue skill
    And #31 stays attached to #30 and is not closed

  @behavior
  Scenario: reports every child and what happened to it
    Given epic filed an epic with two new children and one attached existing issue
    When it reports
    Then the report gives the epic's URL and each child's URL in order
    And it marks the attached issue as attached

  @behavior
  Scenario: ships a Validate section whose mechanical assertions pass
    Given the epic skill as shipped in packages/buddy/skills/epic
    When its SKILL.md is read
    Then it has a Validate section
    And the description in its frontmatter is at most 120 characters
    And its frontmatter name equals its directory name
