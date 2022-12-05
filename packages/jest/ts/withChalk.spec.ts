import chalk from 'chalk'
import { withChalk } from './withChalk.js'

describe(`${withChalk.name}()`, () => {
  it('accepts a preset and returns a new preset with chalk added', () => {
    const preset = withChalk({
      moduleNameMapper: {
        foo: 'bar'
      }
    })

    expect(preset.moduleNameMapper).toEqual({
      foo: 'bar',
      '#ansi-styles': expect.stringMatching(/ansi-styles/),
      '#supports-color': expect.stringMatching(/supports-color/)
    })
  })

  it(`make jest works with ${chalk.green('chalk')}`, () => { })
})
