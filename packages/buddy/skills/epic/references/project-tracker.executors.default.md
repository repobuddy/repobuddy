---
description: Who can carry out an epic's steps on this tracker; what an agent cannot do, what it does only after a confirmation, and which steps are irreversible.
tags: [project-tracker, executors, epic]
---
## Executors

- **person**: a named person, by tracker handle, such as `@octocat`. A person can do every step, including those in the tracker's web UI.
- **agent**: a coding agent working from the tracker's CLI and the repository, unattended or in a session. It can do every step that is not listed below.

An agent that reaches a step it cannot do stops at it. It posts on the step's issue what the person must do, and waits. It does not look for a way around the step.

## Agent cannot

On GitHub, these steps exist only in the web UI or need the owner's own session, so a person does them:

- Create, transfer, install, uninstall, or delete a GitHub App.
- Change a GitHub App's permissions, events, webhook, or other settings, or accept changed permissions on an installation.
- Generate or revoke a GitHub App's private key, or download one.
- Create or rotate a personal access token.
- Accept an organization or repository invitation for another account.
- Change billing, a plan, or an organization's member roles.

## Agent after confirmation

An agent does these only after a person confirms on the step's issue. A confirmation in an earlier session or on another issue does not count:

- Delete a repository, organization, or Actions secret.
- Archive or delete a repository.
- Transfer an issue or a repository to another owner.
- Publish a package or a release.
- Close or delete an item the plan did not create.

## Irreversible

These steps cannot be undone, or undoing them loses data. A plan lists each one under `Risks and irreversible steps`, and gates it on a confirmation on its issue:

- Deleting an app, a repository, a secret, a key, or a branch with unmerged work.
- Archiving a repository. It can be unarchived, but anything that pushes to it fails until then.
- Transferring an issue or a repository. The item gets a new URL, and an issue a new number, so every plan that links it needs a redirect note.
- Publishing a package version. A registry does not let anyone reuse a version number.
