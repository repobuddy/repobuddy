import { app } from './app.js'
import { main as detectEnvMain } from './skills/detect-env.js'
import { main as releaseAgeMain } from './skills/min-release-age.js'

// `release-age` and `env` forward raw argv to the same `main(argv)` the skill scripts run, so the
// output matches them exactly. clibuilder rejects undeclared flags, and redeclaring every script
// flag there would duplicate the scripts' own parsing.
const [, , subcommand, ...rest] = process.argv

if (subcommand === 'release-age') {
	await releaseAgeMain(rest)
} else if (subcommand === 'env') {
	await detectEnvMain(rest)
} else {
	app.parse(process.argv)
}
