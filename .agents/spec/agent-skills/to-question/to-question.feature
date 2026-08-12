Feature: to-question — compose a technical question and render it for a target platform

  The skill composes a half-formed question into a fixed section shape, renders it in the
  target platform's markup dialect, iterates with the user, and hands off through the
  clipboard. It never posts.

  # ── Use cases 1–2 — compose for a platform ──

  @trigger
  Scenario Outline: engages to word a question, not to file an item or research a post
    Given a developer in a repo where create-issue and community-post are also installed
    And the developer has been weighing fixed-delay against exponential backoff for webhook retries
    When the developer says "<query>"
    Then to-question being selected is <should_trigger>

    Examples:
      | query                                                                       | should_trigger |
      | help me word this retry-backoff question for the team                       | yes            |
      | format this for linear so I can comment on the ticket                       | yes            |
      | draft this question for the jira ticket, I'll paste it myself               | yes            |
      | file a bug about the webhook retries dropping the last attempt              | no             |
      | create a task in asana for the retry work                                   | no             |
      | research what the community has said, then post it to the discussion board  | no             |

  @behavior
  Scenario: defaults to slack when no platform is named
    Given the user says "help me word this question about retry backoff for the team"
    When to-question resolves the target platform
    Then the target platform is slack

  @behavior
  Scenario: renders jira wiki markup when jira is named
    Given the user says "format this for jira"
    And the question is about retry backoff
    When to-question produces the draft
    Then the draft uses "h2." for its section headings
    And the draft contains no "##" markdown heading

  @behavior
  Scenario: caps headings at four levels when linear is named
    Given the user says "format this for linear"
    And the question covers three options, each with its own named sub-cases
    When to-question produces the draft
    Then the deepest heading in the draft is four hashes or fewer

  @behavior
  Scenario: falls back to the markdown baseline and announces it
    Given the user says "format this for notion"
    And the skill has no dialect file named notion
    When to-question resolves the target platform
    Then it reads assets/markdown.md
    And the reply states that the markdown baseline was used instead

  @behavior
  Scenario: does not fall back to markdown for slack
    Given the user says "format this for slack"
    When to-question resolves the target platform
    Then it reads assets/slack.md
    And it does not read assets/markdown.md

  @behavior
  Scenario: does not fall back to markdown for jira
    Given the user says "format this for jira"
    When to-question produces the draft
    Then the draft uses "h2." for its section headings
    And the draft contains no markdown heading syntax

  @behavior
  Scenario: routes linear to the baseline without announcing a fallback
    Given the user says "format this for linear"
    When to-question resolves the target platform
    Then the reply does not describe the target as unsupported
    And the reply does not say it fell back to the markdown baseline

  @behavior
  Scenario: reads the platform asset rather than recalling its syntax
    Given the target platform is slack
    When to-question prepares to render the draft
    Then it reads assets/slack.md

  @quality @rubric
  Scenario: composes the section template from a half-formed question
    Given the user supplies one paragraph describing that webhook retries drop the final attempt
    And the user supplies no alternatives and no explicit question
    When to-question produces the draft
    Then the draft is graded:
      """
      dimensions:
        section_population: 3   # each section present in the draft carries material derived from
                                # the user's paragraph, not placeholder or template text
        question_answerability: 3  # every numbered item under Questions can be answered by picking
                                   # one of a stated set, rather than inviting open commentary
        option_cost: 3          # each listed alternative names a concrete cost it incurs, not only
                                # what it gains
      threshold: 7
      """
    And the draft scores at or above the threshold

  @behavior
  Scenario: opens by asking the question, unlabelled, without the item's title
    Given the user says "format this for linear"
    And the question concerns a Linear issue titled "Webhook retries drop the final attempt"
    When to-question produces the draft
    Then the draft's first line states in one line what is being asked
    And that first line carries no "Title", "Summary" or "Ask" label in front of it
    And the draft does not repeat the phrase "Webhook retries drop the final attempt"
    And the draft does not re-describe what the existing issue is about

  @behavior
  Scenario: puts an ASCII diagram inside a fenced block
    Given the question describes a three-state delivery machine of pending, retrying and dead
    And the user says "format this for slack"
    When to-question includes a diagram of the state machine
    Then the diagram is enclosed in a fenced code block

  @behavior
  Scenario: renders slack bold as single asterisks, never double
    Given the target platform is slack
    And the draft emphasises the word Options as a section heading
    When to-question produces the draft
    Then the heading is wrapped in single asterisks
    And the draft contains no double-asterisk emphasis

  @behavior
  Scenario: wraps the displayed draft in a 4-backtick fence
    Given the draft for slack contains a triple-backtick code block holding an ASCII diagram
    When to-question displays the draft in its reply
    Then the draft is enclosed in a fence of four backticks

  # ── Use case 3 — revise the draft ──

  @behavior
  Scenario: revises and redisplays when the user asks for a change
    Given to-question has displayed a slack draft listing three alternatives
    And the user says "drop the third option, we already ruled it out"
    When to-question responds
    Then the redisplayed draft lists two alternatives

  @behavior
  Scenario: keeps inviting changes rather than handing off unprompted
    Given to-question has displayed a revised draft
    And the user has not said the draft is good
    When to-question responds
    Then it asks the user whether they want further changes
    And no file is written to /tmp/question.md

  # ── Use case 4 — hand off the approved draft ──

  @behavior
  Scenario: writes the approved draft to a file on approval
    Given to-question has displayed a slack draft
    And the user says "that's good, ship it"
    When to-question responds
    Then /tmp/question.md exists
    And its contents are the displayed draft

  @behavior
  Scenario: copies to the clipboard and names the platform to paste into
    Given the user has approved a draft whose target platform is slack
    When to-question completes the handoff
    Then a clipboard copy command is run against /tmp/question.md
    And the reply names Slack as the place to paste

  @behavior
  Scenario: reports no clipboard rather than claiming a copy that did not happen
    Given the user has approved a draft whose target platform is slack
    And the machine has none of pbcopy, clip.exe, wl-copy or xclip on its PATH
    When to-question completes the handoff
    Then the reply states that no clipboard is available
    And the reply gives the path /tmp/question.md
    And the reply does not state that the draft was copied to the clipboard

  @behavior
  Scenario: tells the user to render before pasting when the target is email
    Given the user has approved a draft whose target platform is email
    When to-question completes the handoff
    Then the reply tells the user to render the markdown before pasting

  @behavior
  Scenario: does not copy to the clipboard before approval
    Given to-question has displayed a slack draft for the first time
    And the user has not responded
    When to-question ends its turn
    Then no clipboard copy command has been run
