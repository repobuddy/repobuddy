Feature: Plugin discovery

  Which plugins this repository has, and which ones the registry offers. The
  wording and grouping of the output is clibuilder's — see
  design/inherited-behavior.md.

  # ── List installed plugins ──

  @behavior
  Scenario: listing reports an installed plugin
    Given a repository where the installed package "@repobuddy/typescript" declares the keyword "repobuddy"
    When the CLI is run with the command "plugins list"
    Then the output names "@repobuddy/typescript"

  # ── Search for available plugins ──

  @behavior
  Scenario: searching reports a package from the registry
    Given a registry that returns the package "@repobuddy/typescript" for the keyword "repobuddy"
    When the CLI is run with the command "plugins search"
    Then the output names "@repobuddy/typescript"
