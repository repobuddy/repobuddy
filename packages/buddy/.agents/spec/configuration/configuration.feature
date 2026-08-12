Feature: Configuration

  Finding the repository's repobuddy settings. The full set of accepted names,
  formats and precedence is clibuilder's — see design/inherited-behavior.md.

  # ── Resolve the configuration ──

  @behavior
  Scenario: the documented configuration file is found
    Given a directory containing a file named ".repobuddy.json" listing the plugin "@repobuddy/typescript"
    When the CLI is run from that directory
    Then the loaded settings list the plugin "@repobuddy/typescript"

  @behavior
  Scenario: the configuration is found from a subdirectory
    Given a directory containing a file named ".repobuddy.json" listing the plugin "@repobuddy/typescript"
    And an empty subdirectory two levels below it
    When the CLI is run from that subdirectory
    Then the loaded settings list the plugin "@repobuddy/typescript"

  @behavior
  Scenario: a repository with no configuration still runs
    Given a directory containing no file with an accepted configuration name
    And that directory's package.json has no "repobuddy" key
    When the CLI is run from that directory with no command
    Then the output names repobuddy
