Feature: Plugin loading

  What repobuddy does at startup with each plugin the configuration names,
  including the ones that are broken.

  # ── Load the configured plugins ──

  @behavior
  Scenario: a valid plugin's commands become available
    Given an installed package "demo-plugin" exporting an activate function that registers a command "demo"
    And a configuration listing the plugin "demo-plugin"
    When the CLI is run with the command "demo"
    Then the demo command runs

  @behavior
  Scenario: a package that is not a plugin is reported and skipped
    Given an installed package "not-a-plugin" that exports no member named "activate"
    And a configuration listing the plugin "not-a-plugin"
    When the CLI is run with no command
    Then the output contains "not a valid plugin"
    And the output contains "not-a-plugin"
    And the output lists the available commands

  @behavior
  Scenario: a plugin that cannot be imported is reported
    Given a configuration listing the plugin "no-such-package"
    And no installed package named "no-such-package"
    When the CLI is run with no command
    Then the output contains "Unable to load plugin from no-such-package"

  @behavior
  Scenario: a broken plugin does not stop the others from loading
    Given an installed package "demo-plugin" exporting an activate function that registers a command "demo"
    And no installed package named "no-such-package"
    And a configuration listing the plugin "no-such-package" before the plugin "demo-plugin"
    When the CLI is run with the command "demo"
    Then the demo command runs

  @behavior
  Scenario: a configuration naming no plugins registers no extra commands
    Given a configuration whose plugins list is empty
    When the CLI is run with no command
    Then the output lists the available commands
    And the output lists no command beyond the built-in ones
