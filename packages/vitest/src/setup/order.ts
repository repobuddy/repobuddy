import { type ExpectWithOrder, installOrder } from '@repobuddy/test'
import { expect } from 'vitest'

declare module 'vitest' {
	interface ExpectStatic extends ExpectWithOrder {}
}

installOrder(expect)
