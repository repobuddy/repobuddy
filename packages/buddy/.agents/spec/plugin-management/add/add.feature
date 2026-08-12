Feature: Add a plugin

  Installing a plugin and switching it on, in one command.

  # ── Add a plugin ──

  @behavior
  Scenario: adding a plugin installs it and lists it
    Given a repository whose configuration lists no plugins
    When the CLI is run with the command "add" and the package "@repobuddy/typescript"
    Then "@repobuddy/typescript" is installed as a dependency
    And the "plugins" list in the configuration contains "@repobuddy/typescript"

  @behavior
  Scenario: adding a plugin already listed does not list it twice
    Given a repository whose configuration lists the plugin "@repobuddy/typescript"
    When the CLI is run with the command "add" and the package "@repobuddy/typescript"
    Then the "plugins" list in the configuration contains "@repobuddy/typescript" exactly once

  @behavior
  Scenario: a failed install lists nothing
    Given a repository whose configuration lists no plugins
    And a package manager that rejects the install of "no-such-package"
    When the CLI is run with the command "add" and the package "no-such-package"
    Then the output reports the failure
    And the "plugins" list in the configuration is empty

  @behavior
  Scenario: adding a plugin to an uninitialized repository creates the configuration
    Given a repository containing no file with an accepted configuration name
    When the CLI is run with the command "add" and the package "@repobuddy/typescript"
    Then the repository contains a file named ".repobuddy.json"
    And the "plugins" list in the configuration contains "@repobuddy/typescript"

  @behavior
  Scenario: a bare name is installed literally rather than expanded
    Given a repository whose configuration lists no plugins
    When the CLI is run with the command "add" and the package "typescript"
    Then "typescript" is installed as a dependency
    And "@repobuddy/typescript" is not installed as a dependency
    And the "plugins" list in the configuration contains "typescript"
