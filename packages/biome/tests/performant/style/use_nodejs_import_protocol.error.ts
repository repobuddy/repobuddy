// biome-ignore lint/style/useNodejsImportProtocol: expected error
import { deepEqual } from 'assert'

export function check(a: unknown, b: unknown): void {
	deepEqual(a, b)
}
