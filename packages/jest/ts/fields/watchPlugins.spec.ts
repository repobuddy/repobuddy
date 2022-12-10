import { defineWatchPlugins, knownWatchPlugins } from './watchPlugins.js'

describe(`${defineWatchPlugins.name}()`, () => {
  it(`defaults to use: suspend, toggle-config, and typeahead`, () => {
    expect(defineWatchPlugins()).toEqual({
      watchPlugins: [
        'jest-watch-suspend',
        ['jest-watch-toggle-config-2', { setting: 'collectCoverage' }],
        ['jest-watch-toggle-config-2', { setting: 'verbose' }],
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname'
      ]
    })
  })
})
describe(`${knownWatchPlugins.suspend.name}()`, () => {
  it('can specify suspend-on-start', () => {
    expect(knownWatchPlugins.suspend({ 'suspend-on-start': true })).toEqual([
      'jest-watch-suspend',
      { 'suspend-on-start': true }
    ])
  })
})
