---
'repobuddy': minor
---

Add `buddy check-deps`, which reports packages your jest config uses that your `package.json` does not declare.

A preset names the packages it needs, but the project using it has to install them. `check-deps` reads the jest config, follows the preset chain, and names every package no dependency field declares, along with the config field that asked for it and the command to install it. It exits `1` when something is missing, so it can gate a build.

It is a command you run, not a `postinstall` hook: the same check on install would run on every consumer's machine, which is intrusive and exactly the shape a supply-chain review flags.
