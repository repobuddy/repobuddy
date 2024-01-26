export const knownModuleNameMappers = {
	/**
	 * For adjusting the module name mapper for ESM.
	 */
	tsEsm: {
		'^(\\.{1,2}/.*)\\.js$': '$1'
	},
	/**
	 * map all css (sass, less, etc) to identity-obj-proxy.
	 */
	cssAll: {
		'\\.module\\.css$': 'identity-obj-proxy',
		'.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy'
	}
}

export function defineModuleNameMappers(...entries: Array<Record<string, string>>): Record<string, string> {
	return Object.assign({}, ...entries)
}
