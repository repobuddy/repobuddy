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
					label: 'Guides',
					items: [{ label: 'Getting Started', slug: 'guides/getting-started' }],
				},
				{
					label: 'Packages',
					items: [
						{ label: 'Overview', slug: 'reference/packages' },
						{ label: '@repobuddy/biome', slug: 'reference/biome' },
						{ label: '@repobuddy/jest', slug: 'reference/jest' },
						{ label: '@repobuddy/vitest', slug: 'reference/vitest' },
						{ label: '@repobuddy/typescript', slug: 'reference/typescript' },
						{ label: '@repobuddy/test', slug: 'reference/test' },
						{ label: 'repobuddy', slug: 'reference/repobuddy' },
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
					label: 'Agent skills',
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
								{ label: 'create-issue', slug: 'skills/create-issue' },
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
			editLink: {
				baseUrl: 'https://github.com/repobuddy/repobuddy/edit/main/website/',
			},
		}),
	],
	site: 'https://repobuddy.github.io',
	base: '/repobuddy',
})
