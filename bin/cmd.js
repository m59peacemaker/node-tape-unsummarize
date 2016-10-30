#!/usr/bin/env node

const unSummarize = require('../')

process.stdin
  .pipe(unSummarize())
  .pipe(process.stdout)
