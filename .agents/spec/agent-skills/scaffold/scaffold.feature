@frozen
Feature: scaffold — list the installed recipes and apply one after a single confirmation

  The skill finds scaffold.recipe.<name> references by prefix, keeps those on a contract version it
  knows, and applies the chosen one in the contract's order of work or the recipe's Order. It writes
  nothing before the user confirms the plan, hands a host's basic settings to the host skill, and never
  reports a failing check as a pass.

  @trigger
  Scenario Outline: engages to scaffold a project or list recipes, not to set up an existing repo
    Given a developer in a repo where setup-github-repo and init-buddy are also installed
    When the developer says "<query>"
    Then scaffold being selected is <should_trigger>

    Examples:
      | query                                                                  | should_trigger |
      | scaffold a new repo for the billing service                            | yes            |
      | start a new package the way our team always does it                   | yes            |
      | what can I scaffold here?                                              | yes            |
      | create a new project from the react library recipe                     | yes            |
      | turn on branch protection and Dependabot for this repo                 | no             |
      | add repobuddy to this existing repo                                    | no             |
      | write a new scaffold recipe for our Go services                        | no             |
      | file a bug about the build failing on Windows                          | no             |

  @behavior
  Scenario: stops when the reference command cannot run
    Given the reference command from cyber-agent-harness is not installed
    When the developer asks scaffold to list recipes
    Then it says the reference command is needed
    And it lists no recipe and writes nothing

  @behavior
  Scenario: says no recipe is installed and writes nothing
    Given reference search scaffold.recipe returns no hit whose match is prefix
    When the developer asks scaffold to start a new repo
    Then it says no recipe is installed
    And it writes nothing

  @behavior
  Scenario: lists only prefix hits on a known contract
    Given reference search scaffold.recipe returns prefix hits scaffold.recipe.lib and scaffold.recipe.app on contract 1 and scaffold.recipe.old on contract 2
    And it also returns a hit scaffold.contract whose match is not prefix
    When the developer asks what can be scaffolded
    Then it shows scaffold.recipe.lib and scaffold.recipe.app with their Produces and Hosts
    And it names scaffold.recipe.old as left out because contract 2 is not a version it knows
    And it does not show scaffold.contract

  @behavior
  Scenario: stops on an Order that leaves out a step
    Given the chosen recipe's Recipe section has "Order: Inputs, host setup, Files, Config, Post"
    When scaffold reads the recipe
    Then it says Order leaves out Verify
    And it asks no confirmation and writes nothing

  @behavior
  Scenario: stops when the host is not in the recipe's Hosts
    Given the chosen recipe has "Hosts: github"
    When the developer answers that the project is hosted on GitLab
    Then scaffold says the recipe does not support gitlab
    And it writes nothing

  @behavior
  Scenario: writes nothing when the user declines the plan
    Given scaffold has shown the recipe's Files, Config changes, and Post steps for confirmation
    When the user declines
    Then scaffold creates no file, applies no setting, and runs no host skill or Post step
    And it says nothing was written

  @behavior
  Scenario: runs the host skill before writing the files
    Given a recipe with "Hosts: github" and no Order bullet
    And setup-github-repo is installed
    When the user confirms the plan for a GitHub repository
    Then scaffold runs setup-github-repo before it writes any file from Files
    And it applies Files before Config

  @behavior
  Scenario: follows the recipe's Order after the confirmation
    Given a recipe with "Order: Inputs, Files, host setup, Config, Verify, Post"
    When the user confirms the plan
    Then scaffold writes the files from Files before it runs the host skill
    And it asked for the confirmation before writing any file

  @behavior
  Scenario: reports a failing check and does not call the scaffold done
    Given the files and settings are written
    And the second of three Verify commands exits non-zero
    When scaffold reports the Verify results
    Then it reports the second check as failing with its output
    And it does not say the scaffold is done

  @behavior
  Scenario: runs only the Post steps the user accepts
    Given Verify passed and the recipe's Post has "register the repo with Codecov" and "create the release task"
    When the user accepts the first step and declines the second
    Then scaffold offers the steps one at a time
    And it runs the Codecov step and not the release task step

  @behavior
  Scenario: ships a Validate section whose mechanical assertions pass
    Given the scaffold skill as shipped in packages/buddy/skills/scaffold
    When its SKILL.md is read
    Then it has a Validate section
    And the description in its frontmatter is at most 120 characters
    And its frontmatter name equals its directory name
    And every file in its references/ equals the file of the same name in packages/buddy/references/
