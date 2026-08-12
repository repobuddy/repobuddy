Feature: Remove a plugin

  Dropping a plugin the repository no longer wants.

  # ── Remove a plugin ──

  @behavior
  Scenario: removing a plugin unlists it and uninstalls it
    Given a repository whose configuration lists the plugin "@repobuddy/typescript"
    And "@repobuddy/typescript" is installed as a dependency
    When the CLI is run with the command "remove" and the package "@repobuddy/typescript"
    Then the "plugins" list in the configuration does not contain "@repobuddy/typescript"
    And "@repobuddy/typescript" is not installed as a dependency

  @behavior
  Scenario: removing something the repository does not have reports nothing to do
    Given a repository whose configuration lists no plugins
    And no installed package named "@repobuddy/typescript"
    When the CLI is run with the command "remove" and the package "@repobuddy/typescript"
    Then the output reports that there was nothing to do
    And the "plugins" list in the configuration is empty

  @behavior
  Scenario: removing an installed but unlisted package uninstalls it
    Given a repository whose configuration lists no plugins
    And "@repobuddy/typescript" is installed as a dependency
    When the CLI is run with the command "remove" and the package "@repobuddy/typescript"
    Then "@repobuddy/typescript" is not installed as a dependency

  @behavior
  Scenario: a failed uninstall still leaves the plugin unlisted
    Given a repository whose configuration lists the plugin "@repobuddy/typescript"
    And a package manager that rejects the uninstall of "@repobuddy/typescript"
    When the CLI is run with the command "remove" and the package "@repobuddy/typescript"
    Then the output reports the failure
    And the "plugins" list in the configuration does not contain "@repobuddy/typescript"
