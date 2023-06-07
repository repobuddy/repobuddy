/** @type {import('jest').Config} */
export default {
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		"^.+\\.(ts|tsx|cts|mts)$": [
			"ts-jest", {
				"isolatedModules": true,
            "useESM": true,
            "diagnostics": {
              "ignoreCodes": [
                151001
              ]
            }
			}
		]
	}
}
