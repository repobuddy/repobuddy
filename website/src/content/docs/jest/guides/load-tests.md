---
title: Run load tests
description: Keep slow *.load.* tests out of the normal run and run them with a separate config built on configs.nodeLoad.
---

Files named `<name>.load.<ext>` are load tests. The node presets recognize them but leave them out of a normal run, and
always leave them out of coverage. This guide adds a second config that runs them.

## Steps

1. Name the load test files `<name>.load.<ext>`, such as `src/api.load.ts`. Put them in the source folder with the
	other tests.

2. Create a second config that spreads [`configs.nodeLoad`](/repobuddy/jest/api/configs/#nodeload) over your preset:

	```js
	// jest.load.config.mjs
	import { configs } from '@repobuddy/jest'

	export default {
		preset: '@repobuddy/jest/presets/ts-esm',
		...configs.nodeLoad,
	}
	```

	Your `testRegex` and `coveragePathIgnorePatterns` replace the preset's.

3. Add a script:

	```json
	{
		"scripts": {
			"test:load": "cross-env NODE_OPTIONS=--experimental-vm-modules jest --config jest.load.config.mjs"
		}
	}
	```

	Drop `NODE_OPTIONS` for a CommonJS preset.

## Run both kinds in one config

Pass both identifier lists to [`configs.configNode()`](/repobuddy/jest/api/configs/#confignode):

```js
// jest.config.mjs
import { configs } from '@repobuddy/jest'

export default {
	preset: '@repobuddy/jest/presets/ts-esm',
	...configs.configNode([...configs.defaultTestIdentifiers, ...configs.loadTestIdentifiers]),
}
```

## Finished config

```js
// jest.load.config.mjs
import { configs } from '@repobuddy/jest'

export default {
	preset: '@repobuddy/jest/presets/ts-esm',
	...configs.nodeLoad,
}
```

## Verify

1. Check that the normal run skips the load test:

	```sh
	jest --listTests
	```

2. Check that the load config finds only load tests:

	```sh
	jest --config jest.load.config.mjs --listTests
	```

In the `ts-cjs` fixture, the normal run lists 14 files and not `nodejs.load.ts`. A config of `ts` plus
`configs.nodeLoad` lists only `nodejs.load.ts`.

## Limits

- Only the node presets have load test support. `configs.jsdom` has a fixed glob with no `load` identifier.
- Load tests can also target a Node.js major: `<name>.load.node20.ts`.

## Related

- [Test file names](/repobuddy/jest/reference/test-file-names/)
- [`configs`](/repobuddy/jest/api/configs/)
