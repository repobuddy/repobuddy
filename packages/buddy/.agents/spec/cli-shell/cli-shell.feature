Feature: CLI shell

  What repobuddy itself promises about starting up. The parsing and dispatch
  that follows is clibuilder's — see design/inherited-behavior.md.

  # ── Start the CLI ──

  @behavior
  Scenario: bd and buddy start the same program
    Given the repobuddy package is installed
    When the CLI is run through the bd executable with no command
    And the CLI is run through the buddy executable with no command
    Then both runs produce the same output

  @behavior
  Scenario: running the CLI with no command prints usage rather than failing
    Given the repobuddy CLI
    When it is run with no command and no options
    Then the output names repobuddy

  # ── Report the version ──

  @behavior
  Scenario: the version flag prints this package's version
    Given the repobuddy CLI
    When it is run with the --version flag and no command
    Then the output is the version recorded in this package's manifest
