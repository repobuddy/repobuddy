import { cli } from 'clibuilder'

export const app = cli({
  name: 'jestbuddy',
  version: '2.0.0',
  description: 'A Jest Buddy Helper'
})
  .command({
    name: 'init',
    description: 'Initialize Jest Buddy',
    run() {
      this.ui.info('will be implemented soon, stay tuned!')
    }
  })
  .command({
    name: 'upgrade',
    alias: ['up'],
    description: 'Upgrade Jest Buddy and your jest dependencies',
    run() {
      this.ui.info('will be implemented soon, stay tuned!')
    }
  })
