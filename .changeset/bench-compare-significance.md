---
"repobuddy": minor
---

`agent-readiness bench compare <before> <after>` compares two stored bench results without running an agent. Per task and pooled (geometric mean of the task ratios), it shows the mean and median change, each side's min-max, and an exact permutation-test p-value, flags run counts too small to reach significance, and counts its tests for the multiple-comparisons caveat. A bench run compares against its baseline the same way, reading the baseline's runs from its results file.
