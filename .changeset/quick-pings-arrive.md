---
'repobuddy': minor
---

`to-question`: make the content shape a parameter, and add an `unblock` shape.

The skill composed into exactly one shape — Context → Use Cases → Problem → Options → Questions —
while the platform was already a parameter. That shape assumes the user is undecided between
alternatives and wants input. Where that does not hold, the misfire is quiet: the agent
manufactures an "Options" section for a request that has no options.

Shape and dialect are now chosen independently. `question` stays the default, so a request that
names no shape composes exactly as before.

The new `unblock` shape is for "can someone unblock me": what you are blocked on, what you have
already tried, **what you need from whom**, and by when. The ask is a required slot naming a person
or team plus one concrete action — if you have not said who or by when, the skill asks instead of
drafting a ping whose ask is "any help appreciated". It picks `unblock` when your own words say you
are blocked, stuck, or waiting on someone, and tells you it did so you can ask for the other shape.

The frontmatter description now reads "a question or an unblock ping", so a blocked user's request
matches it.
