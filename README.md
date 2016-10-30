# tape-unsummarize

Filters out the diagnostic summary lines output by [tape](https://www.npmjs.com/package/tape).

## install

```sh
npm install tap-unsummarize
```

## example


```sh
$ tape **/*.test.js

TAP version 13
# test 1
ok 1 should be equal
# test 2
ok 2 should be equal

1..2
# tests 2
# pass  2

# ok
```

```sh
$ tape **/*.test.js | tap-unsummarize

TAP version 13
# test 1
ok 1 should be equal
# test 2
ok 2 should be equal

1..2
```

```js
const unSummarize = require('tape-unsummarize')

runTests()
  .pipe(unSummarize)
  .pipe(process.stdout)
```
