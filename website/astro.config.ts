import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'repobuddy',
			favicon: '/img/logo.svg',
			logo: {
				light: './src/assets/logo.svg',
				dark: './src/assets/logo.svg',
				// replacesTitle: true
			},
			social: [
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/5amXyarNHR' },
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/repobuddy/repobuddy' },
				{ icon: 'x.com', label: 'X', href: 'https://x.com/Unional' },
			],
			sidebar: [
				{
					label: 'repobuddy',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'repobuddy' },
						{
							label: 'CLI',
							items: [
								{ label: 'Overview', slug: 'cli' },
								{
									label: 'Guides',
									items: [
										{ label: 'Set up test scripts', slug: 'cli/guides/test-scripts' },
										{ label: 'Check Jest dependencies in CI', slug: 'cli/guides/check-deps-in-ci' },
										{ label: 'Add a plugin', slug: 'cli/guides/plugins' },
									],
								},
								{
									label: 'Commands',
									items: [
										{ label: 'buddy test-scripts', slug: 'cli/test-scripts' },
										{ label: 'buddy check-deps', slug: 'cli/check-deps' },
										{ label: 'buddy plugins list', slug: 'cli/plugins-list' },
										{ label: 'buddy plugins search', slug: 'cli/plugins-search' },
										{ label: 'Global options', slug: 'cli/global-options' },
									],
								},
								{
									label: 'Skill script commands',
									collapsed: true,
									items: [
										{ label: 'Overview', slug: 'cli/skill-scripts' },
										{ label: 'buddy env', slug: 'cli/skill-scripts/env' },
										{ label: 'buddy detect-state', slug: 'cli/skill-scripts/detect-state' },
										{ label: 'buddy scaffold-workflows', slug: 'cli/skill-scripts/scaffold-workflows' },
										{ label: 'buddy npm-trust', slug: 'cli/skill-scripts/npm-trust' },
										{ label: 'buddy release-age', slug: 'cli/skill-scripts/release-age' },
										{ label: 'buddy agent-readiness', slug: 'cli/skill-scripts/agent-readiness' },
									],
								},
							],
						},
						{
							label: 'Agent plugin',
							items: [
								{ label: 'Overview', slug: 'skills' },
								{ label: 'Install', slug: 'skills/install' },
								{
									label: 'Repo setup',
									items: [
										{ label: 'setup-github-repo', slug: 'skills/setup-github-repo' },
										{ label: 'add-badges', slug: 'skills/add-badges' },
										{ label: 'llms-txt', slug: 'skills/llms-txt' },
									],
								},
								{
									label: 'Dependencies and releases',
									items: [
										{ label: 'merge-dep-prs', slug: 'skills/merge-dep-prs' },
										{ label: 'min-release-age', slug: 'skills/min-release-age' },
										{ label: 'setup-npm-trusted-publishing', slug: 'skills/setup-npm-trusted-publishing' },
									],
								},
								{
									label: 'Review',
									items: [
										{ label: 'code-review', slug: 'skills/code-review' },
										{ label: 'review-api', slug: 'skills/review-api' },
										{ label: 'review-permissions', slug: 'skills/review-permissions' },
										{ label: 'agent-readiness', slug: 'skills/agent-readiness' },
									],
								},
								{ label: 'Docs', items: [{ label: 'website', slug: 'skills/website' }] },
								{
									label: 'Issues and questions',
									items: [
										{ label: 'file-issue', slug: 'skills/file-issue' },
										{ label: 'to-question', slug: 'skills/to-question' },
									],
								},
								{
									label: 'Agent setup and sessions',
									items: [
										{ label: 'init-buddy', slug: 'skills/init-buddy' },
										{ label: 'session', slug: 'skills/session' },
									],
								},
							],
						},
					],
				},
				{
					label: '@repobuddy/jest',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'jest' },
						{
							label: 'Guides',
							items: [
								{ label: 'TypeScript with ESM', slug: 'jest/guides/typescript-esm' },
								{ label: 'TypeScript with CommonJS', slug: 'jest/guides/typescript-cjs' },
								{ label: 'DOM tests with jsdom', slug: 'jest/guides/jsdom' },
								{ label: 'Monorepo', slug: 'jest/guides/monorepo' },
								{ label: 'Load tests', slug: 'jest/guides/load-tests' },
								{ label: 'Customize a preset', slug: 'jest/guides/customize' },
							],
						},
						{
							label: 'Presets',
							items: [
								{ label: 'All presets', slug: 'jest/presets' },
								{ label: 'ts', slug: 'jest/presets/ts' },
								{ label: 'ts-esm', slug: 'jest/presets/ts-esm' },
								{ label: 'ts-cjs', slug: 'jest/presets/ts-cjs' },
								{ label: 'js-esm', slug: 'jest/presets/js-esm' },
								{ label: 'js-cjs', slug: 'jest/presets/js-cjs' },
								{ label: 'jsdom-ts', slug: 'jest/presets/jsdom-ts' },
								{ label: 'jsdom-ts-esm', slug: 'jest/presets/jsdom-ts-esm' },
								{ label: 'jsdom-ts-cjs', slug: 'jest/presets/jsdom-ts-cjs' },
								{ label: 'watch', slug: 'jest/presets/watch' },
							],
						},
						{
							label: 'API',
							items: [
								{ label: 'All exports', slug: 'jest/api' },
								{ label: 'configs', slug: 'jest/api/configs' },
								{ label: 'fields', slug: 'jest/api/fields' },
								{ label: 'extract', slug: 'jest/api/extract' },
								{ label: 'matchers', slug: 'jest/api/matchers' },
								{ label: 'presets', slug: 'jest/api/presets' },
								{ label: 'resolver', slug: 'jest/api/resolver' },
								{ label: 'Test file names', slug: 'jest/reference/test-file-names' },
							],
						},
					],
				},
				{
					label: '@repobuddy/vitest',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'vitest' },
						{
							label: 'Guides',
							items: [
								{ label: 'Run Node.js tests', slug: 'vitest/guides/node-tests' },
								{ label: 'Run browser tests', slug: 'vitest/guides/browser-tests' },
								{ label: 'Node.js and browser together', slug: 'vitest/guides/node-and-browser' },
								{ label: 'Run load tests', slug: 'vitest/guides/load-tests' },
								{ label: 'Assert call order', slug: 'vitest/guides/expect-order' },
								{ label: 'Migrate from Vitest 4', slug: 'vitest/guides/migrate-from-vitest-4' },
							],
						},
						{
							label: 'Reference',
							items: [
								{ label: 'All reference', slug: 'vitest/reference' },
								{ label: 'nodeTestPreset()', slug: 'vitest/reference/node-test-preset' },
								{ label: 'browserTestPreset()', slug: 'vitest/reference/browser-test-preset' },
								{ label: 'buddyConfigDefaults', slug: 'vitest/reference/buddy-config-defaults' },
								{ label: 'mergeConfig()', slug: 'vitest/reference/merge-config' },
								{ label: 'Test file names', slug: 'vitest/reference/test-file-names' },
								{ label: 'setup/order', slug: 'vitest/reference/setup-order' },
								{ label: 'setup/browser', slug: 'vitest/reference/setup-browser' },
								{ label: 'Entry points', slug: 'vitest/reference/entry-points' },
							],
						},
					],
				},
				{
					label: '@repobuddy/biome',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'biome' },
						{
							label: 'Guides',
							items: [
								{ label: 'Adopt a preset', slug: 'biome/guides/adopt' },
								{ label: 'Override a rule', slug: 'biome/guides/override-rules' },
							],
						},
						{
							label: 'Configs',
							items: [
								{ label: 'All configs', slug: 'biome/configs' },
								{ label: 'recommended', slug: 'biome/configs/recommended' },
								{ label: 'performant', slug: 'biome/configs/performant' },
								{ label: 'Compare', slug: 'biome/configs/compare' },
							],
						},
					],
				},
				{
					label: '@repobuddy/typescript',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'typescript' },
						{
							label: 'Guides',
							items: [
								{ label: 'Configure a monorepo package', slug: 'typescript/guides/monorepo' },
								{ label: 'Compose your own tsconfig', slug: 'typescript/guides/compose-tsconfig' },
								{ label: 'Build CommonJS and ESM', slug: 'typescript/guides/dual-cjs-esm-build' },
							],
						},
						{
							label: 'tsconfig presets',
							items: [
								{ label: 'All presets', slug: 'typescript/tsconfig' },
								{ label: 'monorepo', slug: 'typescript/tsconfig/monorepo' },
								{ label: 'legacy/monorepo', slug: 'typescript/tsconfig/legacy-monorepo' },
								{ label: 'diagnostics', slug: 'typescript/tsconfig/diagnostics' },
								{ label: 'emit', slug: 'typescript/tsconfig/emit' },
								{ label: 'interop', slug: 'typescript/tsconfig/interop' },
								{ label: 'javascript', slug: 'typescript/tsconfig/javascript' },
								{ label: 'language', slug: 'typescript/tsconfig/language' },
								{ label: 'modules', slug: 'typescript/tsconfig/modules' },
								{ label: 'projects', slug: 'typescript/tsconfig/projects' },
								{ label: 'type-checking', slug: 'typescript/tsconfig/type-checking' },
								{ label: 'nodejs/package.cjs.json', slug: 'typescript/nodejs-package-cjs-json' },
							],
						},
						{
							label: 'CLI plugin',
							items: [
								{ label: 'Overview', slug: 'typescript/cli' },
								{ label: 'buddy ts build', slug: 'typescript/cli/build' },
								{ label: 'buddy ts copy-cjs-package-json', slug: 'typescript/cli/copy-cjs-package-json' },
							],
						},
					],
				},
				{
					label: '@repobuddy/test',
					collapsed: true,
					items: [
						{ label: 'Overview', slug: 'test' },
						{
							label: 'Guides',
							items: [{ label: 'Use expect.order with Jest', slug: 'test/guides/expect-order-with-jest' }],
						},
						{
							label: 'API',
							items: [
								{ label: 'All exports', slug: 'test/api' },
								{ label: 'installOrder()', slug: 'test/api/install-order' },
								{ label: 'isRunningInTest()', slug: 'test/api/is-running-in-test' },
								{ label: 'Types', slug: 'test/api/types' },
							],
						},
					],
				},
			],
			editLink: {
				baseUrl: 'https://github.com/repobuddy/repobuddy/edit/main/website/',
			},
		}),
	],
	// The per-package pages from #763 moved into one section per package.
	redirects: {
		'/reference/packages': '/repobuddy/',
		'/reference/biome': '/repobuddy/biome/',
		'/reference/jest': '/repobuddy/jest/',
		'/reference/vitest': '/repobuddy/vitest/',
		'/reference/typescript': '/repobuddy/typescript/',
		'/reference/test': '/repobuddy/test/',
		'/reference/repobuddy': '/repobuddy/repobuddy/',
		// The Getting started section was removed; each package's overview carries its own install steps.
		'/guides/getting-started': '/repobuddy/',
		// The Packages and Compatibility pages were folded into the home page and each package's overview.
		'/packages': '/repobuddy/',
		'/compatibility': '/repobuddy/',
	},
	site: 'https://repobuddy.github.io',
	base: '/repobuddy',
})
