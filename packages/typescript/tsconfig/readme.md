# tsconfig

The top-level config (`/tsconfig/*`) are config presets for specific use cases.

There is also `/tsconfig/legacy/*` which are configs for older versions of TypeScript.

Under `/tsconfig`, there are categories of configs under their respective folders.

These configs are dissected into smaller pieces similar to how `tailwindcss` works.
They are normalized per specific purpose,
and then they can be composed together for a specific use case.

They are organized into categories following the [TSConfig Reference](https://www.typescriptlang.org/tsconfig)

Each category has one or more `buddy.json` which are the recommended config in that category.

## Categories

- `/tsconfig/diagnostics/*`: [Compiler Diagnostics](https://www.typescriptlang.org/tsconfig#Compiler_Diagnostics_6251) configs
- `/tsconfig/emit/*`: [Emit](https://www.typescriptlang.org/tsconfig#Emit_6246) configs
- `/tsconfig/interop/*`: [Interop Constraints](https://www.typescriptlang.org/tsconfig#Interop_Constraints_6252) configs
- `/tsconfig/javascript/*`: [JavaScript Support](https://www.typescriptlang.org/tsconfig#JavaScript_Support_6247) configs
- `/tsconfig/language/*`: [Language and Environment](https://www.typescriptlang.org/tsconfig#Language_and_Environment_6254) configs
- `/tsconfig/modules/*`: [Modules](https://www.typescriptlang.org/tsconfig#Modules_6244) configs
- `/tsconfig/projects/*`: [Projects](https://www.typescriptlang.org/tsconfig#Projects_6255) configs
- `/tsconfig/type-checking/*`: [Type Checking](https://www.typescriptlang.org/tsconfig#Type_Checking_6248) configs
