Feature: Package manager operations

  Running dependency operations through whichever package manager the
  repository uses. Which tool that is, and what its commands are called, is
  package-manager-detector's job — see design/decisions/0001.

  # ── Run a dependency operation ──

  @behavior
  Scenario: an operation runs through the repository's own package manager
    Given a repository whose package.json declares the package manager "pnpm"
    When a dependency operation is run
    Then the operation is carried out with pnpm
    And npm is not invoked

  @behavior
  Scenario: a successful operation is reported
    Given a repository using npm
    When a dependency operation is run and the tool exits successfully
    Then the output reports the operation as succeeded

  @behavior
  Scenario: a failed operation is reported and changes nothing else
    Given a repository using npm
    And a configuration listing the plugin "already-listed"
    When a dependency operation is run and the tool exits with a failure
    Then the output reports the failure
    And the "plugins" list in the configuration still contains exactly "already-listed"
