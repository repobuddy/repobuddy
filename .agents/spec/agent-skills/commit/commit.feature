@frozen
Feature: commit — stage and commit one unit of work, unattended and without interactive git

  The skill commits one unit of work at a time. It follows the repository's rules over its own
  defaults, checks the index before staging, holds a definition of done, stages by name or by a patch
  of hunks, verifies the staged snapshot when unstaged changes could hide a failure, writes the message
  by the commit.message reference, carries what the commit.release-notes reference says, and recovers
  from a hook rejection by committing again. No command it runs opens an editor, a pager, or a prompt,
  and it never pushes or rewrites history.

  @trigger
  Scenario Outline: engages to commit work, not to push, release, amend, or write a changeset
    Given a developer in a repo where the repobuddy plugin and buddy-changesets are installed
    And the working tree has uncommitted changes to src/parser.ts
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
      | amend my last commit message                                   | no             |
      | undo my last commit                                            | no             |

  # ── Repository rules win ──

  @behavior
  Scenario: follows the repository's Commit Discipline over its own defaults
    Given AGENTS.md has a Commit Discipline section saying "commit each package's changes separately"
    And one feature changes packages/a/src/index.ts and packages/b/src/index.ts
    When the agent commits the work
    Then it makes one commit for packages/a and one for packages/b

  @behavior
  Scenario: follows SKILL.local.md over its own defaults
    Given a SKILL.local.md beside the installed commit skill says "put the ticket id ABC-12 in every subject"
    And the working tree changes src/parser.ts for a bugfix
    When the agent writes the message for the parser fix
    Then its subject contains ABC-12

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
    Given src/config.ts changes the timeout on line 12 for a bugfix
    And src/config.ts adds a retries option on line 80 for a feature
    When the agent stages the bugfix
    Then it writes a patch holding only the line-12 hunk to a file outside the repository
    And it stages it with git apply --cached
    And it checks the result with git diff --cached before committing
    And it runs no git add -p and no git restore -p

  @behavior
  Scenario: splits two units whose changes share one hunk
    Given src/config.ts changes line 10 for the bugfix and line 12 for the retries feature
    And git diff shows both changes in one hunk
    When the agent stages the bugfix
    Then it builds the patch from git --no-pager diff -U0 src/config.ts
    And it stages it with git apply --cached --unidiff-zero
    And git diff --cached src/config.ts shows only the line-10 change

  @behavior
  Scenario: stages one unit's lines from a changed run that holds both units
    Given src/config.ts changes line 10 for the bugfix and line 11 for the retries feature
    And git --no-pager diff -U0 src/config.ts shows lines 10 and 11 in one hunk
    When the agent stages the bugfix
    Then it writes src/config.ts as the bugfix commit must read to a file outside the repository
    And it stages that content with git hash-object -w and git update-index --cacheinfo
    And git diff --cached src/config.ts shows only the line-10 change
    And git diff src/config.ts shows the line-11 change

  @behavior
  Scenario: runs no command that opens an editor or a pager
    Given a unit whose message needs a body
    When the agent commits it
    Then it passes the message with git commit -F or one -m per paragraph
    And it runs no bare git commit and no git commit -v without a message
    And it reads diffs with git --no-pager diff

  @behavior
  Scenario: does not defer to another commit skill
    Given the commit skill as shipped in packages/buddy/skills/commit
    When its SKILL.md and references/ are read
    Then they contain no "commit-work" and no "commit-discipline"
    And references/splitting.md contains git apply --cached and git stash push --keep-index

  # ── P2 — the message by the commit.message reference ──

  @behavior
  Scenario: reads the allowed types, scope, and header length from the commitlint config
    Given commitlint.config.mjs extends @commitlint/config-conventional
    And @commitlint/cli and @commitlint/config-conventional are installed in node_modules
    And it sets header-max-length to 50
    And it sets type-enum to feat, fix, chore, docs, refactor, test
    And it sets scope-enum to parser, cli
    And the repository has no override of commit.message
    When the agent writes the message for a performance improvement to src/parser.ts
    Then its type is one of feat, fix, chore, docs, refactor, test
    And its scope, if any, is parser
    And its first line is at most 50 characters
    And git log -1 --format=%B piped to commitlint exits 0

  @behavior
  Scenario: uses a section of the repository's override in place of the default
    Given .agents/references/commit.message.md with merge: patch and its own Type section allowing release
    And the repository has no commitlint config
    When the agent writes the message for a release commit
    Then its type is release
    And its subject is imperative with no trailing period, as the default's Subject section says

  @behavior
  Scenario: reads the bundled default when the reference command cannot run
    Given the reference command from cyber-agentkit is not installed
    And the repository has no .agents/references/commit.message.md
    And the repository has no commitlint config
    When the agent writes the message for the src/parser.ts bugfix
    Then its type is fix
    And its first line is at most 100 characters with no trailing period
    And it does not stop for lack of the reference command

  @behavior
  Scenario: applies an override's section by hand when the reference command cannot run
    Given the reference command from cyber-agentkit is not installed
    And .agents/references/commit.message.md has a Type section allowing release
    And the repository has no commitlint config
    When the agent writes the message for a release commit
    Then its type is release

  @behavior
  Scenario: marks a change that breaks a consumer
    Given the change removes the exported parse function from packages/buddy/src/index.ts
    And the repository has no commitlint config
    When the agent writes the message for the change
    Then its first line has ! before the colon
    And the message carries a "BREAKING CHANGE:" trailer that names parse

  # ── P3 — a hook rejects the commit ──

  @behavior
  Scenario: runs the repository's hook checks before committing
    Given .husky/pre-commit runs "pnpm lint-staged"
    And .husky/commit-msg runs commitlint
    When the agent prepares the commit
    Then it reports that lint-staged and commitlint will run
    And it runs pnpm lint-staged before git commit

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
    Given the working tree changes src/parser.ts for a bugfix
    And the index already holds package.json from an earlier, unrelated edit
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
    And it makes no commit

  # ── P5 — the definition of done and the staged snapshot ──

  @behavior
  Scenario: does not stage a change that is not done
    Given the change compiles but its tests fail
    When the agent is asked to commit it
    Then it stages nothing
    And it reports the failing tests

  @behavior
  Scenario: exercises a changed CLI once before staging
    Given the change adds a --json flag to the buddy CLI
    And its unit tests pass
    When the agent prepares the commit
    Then it runs the CLI with --json once before staging

  @behavior
  Scenario: verifies the staged snapshot when unstaged changes could hide a failure
    Given the staged change edits src/math.ts
    And an unstaged change to src/math.ts defines a function the staged change calls
    When the agent verifies before committing
    Then it sets aside the unstaged part with git stash push --keep-index --include-untracked
    And it runs the checks on the staged snapshot
    And it restores the set-aside changes before doing anything else
    And it does not commit the staged change while the snapshot check fails
    And the commit it makes, if any, includes the definition of the called function

  @behavior
  Scenario: skips the snapshot check when unstaged changes cannot affect it
    Given the repository's checks are tsc, vitest, and biome over packages/*/src
    And the staged change edits packages/a/src/index.ts
    And the only unstaged change is an edit to docs/notes.txt
    When the agent verifies before committing
    Then it runs the checks on the working tree without stashing
    And it says why the snapshot check was skipped

  # ── P6 — messages without an editor ──

  @behavior
  Scenario: keeps the trailers the harness supplies
    Given the harness asks for a Co-Authored-By trailer on every commit
    When the agent commits a unit with a body
    Then the message ends with the Co-Authored-By trailer after one blank line
    And it is passed with git commit -F or -m

  @behavior
  Scenario: writes the message for what the developer staged and commits only when asked
    Given the developer staged lines 10 to 14 of src/config.ts for a timeout bugfix
    And src/config.ts has more unstaged changes for a retries feature
    When the developer says "write a commit message for what I staged"
    Then the agent writes the message for the timeout bugfix by commit.message
    And it shows the message to the developer
    And it does not unstage or restage src/config.ts
    And it makes no commit

  # ── P7 — unattended-safe ──

  @behavior
  Scenario: decides the split from the rules without asking up front
    Given the working tree holds a feature in src/ and an unrelated CI change in .github/workflows/ci.yml
    And no one is present to answer questions
    When the agent commits the work
    Then it makes one commit for the feature and one for the CI change
    And it asks no question before committing

  @behavior
  Scenario: asks the developer when the rules cannot place a change
    Given src/app.ts has one changed line that both the CSV-export feature and the formatRow rename need
    And the developer is present in the session
    When the agent stages the CSV-export feature
    Then it asks the developer which commit the line belongs to
    And it makes no commit before the answer

  @behavior
  Scenario: stops and reports when the rules cannot decide
    Given src/app.ts has one changed line that both the CSV-export feature and the formatRow rename need
    And no one is present to answer questions
    When the agent commits the work
    Then it commits neither unit that needs the line
    And it reports the line, the two units, and that both are left uncommitted

  @behavior
  Scenario: never pushes or rewrites history
    Given a hook rejected the agent's new commit on a branch that tracks origin/main
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
  Scenario: writes a missing changeset through the changesets skill and commits it with the change
    Given the repository has .changeset/config.json
    And the change edits packages/buddy/src/index.ts and .changeset/ holds no changeset for it
    And the changesets skill from repobuddy/buddy-changesets is installed
    When the agent commits the change
    Then it runs the changesets skill in add mode
    And the new .changeset/<name>.md is in the same commit as the change

  @behavior
  Scenario: names the changesets skill and commits nothing when it is not installed
    Given the repository has .changeset/config.json
    And the change edits packages/buddy/src/index.ts and .changeset/ holds no changeset for it
    And the changesets skill is not installed
    When the agent prepares the commit
    Then it does not write the changeset itself
    And it names the changesets skill and npx skills add repobuddy/buddy-changesets --skill changesets
    And it does not commit the change

  @behavior
  Scenario: carries no changeset for a change outside any published package
    Given the repository has .changeset/config.json
    And the change edits only .github/workflows/ci.yml
    When the agent commits the change
    Then it commits the change with no .changeset/ file
    And it does not run the changesets skill

  @behavior
  Scenario: carries no changeset for a change to a private package
    Given the repository has .changeset/config.json
    And packages/internal/package.json has "private": true
    And the change edits only packages/internal/src/index.ts
    When the agent commits the change
    Then it commits the change with no .changeset/ file

  @behavior
  Scenario: adds no release notes in a repository without changesets
    Given the repository has no .changeset/config.json
    And no override of commit.release-notes
    When the agent commits a change to a published package
    Then the commit adds no file under .changeset/ and does not change CHANGELOG.md

  # ── the shipped skill and its Validate section ──

  @behavior
  Scenario: ships a skill file whose frontmatter and bundled reference copies are valid
    Given the commit skill as shipped in packages/buddy/skills/commit
    When its SKILL.md and references/ are read
    Then SKILL.md has a Validate section
    And its frontmatter name equals its directory name
    And the description in its frontmatter is at most 120 characters
    And references/commit.message.default.md and references/commit.release-notes.default.md equal packages/buddy/references/commit.message.md and commit.release-notes.md, less their extends line

  @behavior
  Scenario: leaves the repository in the state its Validate section checks
    Given a repository whose branch tracks origin/main at commit abc123
    And the working tree changes src/parser.ts for a bugfix and docs/guide.md for an unrelated docs edit
    When the agent commits the work
    Then git reflog since the start shows a "commit:" entry for each new commit
    And it shows no "commit (amend)", no "rebase", and no "reset" entry that moves HEAD to another commit
    And git rev-parse @{upstream} still gives abc123
    And git stash list holds no entry the agent pushed
    And each of the two new commits lists exactly one of src/parser.ts and docs/guide.md in git show --stat
