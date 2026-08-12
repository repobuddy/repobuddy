Feature: to-question — compose a technical question and render it for a target platform

  The skill composes a half-formed question into a fixed section shape, renders it in the
  target platform's markup dialect, iterates with the user, and hands off through the
  clipboard. It never posts.

  # ── Use cases 1–2 — compose for a platform ──

  @trigger
  Scenario: composes when asked to word a question for posting
    Given a developer has been stuck on whether to retry failed webhook deliveries with a fixed
      delay or an exponential backoff
    And they say "help me word this for the team so someone can weigh in"
    When the harness matches the request against the installed skills
    Then to-question is the skill selected

  @trigger
  Scenario: stays out when the user asks to file an issue
    Given a developer is in a repo whose origin remote is a GitHub URL
    And they say "file a bug about the webhook retries dropping the last attempt"
    When the harness matches the request against the installed skills
    Then create-issue is the skill selected
    And to-question is not selected

  @trigger
  Scenario: stays out when the user asks for a researched post
    Given a developer wants to raise webhook retry semantics with the upstream project
    And they say "research what the community has already said about this, then draft a post for
      the discussion board"
    When the harness matches the request against the installed skills
    Then community-post is the skill selected
    And to-question is not selected

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
  Scenario: puts an ASCII diagram inside a fenced block
    Given the question describes a three-state delivery machine of pending, retrying and dead
    And the user says "format this for slack"
    When to-question includes a diagram of the state machine
    Then the diagram is enclosed in a fenced code block

  @quality
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
  Scenario: does not copy to the clipboard before approval
    Given to-question has displayed a slack draft for the first time
    And the user has not responded
    When to-question ends its turn
    Then no clipboard copy command has been run
