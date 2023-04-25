# tsconfig

The configs are dissected into smaller pieces similar to how `tailwindcss` works.
They are normalized per specific purpose,
and then they can be composed together for a specific use case.

The configs are organized into categories following the [TSConfig Reference](https://www.typescriptlang.org/tsconfig)

Each category has one or more `buddy.json` which are the recommended config in that category.

The top-level config (`/tsconfig/*`) are config presets for specific use cases.
