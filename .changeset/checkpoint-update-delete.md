---
"repobuddy": patch
---

`checkpoint create` now matches each topic to its existing checkpoint, first the one the session resumed, then one with the same goal, and merges into it instead of overwriting its settled decisions and dead ends. A finished or abandoned topic's old checkpoint is deleted. `checkpoint resume` asks whether to delete a checkpoint whose goal the new commits already met. Age alone never deletes a checkpoint.
