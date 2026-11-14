#!/bin/sh
echo "parse.js: run $(date +%s)" > coverage.txt
node --input-type=module -e "
import assert from 'node:assert'
import { parseList } from './parse.js'
assert.deepEqual(parseList('1,2,3'), [1, 2, 3])
console.log('ok')
"
