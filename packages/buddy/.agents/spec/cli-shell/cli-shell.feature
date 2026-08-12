Feature: CLI shell

  The repobuddy program as a whole: how it decides what the user asked for
  before any single command runs.

  # ── Start the CLI ──

  @behavior
  Scenario: running buddy with no command prints the help text
    Given the repobuddy CLI
    When it is run with no command and no options
    Then the output contains the usage line for repobuddy
    And the output lists the available commands

  @behavior
  Scenario: bd and buddy start the same program
    Given the repobuddy package is installed
    When the CLI is run through the bd executable with no command
    And the CLI is run through the buddy executable with no command
    Then both runs produce the same output

  # ── Report the version ──

  @behavior
  Scenario: the version flag prints the package version and runs no command
    Given the repobuddy CLI
    When it is run with the --version flag and no command
    Then the output is the version recorded in the package manifest
    And no command is run

  @behavior
  Scenario: the version flag is answered before the line is checked for errors
    Given the repobuddy CLI
    When it is run with the --version flag and the command name "no-such-command"
    Then the output is the version recorded in the package manifest
    And the output does not contain the usage line for repobuddy

  @behavior
  Scenario: the long and short version flags print the same thing
    Given the repobuddy CLI
    When it is run with the --version flag
    And it is run with the -v flag
    Then both runs produce the same output

  # ── Show help ──

  @behavior
  Scenario: the help flag prints help instead of running the command
    Given the repobuddy CLI with a registered command "demo" that writes "ran demo"
    When it is run with the command "demo" and the --help flag
    Then the output contains the usage line for the demo command
    And the output does not contain "ran demo"

  @behavior
  Scenario: a command that only groups subcommands prints help
    Given the repobuddy CLI
    When it is run with the command "plugins" and no subcommand
    Then the output contains the usage line for the plugins command
    And the output lists the list and search subcommands

  # ── Dispatch a command ──

  @behavior
  Scenario: a recognized command runs and receives its arguments
    Given the repobuddy CLI with a registered command "demo" that writes the arguments it received
    When it is run with the command "demo" and the argument "alpha"
    Then the output contains "alpha"

  @behavior
  Scenario: an unrecognized command prints help
    Given the repobuddy CLI
    When it is run with the command name "no-such-command"
    Then the output contains the usage line for repobuddy
    And the output does not contain the version

  @behavior
  Scenario: an unrecognized option prints help
    Given the repobuddy CLI with a registered command "demo" that defines no options
    When it is run with the command "demo" and the option "--no-such-option"
    Then the output contains the usage line for the demo command

  # ── Set the logging level ──

  @behavior
  Scenario: the silent flag suppresses informational output
    Given the repobuddy CLI with a registered command "demo" that emits the informational line "working"
    When it is run with the command "demo" and the --silent flag
    Then the output does not contain "working"

  @behavior
  Scenario: the verbose flag shows debug output
    Given the repobuddy CLI with a registered command "demo" that emits the debug line "inner detail"
    When it is run with the command "demo" and the --verbose flag
    Then the output contains "inner detail"

  @behavior
  Scenario: the debug-cli flag shows clibuilder's own trace output
    Given the repobuddy CLI
    When it is run with the --debug-cli flag and no command
    Then the output contains the parsed command line that clibuilder traced

  @behavior
  Scenario: informational output is shown when no display-level flag is given
    Given the repobuddy CLI with a registered command "demo" that emits the informational line "working"
    When it is run with the command "demo" and no display-level flag
    Then the output contains "working"

  @behavior
  Scenario: a display-level flag is consumed rather than passed to the command
    Given the repobuddy CLI with a registered command "demo" that writes the arguments it received
    When it is run with the command "demo" and the --silent flag
    Then the arguments the demo command received do not include silent
