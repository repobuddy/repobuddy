import { app } from './app.js'
import { main as detectEnvMain } from './skills/detect-env.js'
import { main as detectStateMain } from './skills/detect-state.js'
import { main as releaseAgeMain } from './skills/min-release-age.js'
import { main as npmTrustMain } from './skills/npm-trust.js'
import { main as scaffoldWorkflowsMain } from './skills/scaffold-workflows.js'

// Each of these forwards raw argv to the same `main(argv)` the skill script runs, so the
// output matches it exactly. clibuilder rejects undeclared flags, and redeclaring every script
// flag there would duplicate the scripts' own parsing.
const [, , subcommand, ...rest] = process.argv

if (subcommand === 'release-age') {
	await releaseAgeMain(rest)
} else if (subcommand === 'env') {
	await detectEnvMain(rest)
} else if (subcommand === 'detect-state') {
	await detectStateMain(rest)
} else if (subcommand === 'scaffold-workflows') {
	await scaffoldWorkflowsMain(rest)
} else if (subcommand === 'npm-trust') {
	await npmTrustMain(rest)
} else {
	app.parse(process.argv)
}
