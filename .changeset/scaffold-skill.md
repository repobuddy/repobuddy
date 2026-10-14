---
"repobuddy": minor
---

New skill `scaffold` creates a repository or package from a scaffold recipe. A plugin ships a recipe as `scaffold.recipe.<name>`, following the new `scaffold.contract` reference that repobuddy owns (sections `Recipe`, `Inputs`, `Files`, `Config`, `Verify`, and `Post`). The skill lists the installed recipes, checks each one's contract version, asks the recipe's inputs, shows the plan, and writes nothing until you confirm. It runs the host's setup skill first, then applies the recipe, runs its checks, and offers each step after the first push one at a time.
