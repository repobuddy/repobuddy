---
'@repobuddy/jest': major
---

Bump to support [jest@29.4.0][jest].

[jest@29.4.0][jest] now support subpath imports directly.
The type of the resolver also changed,
causing `TypeError: this._resolver.getGlboalPaths` when using `@repobuddy/jest`.

The `resolver` is still exported if you need to use an older version of `jest`.
In that case, you will need to specify `resolver` directly:

```js
module.exports = {
  resolver: '@repobuddy/jest/resolver`
}
```


[jest]: https://github.com/facebook/jest/releases/tag/v29.4.0
