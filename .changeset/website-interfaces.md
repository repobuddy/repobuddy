---
"repobuddy": minor
---

Ship `website.init.interface`, `website.deploy.interface`, and `website.update.interface`: the sections any version of each `website` reference holds, and the ones it must hold. The skill's defaults declare `implements: website.<command>@1`. The skill's README and website page say how to check another plugin's version with `reference load <name> --default <repobuddy>/skills/website --trace`.
