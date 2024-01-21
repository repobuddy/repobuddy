---
'@repobuddy/typescript': minor
---

Infer `moduleResolution` when possible.

`module: Node16` infers `moduleResolution: Node16`.
Relying on infer [fixes an issue with `ts-jest`](https://github.com/kulshekhar/ts-jest/issues/4198#issuecomment-1863407516).
