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
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide', link: '/guides/example/' },
					],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
			editLink: {
				baseUrl: 'https://github.com/repobuddy/repobuddy/edit/main/website/',
			},
		}),
	],
	site: 'https://repobuddy.github.io/repobuddy',
})
