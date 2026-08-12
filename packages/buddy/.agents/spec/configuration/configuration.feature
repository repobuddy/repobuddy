Feature: Configuration

  Locating the repository's repobuddy settings, reading them, and checking
  them against a command's declared schema.

  # ── Locate the configuration ──

  @behavior
  Scenario: a configuration file in the working directory is found
    Given a directory containing a file named ".repobuddy.json" listing the plugin "@repobuddy/typescript"
    When the CLI is run from that directory
    Then the loaded settings list the plugin "@repobuddy/typescript"

  @behavior
  Scenario: a configuration file in a parent directory is found
    Given a directory containing a file named ".repobuddy.json" listing the plugin "@repobuddy/typescript"
    And an empty subdirectory two levels below it
    When the CLI is run from that subdirectory
    Then the loaded settings list the plugin "@repobuddy/typescript"

  @behavior
  Scenario: an earlier accepted name beats a nearer file
    Given a directory containing a file named "repobuddy.json" listing the plugin "from-root"
    And a subdirectory of it containing a file named ".repobuddy.json" listing the plugin "from-subdirectory"
    When the CLI is run from that subdirectory
    Then the loaded settings list the plugin "from-root"

  @behavior
  Scenario: the repobuddy key in package.json is used when no file exists
    Given a directory whose package.json has a "repobuddy" key listing the plugin "@repobuddy/typescript"
    And that directory contains no file with an accepted configuration name
    When the CLI is run from that directory
    Then the loaded settings list the plugin "@repobuddy/typescript"

  @behavior
  Scenario: no configuration anywhere warns and carries no settings
    Given a directory whose package.json has no "repobuddy" key
    And that directory contains no file with an accepted configuration name
    When the CLI is run from that directory with the --verbose flag
    Then the output contains a warning naming the directory searched
    And the loaded settings are empty

  # ── Read the configuration ──

  @behavior
  Scenario: a JSON configuration is read
    Given a directory containing a file named ".repobuddy.json" holding JSON that lists the plugin "alpha"
    When the CLI is run from that directory
    Then the loaded settings list the plugin "alpha"

  @behavior
  Scenario: a YAML configuration is read
    Given a directory containing a file named ".repobuddy.yml" holding YAML that lists the plugin "alpha"
    When the CLI is run from that directory
    Then the loaded settings list the plugin "alpha"

  @behavior
  Scenario: a JavaScript configuration is read from its default export
    Given a directory containing a file named ".repobuddy.mjs" whose default export lists the plugin "alpha"
    And that file exports no member named "activate"
    When the CLI is run from that directory
    Then the loaded settings list the plugin "alpha"

  @behavior
  Scenario: a JavaScript configuration exporting activate is used whole
    Given a directory containing a file named ".repobuddy.mjs" that exports a member named "activate"
    And that same file exports a member named "plugins" listing the plugin "alpha"
    When the CLI is run from that directory
    Then the loaded settings list the plugin "alpha"

  # ── Validate the configuration ──

  @behavior
  Scenario: a command declaring no schema runs without validation
    Given a registered command "demo" that declares no configuration schema
    And a configuration whose "plugins" value is the number 42
    When the CLI is run with the command "demo"
    Then the demo command runs

  @behavior
  Scenario: settings matching the schema let the command run
    Given a registered command "demo" that declares a schema requiring "plugins" to be a list of text
    And a configuration whose "plugins" value is a list containing "alpha"
    When the CLI is run with the command "demo"
    Then the demo command runs

  @behavior
  Scenario: settings violating the schema stop the command and name the field
    Given a registered command "demo" that declares a schema requiring "plugins" to be a list of text
    And a configuration whose "plugins" value is the number 42
    When the CLI is run with the command "demo"
    Then the output contains "config fails validation"
    And the output names the field "plugins"
    And the demo command does not run
