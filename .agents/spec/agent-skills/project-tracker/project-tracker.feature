@frozen
Feature: project-tracker — set up, show, change, and check which tracker holds each kind of work

  The skill records which tracker holds each level and category in the project's
  project-tracker.routing reference, pins each tracker to the plugin that provides it, and holds the
  policy for moving an item between trackers. It lists trackers by listing the installed
  capabilities; it never names one itself.

  # ── Use case 1 — set up ──

  @trigger
  Scenario Outline: engages to set up, show, change, or check tracker routing, not to file or comment
    Given a developer in a repo where issue and to-question are also installed
    When the developer says "<query>"
    Then project-tracker being selected is <should_trigger>

    Examples:
      | query                                                              | should_trigger |
      | set up which tracker holds bugs and which holds epics              | yes            |
      | send feature requests to a different tracker than bugs            | yes            |
      | check that my tracker routing still works                          | yes            |
      | show me where issues get filed in this project                     | yes            |
      | file a bug about the webhook retries dropping the last attempt     | no             |
      | help me word this question for the jira ticket I'll paste          | no             |
      | close issue 12 as not planned                                      | no             |
      | move issue 12 to jira                                              | no             |

  @behavior
  Scenario: lists installed capabilities by prefix and drops the fuzzier matches
    Given no project-tracker.routing exists
    And the reference search for project-tracker.capabilities returns project-tracker.capabilities.github with match prefix
    And it also returns project-tracker.contract with match description
    When project-tracker sets up the routing
    Then the trackers it offers are exactly github
    And project-tracker.contract is not among them

  @behavior
  Scenario: leaves out a capabilities reference whose contract version it does not know
    Given no project-tracker.routing exists
    And project-tracker.contract declares contract: 1
    And the installed project-tracker.capabilities.github declares contract: 1
    And the installed project-tracker.capabilities.beta declares contract: 2
    And the installed project-tracker.capabilities.epsilon has no contract in its frontmatter
    When project-tracker sets up the routing
    Then the trackers it offers are exactly github
    And it says beta and epsilon were left out because their contract versions are not known

  @behavior
  Scenario: says no capabilities are installed and writes nothing
    Given no project-tracker.routing exists
    And the reference search returns only project-tracker.contract with match description
    When project-tracker sets up the routing
    Then it says no capabilities reference is installed
    And it writes no file

  @behavior
  Scenario: pins a tracker one plugin ships as plugin/name
    Given no project-tracker.routing exists
    And the search returns the bare name project-tracker.capabilities.alpha with match prefix
    And that reference declares contract: 1
    And reference where shows that only the plugin prov-a holds it
    And the user routes every level and category to alpha and confirms the summary
    When project-tracker writes the routing
    Then every route row's Tracker cell is prov-a/project-tracker.capabilities.alpha

  @behavior
  Scenario: asks which plugin when two ship the same tracker and pins the qualified name
    Given no project-tracker.routing exists
    And the search returns prov-a/project-tracker.capabilities.alpha and prov-b/project-tracker.capabilities.alpha, both with match prefix
    When the user chooses alpha for bugs
    Then project-tracker lists both qualified names and asks which to pin
    And after the user answers prov-b it pins prov-b/project-tracker.capabilities.alpha

  @behavior
  Scenario: pins a tracker the project defines by its bare name
    Given no project-tracker.routing exists
    And the search returns project-tracker.capabilities.gamma with tier project and match prefix
    And that reference declares contract: 1
    And the user routes every level and category to gamma and confirms the summary
    When project-tracker writes the routing
    Then every route row's Tracker cell is project-tracker.capabilities.gamma
    And no Tracker cell has a plugin prefix

  @behavior
  Scenario: asks the move policy for each pair of routed trackers
    Given the user routes bugs to prov-a/project-tracker.capabilities.alpha, whose Tracker section says Visibility: public
    And the user routes epics to prov-b/project-tracker.capabilities.beta, whose Tracker section says Visibility: private
    When project-tracker asks about moves
    Then it asks the policy for moving from alpha to beta
    And it does not ask about moving from beta to alpha
    And it offers moved and mirror, with moved as the default
    And after the user answers mirror and confirms the summary the Moves table it writes has the row "prov-a/project-tracker.capabilities.alpha, prov-b/project-tracker.capabilities.beta, mirror"

  @behavior
  Scenario: refuses a move from a private tracker to a public one
    Given the user routes bugs to prov-a/project-tracker.capabilities.alpha, whose Tracker section says Visibility: public
    And the user routes epics to prov-b/project-tracker.capabilities.beta, whose Tracker section says Visibility: private
    When the user asks for a policy that moves an item from beta to alpha and then confirms the summary
    Then project-tracker refuses that pair and says a private tracker's details do not go into a public one
    And the Moves table it writes has no row whose From is prov-b/project-tracker.capabilities.beta and whose To is prov-a/project-tracker.capabilities.alpha

  @behavior
  Scenario: writes the routing only after the user confirms the summary
    Given the user has answered every question
    And project-tracker has shown the summary of routes and moves
    When the user says "yes, write it"
    Then project-tracker.routing exists in the project's .agents/references folder
    And its Routes table matches the summary

  @behavior
  Scenario: writes specific rows before the catch-all
    Given the user chooses prov-a/project-tracker.capabilities.alpha as the default tracker
    And the user routes bugs at the issue level to prov-b/project-tracker.capabilities.beta
    And the user confirms the summary
    When project-tracker writes the routing
    Then the Routes table has the row "issue, bug, prov-b/project-tracker.capabilities.beta" above the row "any, any, prov-a/project-tracker.capabilities.alpha"

  @behavior
  Scenario: writes nothing when the user declines the summary
    Given the user has answered every question
    And project-tracker has shown the summary of routes and moves
    When the user says "no, hold off"
    Then no project-tracker.routing file is written
    And it reports that nothing was written

  @behavior
  Scenario: shows an existing routing instead of overwriting it
    Given the project already has a project-tracker.routing with one route
    When the user asks project-tracker to set up the routing
    Then it shows the existing routes
    And it offers to change them
    And it writes no file

  # ── Extensions 1, 4 — the paths that cannot start ──

  @behavior
  Scenario: stops when the reference command cannot run
    Given the reference command exits with an error
    When project-tracker is asked for any mode
    Then it says the reference command is needed
    And it writes no file

  @behavior
  Scenario Outline: says no routing exists and offers set-up
    Given the project has no project-tracker.routing
    When the user asks project-tracker to <mode> the routing
    Then it says no routing exists
    And it offers to set one up
    And it writes no file

    Examples:
      | mode   |
      | show   |
      | change |
      | check  |

  # ── Use cases 2–3 — show and change ──

  @behavior
  Scenario: shows each route and move in plain words and writes nothing
    Given the project has a project-tracker.routing with the route "issue, bug, prov-a/project-tracker.capabilities.alpha"
    And the route "any, any, prov-b/project-tracker.capabilities.beta"
    And the move "prov-a/project-tracker.capabilities.alpha, prov-b/project-tracker.capabilities.beta, mirror"
    When the user asks project-tracker to show the routing
    Then each of the two routes is described as a level and category going to a tracker
    And the move is described as keeping the source open as a mirror
    And no file is written

  @behavior
  Scenario: changes one route, lists trackers again, and keeps every other route and move
    Given the project has a project-tracker.routing with the routes "issue, bug, prov-a/project-tracker.capabilities.alpha", "issue, feature, prov-a/project-tracker.capabilities.alpha", and "any, any, prov-b/project-tracker.capabilities.beta"
    And the move "prov-a/project-tracker.capabilities.alpha, prov-b/project-tracker.capabilities.beta, mirror"
    And the search returns prov-a/project-tracker.capabilities.alpha, prov-b/project-tracker.capabilities.beta, and prov-c/project-tracker.capabilities.delta, all with match prefix
    When the user asks to send bugs to delta and confirms the summary
    Then project-tracker offers delta from the search result
    And the bug route's Tracker cell becomes prov-c/project-tracker.capabilities.delta
    And the feature route and the catch-all route are unchanged
    And the move "prov-a/project-tracker.capabilities.alpha, prov-b/project-tracker.capabilities.beta, mirror" is unchanged
    And it does not ask the move policy for the pair alpha to beta, which already has a row

  # ── Use case 4 — check ──

  @behavior
  Scenario: reports a route whose capabilities reference is missing
    Given the project has a route whose Tracker cell is prov-gone/project-tracker.capabilities.alpha
    And reference show for that name exits 1 with no reference named
    When the user asks project-tracker to check the routing
    Then it reports that route as missing and names the pin
    And it suggests running change
    And it writes no file

  @behavior
  Scenario: reports a route whose tracker two plugins ship
    Given the project has a route whose Tracker cell is the bare name project-tracker.capabilities.alpha
    And reference show for that name exits 1 saying it is held by more than one plugin, and names prov-a/project-tracker.capabilities.alpha and prov-b/project-tracker.capabilities.alpha
    When the user asks project-tracker to check the routing
    Then it reports that route as ambiguous and lists both qualified names

  @behavior
  Scenario Outline: reports a route on a contract version it does not know
    Given the project has a route to prov-a/project-tracker.capabilities.alpha
    And project-tracker.contract declares contract: 1
    And that reference has <contract_state>
    When the user asks project-tracker to check the routing
    Then it reports that route with the tracker alpha and says its contract version is not known

    Examples:
      | contract_state             |
      | contract: 2 in frontmatter |
      | no contract in frontmatter |

  @behavior
  Scenario: reports a level and category that no route covers
    Given the project has only the route "issue, bug, prov-a/project-tracker.capabilities.alpha"
    And every pin resolves with a known contract version
    When the user asks project-tracker to check the routing
    Then it reports that issue with category feature matches no route
    And it does not report the routing as clean

  @behavior
  Scenario: reports every problem in one run, not only the first
    Given the project has the routes "issue, bug, prov-gone/project-tracker.capabilities.alpha" and "issue, feature, prov-a/project-tracker.capabilities.alpha"
    And the first pin resolves to no reference
    And the second pin resolves with a known contract version
    And the routes leave the epic level with no match
    When the user asks project-tracker to check the routing
    Then it reports the first route as missing
    And it reports that epic matches no route
    And it does not report the routing as clean

  @behavior
  Scenario: reports a clean routing when every route resolves
    Given the project has the route "any, any, prov-a/project-tracker.capabilities.alpha"
    And that pin resolves with a known contract version
    When the user asks project-tracker to check the routing
    Then it reports no problems

  # ── Artifact ──

  @behavior
  Scenario: ships a Validate section whose mechanical assertions pass
    Given the project-tracker skill as shipped in packages/buddy/skills/project-tracker
    When its SKILL.md is read
    Then it has a Validate section
    And the description in its frontmatter is at most 120 characters
    And its frontmatter name equals its directory name
