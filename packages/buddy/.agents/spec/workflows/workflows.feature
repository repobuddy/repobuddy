Feature: Workflows

  Whole paths across capabilities. Each scenario asserts a seam — something
  no single capability node can establish on its own.

  # ── Set a fresh repository up ──

  @behavior
  Scenario: a plugin added to a fresh repository is usable on the next run
    Given a repository containing no file with an accepted configuration name
    And a publishable package "demo-plugin" whose activate registers a command "demo"
    When the CLI is run with the command "add" and the package "demo-plugin"
    And the CLI is run again with the command "demo"
    Then the demo command runs

  @behavior
  Scenario: a repository initialized and then added to loads the plugin
    Given a repository containing no file with an accepted configuration name
    And a publishable package "demo-plugin" whose activate registers a command "demo"
    When the CLI is run with the command "init"
    And the CLI is run with the command "add" and the package "demo-plugin"
    And the CLI is run again with the command "demo"
    Then the demo command runs

  # ── Adopt repobuddy where plugins are already installed ──

  @behavior
  Scenario: init makes an already-installed plugin usable without naming it
    Given a repository containing no file with an accepted configuration name
    And an installed package "demo-plugin" declaring the keyword "repobuddy"
    And that package's activate registers a command "demo"
    When the CLI is run with the command "init"
    And the CLI is run again with the command "demo"
    Then the demo command runs

  # ── Retire a plugin ──

  @behavior
  Scenario: a removed plugin's commands are gone on the next run
    Given a repository whose configuration lists the plugin "demo-plugin"
    And "demo-plugin" is installed and registers a command "demo"
    When the CLI is run with the command "remove" and the package "demo-plugin"
    And the CLI is run again with the command "demo"
    Then the output contains the usage line for repobuddy

  @behavior
  Scenario: a plugin listed at the repository root works from a subdirectory
    Given a repository whose root holds a ".repobuddy.json" listing the plugin "demo-plugin"
    And "demo-plugin" is installed and registers a command "demo"
    And an empty subdirectory two levels below the root
    When the CLI is run from that subdirectory with the command "demo"
    Then the demo command runs
