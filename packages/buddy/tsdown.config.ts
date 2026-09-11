import { defineConfig } from 'tsdown'

// A single config, because this package has no JS library surface: `exports` names only
// `./package.json`, and both bins (`bd`, `buddy`) go through `bin/buddy.js`. So there is
// no consumer that needs a shared copy of a dependency and everything can be inlined.
//
// This replaces a `tsc --project tsconfig.esm.json` build. Two things keep the published
// paths from moving: `outDir: 'esm'` is where tsc emitted, and `outExtensions` forces
// `.js` over tsdown's default `.mjs` — `bin/buddy.js` imports `../esm/bin.js` and is
// tracked, not generated, so that specifier has to keep resolving.
//
// `tsc` was also typechecking as a side effect of building. tsdown does not typecheck,
// so the package gained an explicit `typecheck` script; it must stay in `verify`.
export default defineConfig({
	entry: { bin: 'src/bin.ts' },
	outDir: 'esm',
	format: 'esm',
	platform: 'node',
	// Matches the `target` the previous tsc build used, so the emitted JavaScript keeps
	// the same language level.
	target: 'es2020',
	outExtensions: () => ({ js: '.js' }),
	clean: true,
	// No `dts`: nothing imports this package as a library, so the declarations tsc used
	// to emit into `esm/` had no consumer.
	dts: false,
	// `clibuilder` is inlined so the published `esm/bin.js` runs with no `node_modules`
	// present — the state an installed agent plugin is actually in, since the plugin
	// directory is a copy of the source checkout rather than an npm install.
	//
	// Only this package's own `dependencies` need listing: those are the only ones
	// tsdown externalizes by default, so clibuilder's ~30 transitive packages are
	// inlined automatically. `onlyBundle: false` silences the "bundled a dependency"
	// warnings that are the whole point here.
	//
	// Expect two build warnings about unanalyzable dynamic imports: clibuilder loads
	// third-party plugins and user config files by runtime-computed specifier. Both are
	// correct by design and must stay dynamic; keeping this output ESM preserves them.
	// `jsonc-parser` (reached through clibuilder) resolves to its UMD build via `main`,
	// and that build's factory calls `require("./impl/format")` and three siblings —
	// specifiers rolldown cannot analyse. So its `impl/` modules were never inlined, and
	// at runtime the require resolved against `esm/` and threw `Cannot find module
	// './impl/format'`.
	//
	// The package also ships a real ESM build whose imports are static. It has no
	// `exports` field, so addressing that subpath directly is allowed; the build's
	// extensionless specifiers are fine because a bundler resolves them, which is what
	// its `module` entry exists for.
	alias: { 'jsonc-parser': 'jsonc-parser/lib/esm/main.js' },
	deps: {
		alwaysBundle: [/^clibuilder(\/|$)/],
		onlyBundle: false,
	},
})
