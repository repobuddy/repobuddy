Feature: Package manager operations

  Choosing the tool the repository actually uses, and reporting honestly when
  it fails.

  # ── Run a dependency operation ──

  @behavior
  Scenario: a declared package manager wins over the lockfile
    Given a repository whose package.json declares the package manager "yarn"
    And that repository contains a file named "pnpm-lock.yaml"
    When a dependency operation is run
    Then the operation is carried out with yarn

  @behavior
  Scenario: a pnpm lockfile selects pnpm
    Given a repository whose package.json declares no package manager
    And that repository contains a file named "pnpm-lock.yaml"
    When a dependency operation is run
    Then the operation is carried out with pnpm

  @behavior
  Scenario: a yarn lockfile selects yarn
    Given a repository whose package.json declares no package manager
    And that repository contains a file named "yarn.lock"
    When a dependency operation is run
    Then the operation is carried out with yarn

  @behavior
  Scenario: an npm lockfile selects npm
    Given a repository whose package.json declares no package manager
    And that repository contains a file named "package-lock.json"
    When a dependency operation is run
    Then the operation is carried out with npm

  @behavior
  Scenario: npm is used when nothing indicates otherwise
    Given a repository whose package.json declares no package manager
    And that repository contains no lockfile
    When a dependency operation is run
    Then the operation is carried out with npm

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
