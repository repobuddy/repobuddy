# Design

The rules and the model behind repobuddy's capabilities — the *why*, kept apart from the *what* so
this folder reads as a model while the capability folders stay testable as behavior.

Nothing here owns a test suite. A rule stated here is enacted by scenarios in whichever capability
folder performs it.

## Contents

- [`decisions/`](./decisions/README.md) — the decision log: what was decided, what the alternatives
  were, and why one won.

Model documents (the plugin lifecycle, the configuration resolution model) are added here as the
capabilities that need them are specified.
