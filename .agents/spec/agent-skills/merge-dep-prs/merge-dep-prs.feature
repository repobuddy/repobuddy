@frozen
Feature: merge-dep-prs — gate the merge on verification reach covering blast radius

  The merge condition is that verification reach covers blast radius, not that CI is green.
  A green check is evidence about what CI executed and about nothing else.

  The gate runs between sorting pull requests by CI status and merging them: detect a
  consumed artifact by path, name what CI actually reached, enumerate the consumers when
  reach falls short, and record one explicit decision.

  This suite covers the merge gate only. Classification, CI triage, the fix recipes,
  changesets and closing obsolete pull requests are not specified here.

  # ── UC-1 — gate a dependency pull request before merging it ──

  @behavior
  Scenario: inspects the diff for consumed artifacts before it merges anything
    Given an agent following the merge-dep-prs skill
    And a dependency pull request whose checks have all passed
    And the agent has just sorted that pull request into the passing group
    When the agent takes its next action on that pull request
    Then it reads the pull request's diff for a consumed artifact
    And it issues no merge command before reading that diff

  @behavior
  Scenario: merges without enumerating consumers when nothing consumed is touched
    Given a dependency pull request that raises the pinned version of a test-runner devDependency
    And the diff touches one package.json and one lockfile
    And the repository publishes no package, workflow, action or image
    When the agent runs the gate on that pull request
    Then it reports the gate as satisfied
    And it merges the pull request
    And it produces no consumer list

  @behavior
  Scenario Outline: detects a consumed artifact by path
    Given a dependency pull request whose diff touches <path>
    And <path> is <consumed_by>
    When the agent runs the first move of the gate
    Then it reports the pull request as touching a consumed artifact

    Examples:
      | path                          | consumed_by                                          |
      | .github/workflows/release.yml | a workflow declaring on: workflow_call               |
      | action.yml                    | a composite action other repositories reference      |
      | packages/preset/src           | the source of a package published to the npm registry |
      | Dockerfile                    | the definition of an image pushed to a registry      |
      | packages/config               | a workspace package two other packages depend on     |

  @behavior
  Scenario: merges when the full suite already covers the changed artifact
    Given a dependency pull request that changes a published package in a monorepo
    And the CI workflow runs `pnpm turbo run test` with no filter argument
    And every job in the workflow ran on this pull request
    When the agent runs the gate on that pull request
    Then it reports verification reach as covering blast radius
    And it merges the pull request

  @behavior
  Scenario: treats a repository with no test suite as zero reach, not zero risk
    Given an organisation `.github` repository holding a reusable release workflow
    And the repository has no test script and no test job
    And eighteen repositories in the organisation call that workflow
    And a dependency pull request bumps a pinned action inside that workflow to a new major
    And every check on the pull request has passed
    When the agent runs the gate on that pull request
    Then it reports verification reach as zero
    And it reports blast radius as the eighteen repositories that call the workflow
    And it does not merge the pull request on the strength of the passing checks

  @behavior
  Scenario: treats affected-only test selection as reach falling short
    Given a monorepo whose CI runs `turbo run test --filter=...[origin/main]`
    And a dependency pull request that changes a workspace package two other packages depend on
    And every check on the pull request has passed
    When the agent runs the second move of the gate
    Then it reports the affected-only selection as a reason reach falls short of radius
    And it continues to the consumer enumeration

  @behavior
  Scenario: treats a skipped path-filtered job as unverified, not as passed
    Given a repository whose integration-test job declares a `paths:` filter on the src directory
    And a dependency pull request that changes only files outside that filter
    And the integration-test job reports the status skipped
    When the agent runs the second move of the gate
    Then it reports the skipped job as work CI did not run
    And it does not count the skipped job as a passing check

  @behavior
  Scenario: does not key the gate on the bump's version class
    Given a dependency pull request that raises a pinned action from 3.1.0 to 3.1.1
    And the action is called by a reusable workflow that other repositories consume
    And the patch release added a check that refuses the caller's toolchain version
    When the agent runs the gate on that pull request
    Then it runs the consumer enumeration
    And it does not report the patch version class as a reason to skip the gate

  # ── UC-2 — enumerate the consumers and decide ──

  @behavior
  Scenario: enumerates cross-repo consumers by looping the org repo list
    Given a reusable workflow in an organisation `.github` repository
    And the agent has established that verification reach does not cover blast radius
    When the agent enumerates the consumers
    Then it lists the organisation's non-archived repositories
    And it reads each listed repository's workflow files for a reference to the changed workflow
    And it reports the repositories whose workflow files carry that reference

  @behavior
  Scenario: enumerates in-repo consumers by running the full graph and hunting unmodelled edges
    Given a monorepo whose CI selects tests by the affected set
    And a dependency pull request that changes a workspace package
    And a second package reads that package's config file at run time
    When the agent enumerates the consumers
    Then it runs the repository's test task over the full graph with no filter argument
    And it reports the run-time config load as an edge the affected-set selector does not carry

  @behavior
  Scenario Outline: checks what each consumer resolves against what the new artifact requires
    Given the agent has enumerated <consumers> as consumers of the changed artifact
    And the changed artifact requires <requirement>
    When the agent takes its next action on that consumer list
    Then it reads what each enumerated consumer resolves for <requirement>
    And it reports which enumerated consumers resolve something the changed artifact refuses

    Examples:
      | consumers                                                | requirement                                 |
      | eighteen repositories calling the changed workflow       | release-tool CLI major version 3            |
      | two workspace packages importing the changed package     | the peer range the changed package declares |

  @behavior
  Scenario: does not treat the consumer list as the resolution check
    Given the agent has enumerated the consumers of a changed reusable workflow
    And the agent has read nothing from any enumerated consumer
    When the agent decides what to do with the pull request
    Then it does not record a hold or a merge decision
    And it reads what each enumerated consumer resolves first

  @behavior
  Scenario: holds the merge and names what would unblock it
    Given the agent has checked every enumerated consumer
    And sixteen of them resolve a toolchain version the new artifact refuses
    And none of the twenty-five has been migrated
    When the agent decides what to do with the pull request
    Then it holds the merge
    And it names migrating the listed consumers as what would unblock the merge

  @behavior
  Scenario: merges and immediately opens the follow-ups or files the consumer list
    Given the agent has checked every enumerated consumer
    And three of them need a one-line input rename to keep working
    And the agent has permission to open pull requests against those three repositories
    When the agent decides what to do with the pull request
    Then it merges the pull request
    And it opens a follow-up pull request against each of the three consumers, or files the consumer list as an issue

  @behavior
  Scenario: does not accept gh search code as the consumer enumeration
    Given a reusable workflow consumed by thirty repositories in one organisation
    And the agent has established that verification reach does not cover blast radius
    When the agent chooses how to enumerate the consumers
    Then it reports `gh search code` as unreliable for this because it misses organisation-internal matches
    And it does not report a `gh search code` result as the consumer list

  @behavior
  Scenario: does not fall through to merge-on-green while reach is short of radius
    Given a dependency pull request whose checks have all passed
    And the agent has established that verification reach does not cover blast radius
    And no consumer has been enumerated
    And no reviewer has commented on the pull request
    When the agent reaches the merge step
    Then it does not merge the pull request
    And it reports the absence of comments as no evidence about the consumers
    And it records either a hold or a merge-with-follow-ups decision
