// @ts-expect-error
// biome-ignore lint/correctness/noUnusedVariables: expected error
const unusedVar = 0

// @ts-expect-error
// biome-ignore lint/correctness/noUnusedFunctionParameters: expected error
export function foo(unused: string) {}
