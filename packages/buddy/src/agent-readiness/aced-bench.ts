/**
 * Where agent-readiness's bench data lives now that ACED runs the bench.
 *
 * ACED's measured layer (`aced-bench`, in the `cyber-aced` package) owns the engine, the record
 * schema, and the statistics. Readiness supplies the suite `repobuddy.readiness` and reads two things
 * back: the committed baseline's age (the level-5 gate) and, later, comparison records. Readiness
 * never imports ACED; it reads the files ACED writes.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const SUITE = 'repobuddy.readiness'
export const suiteDir = (suite: string) => `.agents/aced/bench/${suite}`
export const SUITE_DIR = suiteDir(SUITE)
export const BASELINE_FILE = `${SUITE_DIR}/baseline.json`
/** Where `bench` kept its task set before it moved to ACED. */
const LEGACY_BENCH_DIR = '.agents/readiness/bench'

/** A baseline older than this no longer counts as measured: the repo has moved on since. */
export const BASELINE_MAX_AGE_DAYS = 90

/** The ACED engine, run without installing it: readiness takes no dependency on `cyber-aced`. */
export const ACED_BENCH = 'npx -y -p cyber-aced@^0.4.0 aced-bench'

/** When the suite's committed baseline was recorded; `undefined` when there is none or it is unreadable. */
export function readBaselineAt(dir: string): string | undefined {
	const path = join(dir, BASELINE_FILE)
	if (!existsSync(path)) return undefined
	try {
		const { createdAt } = JSON.parse(readFileSync(path, 'utf8')) as { createdAt?: unknown }
		return typeof createdAt === 'string' ? createdAt : undefined
	} catch {
		return undefined
	}
}

export function baselineAgeDays(createdAt: string, now: Date): number {
	return Math.floor((now.getTime() - new Date(createdAt).getTime()) / 86_400_000)
}

/** What `bench` prints now: where the bench went, and the commands that replace each old one. */
export function handover(dir: string): string {
	const lines = [
		`agent-readiness bench has moved to ACED's measured layer. Run it with suite ${SUITE}:`,
		'',
		'- with the ACED plugin installed, load its `bench` skill and name the suite; it shows the plan and asks before spending;',
		`- without it, the engine directly: \`${ACED_BENCH} plan --suite ${SUITE} --arm after=git:HEAD --out <plan.json>\`,`,
		`  then, after a yes to that plan, \`${ACED_BENCH} run --plan <plan.json> --consent\`, then`,
		`  \`${ACED_BENCH} compare --suite ${SUITE} --before baseline --after <record.json>\`.`,
		'',
		`The task set lives at ${SUITE_DIR}/ (tasks.json, checks/, baseline.json).`,
	]
	if (existsSync(join(dir, LEGACY_BENCH_DIR))) {
		lines.push(
			'',
			`This repo still has ${LEGACY_BENCH_DIR}/. Move it with \`git mv ${LEGACY_BENCH_DIR} ${SUITE_DIR}\`,`,
			'point any check paths in tasks.json at the new folder, and record a new baseline with ACED:',
			'its engine reads only schema version 3. Convert a results file you want to keep comparing with',
			'`agent-readiness.mjs bench convert`.',
		)
	}
	return `${lines.join('\n')}\n`
}
