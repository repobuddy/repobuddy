// Written by `universal-plugin plugin build` to forward to the repobuddy CLI of repobuddy. Edit plugin.json, not this file.
globalThis.__SKILL_SCRIPT__ = {"package":"repobuddy","bin":"repobuddy","version":"5.2.2","entry":"skills/setup-github-repo/scripts/repobuddy.mjs","commands":{},"forward":"own"};
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const { package: pkg, bin, version } = globalThis.__SKILL_SCRIPT__
const args = process.argv.slice(2)
const checkout = findCheckout(path.dirname(fs.realpathSync(fileURLToPath(import.meta.url))))
const result = checkout === null ? runNpx() : runCheckout(checkout)
if (result.error) {
	process.stderr.write(`${bin}: ${result.error.message}\n`)
	process.exit(1)
}
if (result.signal) process.kill(process.pid, result.signal)
process.exit(result.status ?? 1)

/** The nearest package.json above this file, from its real path, that is the package and ships the
 *  CLI: a checkout under development, or the installed package a symlinked skill resolves into. A
 *  match whose bin cannot load, such as a git-sourced install with no build output, is no checkout. */
function findCheckout(dir) {
	for (;;) {
		const json = readJson(path.join(dir, 'package.json'))
		const declared = json?.name === pkg ? binPath(json.bin) : null
		if (declared) {
			const target = path.resolve(dir, declared)
			const imports = relativeImports(target)
			return imports && imports.every(isFile) ? { dir, target, imports } : null
		}
		const parent = path.dirname(dir)
		if (parent === dir) return null
		dir = parent
	}
}

/** The files the bin names by a literal relative specifier, resolved from its folder; null when the
 *  bin itself is missing. */
function relativeImports(target) {
	let text
	try {
		text = fs.readFileSync(target, 'utf8')
	} catch {
		return null
	}
	const found = []
	for (const m of text.matchAll(/\b(?:from|import|require)\s*\(?\s*['"](\.\.?\/[^'"]+)['"]/g)) {
		found.push(path.resolve(path.dirname(target), m[1]))
	}
	return found
}

function isFile(file) {
	return ['', '.js', '.mjs', '.cjs', '.json', '/index.js'].some((ext) => {
		try {
			return fs.statSync(file + ext).isFile()
		} catch {
			return false
		}
	})
}

function binPath(declared) {
	if (typeof declared === 'string') return pkg.replace(/^@[^/]+\//, '') === bin ? declared : null
	if (declared && typeof declared === 'object' && typeof declared[bin] === 'string') return declared[bin]
	return null
}

function readJson(file) {
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'))
	} catch {
		return null
	}
}

function runCheckout({ dir, target, imports }) {
	const output = buildOutput(dir, target, imports)
	const src = path.join(dir, 'src')
	if (output && fs.existsSync(src) && newest(src) > newest(path.join(dir, output))) {
		process.stderr.write(`${bin}: ${output}/ in ${dir} is older than src/ — rebuild to run your change\n`)
	}
	return spawnSync(process.execPath, [target, ...args], { stdio: 'inherit' })
}

/** The top folder of the checkout that holds the build output: where the first import leaving the
 *  bin's own top folder lands. Null when no import does, since then the bin may be hand-written. */
function buildOutput(dir, target, imports) {
	const top = (file) => path.relative(dir, file).split(path.sep)[0]
	for (const file of imports) {
		const folder = top(file)
		if (folder !== top(target) && folder !== 'src' && folder !== '..' && path.relative(dir, file).includes(path.sep)) return folder
	}
	return null
}

/** The newest modification time under a path, skipping node_modules; 0 when it does not exist. */
function newest(p) {
	let stat
	try {
		stat = fs.statSync(p)
	} catch {
		return 0
	}
	if (!stat.isDirectory()) return stat.mtimeMs
	let max = 0
	for (const entry of fs.readdirSync(p)) {
		if (entry !== 'node_modules') max = Math.max(max, newest(path.join(p, entry)))
	}
	return max
}

function runNpx() {
	const npxArgs = ['-y', `${pkg}@${version}`, ...args]
	if (process.platform !== 'win32') return spawnSync('npx', npxArgs, { stdio: 'inherit' })
	// npx is a .cmd shim on Windows, which only the shell runs; quote each argument for cmd.exe.
	return spawnSync(['npx.cmd', ...npxArgs.map(quoteForCmd)].join(' '), { stdio: 'inherit', shell: true })
}

function quoteForCmd(arg) {
	const quoted = `"${arg.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\*)$/, '$1$1')}"`
	return quoted.replace(/([()\][%!^"`<>&|;, *?])/g, '^$1').replace(/([()\][%!^"`<>&|;, *?])/g, '^$1')
}
