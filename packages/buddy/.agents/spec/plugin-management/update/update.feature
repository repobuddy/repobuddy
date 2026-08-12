Feature: Update a plugin

  Moving listed plugins to newer versions, without changing which plugins are
  listed.

  # ── Update every plugin ──

  @behavior
  Scenario: updating with no package named updates every listed plugin
    Given a repository whose configuration lists the plugins "@repobuddy/typescript" and "@repobuddy/jest"
    And both are installed as dependencies
    When the CLI is run with the command "update" and no package name
    Then "@repobuddy/typescript" is updated
    And "@repobuddy/jest" is updated

  @behavior
  Scenario: updating with nothing listed does nothing
    Given a repository whose configuration lists no plugins
    When the CLI is run with the command "update" and no package name
    Then no dependency operation is run

  @behavior
  Scenario: a plugin that fails to update does not stop the rest
    Given a repository whose configuration lists the plugins "@repobuddy/typescript" and "@repobuddy/jest"
    And both are installed as dependencies
    And a package manager that rejects the update of "@repobuddy/typescript"
    When the CLI is run with the command "update" and no package name
    Then the output reports the failure for "@repobuddy/typescript"
    And "@repobuddy/jest" is updated

  # ── Update one plugin ──

  @behavior
  Scenario: updating a named plugin updates only that one
    Given a repository whose configuration lists the plugins "@repobuddy/typescript" and "@repobuddy/jest"
    And both are installed as dependencies
    When the CLI is run with the command "update" and the package "@repobuddy/typescript"
    Then "@repobuddy/typescript" is updated
    And "@repobuddy/jest" is not updated

  @behavior
  Scenario: a listed plugin that is not installed is reported
    Given a repository whose configuration lists the plugin "@repobuddy/typescript"
    And no installed package named "@repobuddy/typescript"
    When the CLI is run with the command "update" and the package "@repobuddy/typescript"
    Then the output reports "@repobuddy/typescript" as listed but not installed

  @behavior
  Scenario: updating never changes the configuration
    Given a repository whose configuration lists the plugin "@repobuddy/typescript"
    And "@repobuddy/typescript" is installed as a dependency
    When the CLI is run with the command "update" and the package "@repobuddy/typescript"
    Then the contents of the configuration file are unchanged
