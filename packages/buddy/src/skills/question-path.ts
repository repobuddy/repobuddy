#!/usr/bin/env node
/**
 * Print the path the composed question should be written to.
 *
 * The path used to be a hardcoded `/tmp/question.md`, which is wrong on native
 * Windows and collides on a shared machine — a fixed, world-readable name that
 * two users or two concurrent sessions land on at once.
 *
 *   node scripts/question-path.mjs        # prints the path, nothing else
 *
 * `os.tmpdir()` resolves TMPDIR/TMP/TEMP where set and falls back to the
 * platform default, so this is correct on Linux, macOS, WSL and native Windows.
 * The file goes inside a fresh `mkdtemp` directory, which is created 0700 and
 * carries a random suffix: no collision, and no other user can read it.
 */

import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

process.stdout.write(`${join(mkdtempSync(join(tmpdir(), 'to-question-')), 'question.md')}\n`)
