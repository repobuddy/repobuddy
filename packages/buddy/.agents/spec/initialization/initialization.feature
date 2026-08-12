Feature: Initialization

  Setting a repository up to use repobuddy, in a way that is safe to run
  again.

  # ── Initialize the repository ──

  @behavior
  Scenario: init creates a configuration where there was none
    Given a repository containing no file with an accepted configuration name
    When the CLI is run with the command "init"
    Then the repository contains a file named ".repobuddy.json"
    And that file has a "plugins" list

  @behavior
  Scenario: init keeps the plugins an existing configuration lists
    Given a repository whose ".repobuddy.json" lists the plugin "already-listed"
    And no installed package named "already-listed"
    When the CLI is run with the command "init"
    Then the "plugins" list in ".repobuddy.json" contains "already-listed"

  @behavior
  Scenario: an installed plugin missing from the configuration is added
    Given a repository whose ".repobuddy.json" lists no plugins
    And an installed package "@repobuddy/typescript" declaring the keyword "repobuddy"
    When the CLI is run with the command "init"
    Then the "plugins" list in ".repobuddy.json" contains "@repobuddy/typescript"

  @behavior
  Scenario: an installed plugin already listed is not added twice
    Given a repository whose ".repobuddy.json" lists the plugin "@repobuddy/typescript"
    And an installed package "@repobuddy/typescript" declaring the keyword "repobuddy"
    When the CLI is run with the command "init"
    Then the "plugins" list in ".repobuddy.json" contains "@repobuddy/typescript" exactly once

  @behavior
  Scenario: init writes an empty plugin list when nothing is installed
    Given a repository where no installed package declares the keyword "repobuddy"
    And the repository contains no file with an accepted configuration name
    When the CLI is run with the command "init"
    Then the "plugins" list in ".repobuddy.json" is empty

  @behavior
  Scenario: a template the repository lacks is copied
    Given a repository containing no file named ".editorconfig"
    And a shipped template named ".editorconfig"
    When the CLI is run with the command "init"
    Then the repository contains a file named ".editorconfig"
    And its contents match the shipped template

  @behavior
  Scenario: a template the repository already has is skipped and left alone
    Given a repository containing a file named ".editorconfig" holding the text "root = false"
    And a shipped template named ".editorconfig" whose contents differ from that text
    When the CLI is run with the command "init"
    Then the file ".editorconfig" still holds the text "root = false"
    And the output reports ".editorconfig" as skipped

  @behavior
  Scenario: running init twice leaves the same configuration
    Given a repository containing no file with an accepted configuration name
    And an installed package "@repobuddy/typescript" declaring the keyword "repobuddy"
    When the CLI is run with the command "init"
    And the CLI is run with the command "init" a second time
    Then the contents of ".repobuddy.json" after the second run match the contents after the first
