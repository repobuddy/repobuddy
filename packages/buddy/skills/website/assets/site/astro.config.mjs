import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
	site: 'https://<OWNER>.github.io',
	base: '/<REPO_NAME>',
	integrations: [
		starlight({
			title: '<PROJECT_NAME>',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/<REPO>' }],
			sidebar: [{ label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }] }],
			editLink: {
				baseUrl: 'https://github.com/<REPO>/edit/<DEFAULT_BRANCH>/<SITE_DIR>/',
			},
		}),
	],
})
