#!/bin/sh
node --input-type=module -e "
import assert from 'node:assert'
import { add, subtract } from './math.js'
assert.equal(add(2, 3), 5, 'add')
assert.equal(subtract(5, 3), 2, 'subtract')
console.log('ok')
"
