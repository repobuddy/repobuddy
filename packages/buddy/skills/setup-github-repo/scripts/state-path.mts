/**
 * Resolves where the run's state artifact lives.
 *
 * The artifact is scratch — a snapshot of the repo's settings at detection time plus
 * the plan of pending changes. It goes in the OS temp dir rather than the repo tree so
 * it can never be committed by accident or left behind as an unexplained untracked file.
 * The path is deterministic per repo so `detect-state` and `scaffold-workflows` agree on
 * it without passing it around, and so a run can resume within the same boot.
 */

import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function stateArtifactPath(nameWithOwner: string): string {
	const slug = nameWithOwner.replace(/[^a-zA-Z0-9._-]/g, '-')
	return join(tmpdir(), 'setup-github-repo', `${slug}.json`)
}
