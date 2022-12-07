import { dirname, join } from 'node:path'
import { sync } from 'read-pkg-up'
import { resolve } from 'resolve.imports'
import type { ResolverOptions } from 'jest-resolve'

function resolver(path: string, options: ResolverOptions) {
  try {
    return options.defaultResolver(path, options)
  }
  catch {
    const result = sync({ cwd: options.basedir })
    // `options.conditions` is `[ 'require', 'default', 'node', 'node-addons' ]`
    // which is not correct as it will take `default` over `node`.
    const conditions = options.conditions ? options.conditions.filter((c) => c !== 'default') : undefined
    const mapped = resolve(result!.packageJson, path, { conditions })
    if (mapped) {
      return options.defaultResolver(join(dirname(result!.path), mapped), options)
    }
  }
}

export { resolver as sync }
