---
"repobuddy": minor
---

`checkpoint`: `resume` writes a `resumed:` marker (time, harness, session id, process id and start time) into the checkpoint it opens. The list warns about a marked checkpoint, saying whether its process is alive, dead or unknown, and asks before opening one that is alive or can't be checked; it never hides one. `create` removes the marker, and warns first when another session resumed the file in the meantime.
