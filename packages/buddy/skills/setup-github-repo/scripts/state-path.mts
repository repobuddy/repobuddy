/**
 * Resolves where the run's state artifact lives.
 *
 * The artifact is scratch — a snapshot of the repo's settings at detection time plus
 * the plan of pending changes. It goes in the OS temp dir rather than the repo tree so
 * it can never be committed by accident or left behind as an unexplained untracked file.
 * The path is deterministic per repo so `detect-state` and `scaffold-workflows` agree on
 * it without passing it around, and so a run can resume within the same boot.
 *
 * The directory carries the current user: `tmpdir()` is per-user on macOS and Windows but
 * shared on Linux, where a run by another user would otherwise own the directory and make
 * every later run fail with EACCES.
 */

import { tmpdir, userInfo } from 'node:os'
import { join } from 'node:path'

function slug(value: string): string {
	return value.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export function stateArtifactPath(nameWithOwner: string): string {
	return join(tmpdir(), `setup-github-repo-${slug(userInfo().username)}`, `${slug(nameWithOwner)}.json`)
}
