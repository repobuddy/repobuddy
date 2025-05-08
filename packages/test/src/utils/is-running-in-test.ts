/**
 * Whether the story is running in a test runner.
 *
 * Supports detecting NodeJS, jsdom, happy-dom, edge-runtim, and storybook.
 */
export function isRunningInTest() {
	if (isRunningInNodeJS()) return true
	if (isRunningInEdgeRuntime()) return true
	if (isRunningInVitest()) return true
	return /StorybookTestRunner|jsdom|HappyDOM|HeadlessChrome/.test(window.navigator.userAgent)
}
function isRunningInNodeJS() {
	return !globalThis['window']
}

function isRunningInEdgeRuntime() {
	return !!(globalThis as any)['EdgeRuntime']
}

function isRunningInVitest() {
	return !!(globalThis as any)['__vitest_browser__']
}
