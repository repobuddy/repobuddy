## Goals

- Two shareable configs, `recommended` and `performant`, that set the formatter and tune the linter, so a
  `biome.json` only has to extend one.
- `recommended` is for people and teams who know what they are doing: the tools help, then get out of the way.
- `performant` turns off the rules that hold back performance-sensitive code.

## Non-goals

- Biome 1.x.
