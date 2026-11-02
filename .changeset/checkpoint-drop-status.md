---
"repobuddy": patch
---

`checkpoint`: drop the `status` field. A checkpoint that exists is live work and is deleted when done, so `resume` now lists every checkpoint instead of only the `paused` ones, and no longer rewrites the file on resume. A checkpoint whose resumed session died is no longer hidden from the list.
