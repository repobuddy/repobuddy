Feature: Test scripts

  Putting the `test`, `coverage`, and `test:watch` scripts a repository runs its
  tests with into its manifest, matching the runner it uses, without clobbering a
  script the repository customized.

  # ── Set the test scripts ──

  @behavior
  Scenario: the command fails when there is no manifest to adjust
    Given a directory containing no "package.json"
    When the CLI is run with the command "test-scripts"
    Then the command fails
    And the output names the directory it looked in

  @behavior
  Scenario: a project using jest gets the jest scripts
    Given a repository whose manifest depends on "jest"
    When the CLI is run with the command "test-scripts"
    Then the "test" script is "jest"
    And the "coverage" script is "jest --coverage"
    And the "test:watch" script is "jest --watch"

  @behavior
  Scenario: the preset for a runner counts as depending on that runner
    Given a repository whose manifest depends on "@repobuddy/vitest" and on no runner directly
    When the CLI is run with the command "test-scripts"
    Then the "test" script is "vitest run"

  @behavior
  Scenario: the command fails when no runner can be found
    Given a repository whose manifest depends on neither jest nor vitest
    When the CLI is run with the command "test-scripts"
    Then the command fails
    And the output offers to take the runner as an option

  @behavior
  Scenario: the command fails when both runners are present
    Given a repository whose manifest depends on both "jest" and "vitest"
    When the CLI is run with the command "test-scripts"
    Then the command fails
    And the output names both runners it found

  @behavior
  Scenario: a named runner settles which scripts are written
    Given a repository whose manifest depends on both "jest" and "vitest"
    When the CLI is run with the command "test-scripts" naming the runner "vitest"
    Then the command succeeds
    And the "test" script is "vitest run"

  @behavior
  Scenario: a missing script is added
    Given a repository whose manifest depends on "jest" and has no "coverage" script
    When the CLI is run with the command "test-scripts"
    Then the manifest has a "coverage" script
    And the output reports "coverage" as added

  @behavior
  Scenario: scripts the command does not manage are left as they are
    Given a repository whose manifest depends on "jest" and has a "build" script
    When the CLI is run with the command "test-scripts"
    Then the "build" script is unchanged

  @behavior
  Scenario: scripts left from another runner are adjusted
    Given a repository whose manifest depends on "vitest"
    And whose "test" script is "jest"
    When the CLI is run with the command "test-scripts"
    Then the "test" script is "vitest run"
    And the output reports "test" as adjusted

  @behavior
  Scenario: a customized script is skipped and left alone
    Given a repository whose manifest depends on "jest"
    And whose "test" script is a command the repository wrote itself
    When the CLI is run with the command "test-scripts"
    Then the "test" script still holds what the repository wrote
    And the output reports "test" as skipped

  @behavior
  Scenario: running test-scripts twice leaves the same manifest
    Given a repository whose manifest depends on "jest"
    When the CLI is run with the command "test-scripts"
    And the CLI is run with the command "test-scripts" a second time
    Then the contents of the manifest after the second run match the contents after the first
