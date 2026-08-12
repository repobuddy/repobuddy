# Glossary

The load-bearing terms in this project spec, each defined once.

**buddy** — the command a user types. The package is named `repobuddy`; the executable it
installs is `buddy`, with `bd` as a shorter alias for the same program.

**plugin** — an npm package that adds commands to `repobuddy`. A plugin exports an `activate`
function; when repobuddy loads it, that function registers the plugin's commands so they appear
alongside the built-in ones. `@repobuddy/typescript` is one, and it contributes the `ts` command.

**active plugin** — a plugin listed in the `plugins` array of the configuration file. `clibuilder`
loads every active plugin automatically at startup, so "active" means "its commands are available".
A plugin can be installed as a dependency without being active.

**configuration file** — the file recording the repository's repobuddy settings, chiefly which
plugins are active. Written as `.repobuddy.json` by default, though several other names and formats
are accepted (see `configuration/`).

**find-up** — the search strategy `clibuilder` uses to locate the configuration file: look in the
current directory, then its parent, then that parent's parent, and so on until one is found or the
filesystem root is reached. This is why a command run deep inside a repository still finds the
configuration at the repository root.

**template file** — a starter file that `buddy init` copies into the repository, taken from the
package's `templates/` directory. `.editorconfig` is the first one.

**safe to repeat (idempotent)** — running a command a second time leaves the repository in the same
state as running it once, rather than duplicating entries, overwriting edits, or failing. `init` is
required to be safe to repeat.

**package manager** — the tool that installs dependencies (`npm`, `yarn`, or `pnpm`). repobuddy
detects which one a repository uses rather than assuming, because `add` has to shell out to it.

**clibuilder** — the third-party library repobuddy is built on. It supplies the command shell,
argument parsing, configuration resolution, and plugin auto-loading. Behavior described in this spec
as *inherited* comes from clibuilder rather than from code in this package.

**inherited behavior** — behavior a consumer experiences from `repobuddy` that no code in this
package implements, because clibuilder provides it. It is specified here anyway: a consumer cannot
tell the difference, and a clibuilder upgrade that changed it would be a break in repobuddy.
