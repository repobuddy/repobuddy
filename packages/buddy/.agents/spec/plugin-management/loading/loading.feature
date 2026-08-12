Feature: Plugin loading

  What repobuddy promises about the plugins its configuration names. The
  warning wording and the import mechanics are clibuilder's — see
  design/inherited-behavior.md.

  # ── Load the configured plugins ──

  @behavior
  Scenario: a listed plugin's commands become available
    Given an installed package "demo-plugin" exporting an activate function that registers a command "demo"
    And a configuration listing the plugin "demo-plugin"
    When the CLI is run with the command "demo"
    Then the demo command runs

  @behavior
  Scenario: a broken plugin is reported and does not stop the others
    Given an installed package "demo-plugin" exporting an activate function that registers a command "demo"
    And no installed package named "no-such-package"
    And a configuration listing the plugin "no-such-package" before the plugin "demo-plugin"
    When the CLI is run with the command "demo"
    Then the demo command runs
    And the output names "no-such-package"

  @behavior
  Scenario: a configuration naming no plugins still runs
    Given a configuration whose plugins list is empty
    When the CLI is run with no command
    Then the output names repobuddy
