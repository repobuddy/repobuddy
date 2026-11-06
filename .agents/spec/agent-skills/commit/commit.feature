Feature: commit — stage and commit one unit of work, unattended and without interactive git

  The skill commits one unit of work at a time. It checks the index before staging, holds a definition
  of done, stages by name or by a patch of hunks, verifies the staged snapshot when unstaged changes
  could hide a failure, writes the message by the commit.message reference, carries what the
  commit.release-notes reference says, and recovers from a hook rejection by committing again. No
  command it runs opens an editor, a pager, or a prompt, and it never pushes or rewrites history.

  @trigger
  Scenario Outline: engages to commit work, not to push, release, or write a changeset
    Given a developer in a repo where the repobuddy plugin and buddy-changesets are installed
    When the developer says "<query>"
    Then commit being selected is <should_trigger>

    Examples:
      | query                                                          | should_trigger |
      | commit this                                                    | yes            |
      | split these changes into separate commits                      | yes            |
      | write a commit message for what I staged                       | yes            |
      | the fix is done and the tests pass, commit it                  | yes            |
      | push my branch and open a pull request                         | no             |
      | add a changeset for this change                                | no             |
      | squash the last three commits                                  | no             |
      | merge the open Renovate pull requests                          | no             |

  # ── P1 — standalone, agent-runnable splitting ──

  @behavior
  Scenario: splits a change across files by staging each unit's files by name
    Given the working tree changes src/parser.ts for a bugfix and docs/guide.md for an unrelated docs edit
    And the index is empty
    When the agent commits the work
    Then it makes two commits
    And it stages each one with git add naming the files
    And it runs no git add ., git add -A, or git add -p

  @behavior
  Scenario: stages part of one file with a patch of hunks
    Given src/config.ts holds two hunks, one for this unit and one for the next
    When the agent stages this unit
    Then it writes a patch holding only this unit's hunk to a file outside the repository
    And it stages it with git apply --cached
    And it checks the result with git diff --cached before committing
    And it runs no git add -p and no git restore -p

  @behavior
  Scenario: runs no command that opens an editor or a pager
    Given a unit whose message needs a body
    When the agent commits it
    Then it passes the message with git commit -F or one -m per paragraph
    And it runs no bare git commit, no git commit -v without a message, and no git rebase -i
    And it reads diffs with git --no-pager diff

  @behavior
  Scenario: does not defer to another commit skill
    Given the shipped commit skill
    When its SKILL.md and references are read
    Then they name no commit-work skill
    And the splitting commands are in the skill's own references

  # ── P2 — the message by the commit.message reference ──

  @behavior
  Scenario: reads the allowed types, scope, and header length from the commitlint config
    Given commitlint.config.mjs extends @commitlint/config-conventional and sets header-max-length to 120 and a type-enum without perf
    And the repository has no override of commit.message
    When the agent writes the message for a performance improvement
    Then it uses a type the type-enum allows
    And its first line is at most 120 characters
    And it uses no type the config does not allow

  @behavior
  Scenario: uses a section of the repository's override in place of the default
    Given .agents/references/commit.message.md with merge: patch and its own Type section allowing release
    When the agent loads commit.message
    Then it uses the override's Type section
    And it keeps the default's other sections

  @behavior
  Scenario: reads the bundled default when the reference command cannot run
    Given the reference command from cyber-agentkit is not installed
    And the repository has no .agents/references/commit.message.md
    When the agent writes a commit message
    Then it follows references/commit.message.default.md in the skill's folder
    And it does not stop for lack of the reference command

  # ── P3 — a hook rejects the commit ──

  @behavior
  Scenario: commits again after a commit-msg hook rejects the message
    Given a commit-msg hook that runs commitlint
    And the agent's git commit exits non-zero with "subject must not be sentence-case"
    When the agent continues
    Then it treats the commit as not made
    And it rewrites the message and runs git commit again
    And it runs no --no-verify and no --amend

  @behavior
  Scenario: fixes the code when a pre-commit hook fails a check
    Given a pre-commit hook that runs the linter
    And the agent's git commit fails because the staged file has a lint error
    When the agent continues
    Then it fixes the lint error, stages the fix, and runs git commit again
    And the commit before is unchanged

  # ── P4 — files already staged ──

  @behavior
  Scenario: unstages files that are not this unit before committing
    Given the index already holds package.json from an earlier, unrelated edit
    And package.json has no unstaged changes
    When the agent commits the parser fix
    Then it runs git restore --staged package.json before staging the fix
    And the commit holds only the parser fix
    And package.json's change is still in the working tree

  @behavior
  Scenario: stops when unstaging would lose a partial selection
    Given the index holds part of README.md and the working tree holds more of README.md
    And README.md is not part of this unit
    When the agent prepares the commit
    Then it does not unstage README.md
    And it reports that README.md is partly staged and outside this unit
    And it does not commit README.md along with the unit

  # ── P5 — verify the staged snapshot ──

  @behavior
  Scenario: verifies the staged snapshot when unstaged changes could hide a failure
    Given the staged change edits src/math.ts
    And an unstaged change to src/math.ts defines a function the staged change calls
    When the agent verifies before committing
    Then it sets aside the unstaged part with git stash push --keep-index --include-untracked
    And it runs the checks on the staged snapshot
    And it restores the set-aside changes before doing anything else

  @behavior
  Scenario: skips the snapshot check when unstaged changes cannot affect it
    Given the staged change edits packages/a/src/index.ts
    And the only unstaged change is a typo in CHANGELOG.md, which no check reads
    When the agent verifies before committing
    Then it runs the checks on the working tree without stashing
    And it says why the snapshot check was skipped

  @behavior
  Scenario: does not stage a change that is not done
    Given the change compiles but its tests fail
    When the agent is asked to commit it
    Then it stages nothing
    And it reports the failing tests

  # ── P6 — messages without an editor ──

  @behavior
  Scenario: keeps the trailers the harness supplies
    Given the harness asks for a Co-Authored-By trailer on every commit
    When the agent commits a unit with a body
    Then the message ends with the Co-Authored-By trailer after one blank line
    And it is passed with git commit -F or -m

  # ── P7 — unattended-safe ──

  @behavior
  Scenario: decides the split from the rules without asking up front
    Given the working tree holds a feature in src/ and an unrelated CI change in .github/workflows/ci.yml
    And no one is present to answer questions
    When the agent commits the work
    Then it makes one commit for the feature and one for the CI change
    And it asks no question before committing

  @behavior
  Scenario: stops and reports when the rules cannot decide
    Given one hunk in src/app.ts serves both the feature and the refactor being committed
    And no one is present to answer questions
    When the agent cannot tell which unit the hunk belongs to
    Then it commits nothing it cannot place
    And it reports what is left uncommitted and why

  @behavior
  Scenario: never pushes or rewrites history
    Given the branch's last commit has been pushed to origin
    And a hook rejected the agent's new commit
    When the agent finishes committing
    Then it runs no git push, no git push --force, no git rebase, and no git commit --amend

  # ── P8 — release notes by the commit.release-notes reference ──

  @behavior
  Scenario: commits the changeset with the change in a repository that uses changesets
    Given the repository has .changeset/config.json
    And the change edits packages/buddy/src/index.ts of the published package repobuddy
    And .changeset/quiet-owl.md describes that change
    When the agent commits the change
    Then .changeset/quiet-owl.md is in the same commit as the change

  @behavior
  Scenario: hands writing a changeset to the changesets skill
    Given the repository has .changeset/config.json
    And the change edits a published package and .changeset/ holds no changeset for it
    When the agent prepares the commit
    Then it does not write the changeset itself
    And it names the changesets skill from repobuddy/buddy-changesets
    And it does not commit the change without its changeset

  @behavior
  Scenario: adds no release notes in a repository without changesets
    Given the repository has no .changeset/config.json
    And no override of commit.release-notes
    When the agent commits a change to a published package
    Then the commit holds no release-note file

  # ── the shipped skill ──

  @behavior
  Scenario: ships a Validate section whose mechanical assertions pass
    Given the shipped commit skill
    When its Validate section is checked
    Then its description is at most 120 characters and its name is commit
    And references/commit.message.default.md and references/commit.release-notes.default.md match the canonical references
