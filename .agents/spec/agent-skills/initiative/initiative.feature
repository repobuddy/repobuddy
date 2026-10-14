@frozen
Feature: initiative — set a goal and its metric, name epics as shells, and promote an epic

  The skill settles an initiative's goal and one metric before naming any epic, files the epics as
  shells for epic to break down later, and promotes an epic by creating the initiative as a new parent
  above it. It never guesses a number and never closes or breaks down an epic.

  @trigger
  Scenario Outline: engages to plan an initiative or promote an epic, not to break one down
    Given a developer in a repo where epic, issue, and project-tracker are also installed
    When the developer says "<query>"
    Then initiative being selected is <should_trigger>

    Examples:
      | query                                                                 | should_trigger |
      | plan an initiative to cut CI time in half by end of Q2                | yes            |
      | set a goal and a metric for onboarding and name the epics behind it   | yes            |
      | this epic is really a goal with a number, make it an initiative       | yes            |
      | promote epic #801 to an initiative                                    | yes            |
      | break epic #801 down into child issues                                | no             |
      | demote the onboarding initiative to an epic, we dropped the metric    | no             |
      | file a bug about the webhook retries dropping the last attempt        | no             |
      | set up which tracker holds epics and which holds initiatives          | no             |

  @behavior
  Scenario: points a vulnerability to the private channel and files nothing
    Given the user asks for an initiative to fix a flaw that lets any user read another tenant's invoices
    When initiative classifies the request
    Then it points to the repository's private channel
    And it runs no search and no create

  @behavior
  Scenario: names epic for an initiative to epic change
    Given the user asks initiative to turn initiative #30 into an epic
    When initiative picks a mode
    Then it says the change belongs to the epic skill
    And it writes nothing

  @behavior
  Scenario: asks for the goal and the metric before naming any epic
    Given the user says "plan an initiative for developer onboarding"
    And the request states no goal and no metric
    When initiative starts Create
    Then its first question asks for the goal
    And it asks for a measure, a baseline, and a target before proposing any epic

  @behavior
  Scenario: suggests an epic when there is no metric
    Given the user gives the goal "make onboarding smoother" and says there is no number to track
    When initiative reaches the metric step
    Then it says an initiative needs a measure and a target
    And it suggests an epic with the goal as its outcome
    And it files nothing as an initiative

  @behavior
  Scenario: writes an unknown baseline as unmeasured and plans a baseline shell first
    Given the measure is "median CI time on main" with the target "under 10 minutes"
    And the user does not know today's value
    When initiative writes the metric
    Then the baseline reads "unmeasured", not a number
    And the first shell is titled "Measure the baseline for median CI time on main"

  @behavior
  Scenario: files shells without breaking them into issues
    Given the goal and metric are settled
    And the user names three epics with an owner and a one-line outcome each
    When initiative proposes the plan
    Then each shell has a title, a category, an owner, and an outcome
    And it proposes no child issue for any shell
    And the report says to break each shell down with epic when its work starts

  @behavior
  Scenario: flags epics that do not reach the target
    Given the shells are named
    When the user answers that finishing every shell would not reach the target
    Then initiative says the epics are not aimed at the goal
    And it asks for the missing epic or a smaller target before the confirmation

  @behavior
  Scenario: stops on a tracker that holds no initiative
    Given the routing puts initiatives on Asana, whose Tracker section holds issue and epic only
    When initiative resolves the tracker for the initiative
    Then it says Asana holds no initiative level
    And it does not file the initiative as an epic
    And it runs no search

  @behavior
  Scenario: writes nothing when the user declines the plan
    Given initiative has shown the initiative and three shells for confirmation
    When the user declines
    Then initiative runs no create, edit, link, or label command

  @behavior
  Scenario: promotes an epic by creating a new parent above it
    Given epic #801 on GitHub carries the epic label and has seven child issues
    And the routing puts initiatives on the same GitHub repository, which has no initiative label
    When the user confirms promoting #801 with a goal, a metric, and one more shell
    Then initiative creates a new issue labelled initiative, after a yes to creating the label
    And it attaches #801 as the initiative's first sub-issue
    And #801 keeps its epic label, its body, and its seven children
    And the report says #801 kept its URL

  @behavior
  Scenario: stops promoting an item that is not an epic
    Given #42 on GitHub carries neither the epic nor the initiative label
    When the user asks initiative to promote #42
    Then initiative says #42 is an issue and suggests promoting it to an epic with epic first
    And it writes nothing

  @behavior
  Scenario: ships a Validate section whose mechanical assertions pass
    Given the initiative skill as shipped in packages/buddy/skills/initiative
    When its SKILL.md is read
    Then it has a Validate section
    And the description in its frontmatter is at most 120 characters
    And its frontmatter name equals its directory name
