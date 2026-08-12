Feature: Plugin discovery

  Reporting which plugins this repository has installed, and which ones the
  npm registry offers.

  # ── List installed plugins ──

  @behavior
  Scenario: listing with nothing installed names the keyword searched for
    Given a repository where no installed package declares the keyword "repobuddy"
    When the CLI is run with the command "plugins list"
    Then the output contains "no plugin with keywords: repobuddy"

  @behavior
  Scenario: listing one installed plugin reports it by name
    Given a repository where the installed package "@repobuddy/typescript" declares the keyword "repobuddy"
    And no other installed package declares that keyword
    When the CLI is run with the command "plugins list"
    Then the output contains "found one plugin: @repobuddy/typescript"

  @behavior
  Scenario: listing several installed plugins reports each on its own line
    Given a repository where the installed package "@repobuddy/typescript" declares the keyword "repobuddy"
    And the installed package "@repobuddy/jest" declares the keyword "repobuddy"
    When the CLI is run with the command "plugins list"
    Then the output contains "found the following plugins:"
    And the output contains "@repobuddy/typescript" on its own line
    And the output contains "@repobuddy/jest" on its own line

  @behavior
  Scenario: ls is accepted as another spelling of list
    Given a repository where the installed package "@repobuddy/typescript" declares the keyword "repobuddy"
    When the CLI is run with the command "plugins ls"
    And the CLI is run with the command "plugins list"
    Then both runs produce the same output

  # ── Search for available plugins ──

  @behavior
  Scenario: searching with no matches names the keyword searched for
    Given a registry that returns no packages for the keyword "repobuddy"
    When the CLI is run with the command "plugins search"
    Then the output contains "no package with keywords: repobuddy"

  @behavior
  Scenario: searching with one match reports it by name
    Given a registry that returns only the package "@repobuddy/typescript" for the keyword "repobuddy"
    When the CLI is run with the command "plugins search"
    Then the output contains "found one package: @repobuddy/typescript"

  @behavior
  Scenario: searching with several matches reports each on its own line
    Given a registry that returns the packages "@repobuddy/typescript" and "@repobuddy/jest" for the keyword "repobuddy"
    When the CLI is run with the command "plugins search"
    Then the output contains "found the following packages:"
    And the output contains "@repobuddy/typescript" on its own line
    And the output contains "@repobuddy/jest" on its own line
