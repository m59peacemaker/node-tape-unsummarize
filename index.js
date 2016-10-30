const through = require('throo').obj
const duplex = require('duplexer')
const parser = require('tap_parser')
const combine = require('combine-arrays')

const summaryRegexes = [
  /^# tests \d+$/,
  /^# pass  \d+$/,
  /^# (ok|fail  \d+)$/,
]

const unSum = () => {
  const lastThreeValues = lastValuesClosure(summaryRegexes)

  return through((push, chunk, enc, cb) => {
    const newValue = chunk.value

    const oldValue = lastThreeValues.add(newValue)

    if (oldValue !== undefined) {
      push(oldValue + '\n')
    }

    if (lastThreeValues.match()) {
      lastThreeValues.clear()
    }

    cb()
  }, function onEnd(push, cb) {
    lastThreeValues.get().forEach(value => push(value + '\n'))
    cb()
  })
}

function lastValuesClosure(regexes) {
  let values = []

  function linesToConsider() {
    return values.filter(str => str.length > 0)
  }

  function match() {
    const relevantLines = linesToConsider()

    return relevantLines.length === regexes.length
      && combine({ value: relevantLines, regex: regexes })
        .every(({ regex, value }) => regex.test(value))
  }

  function add(value) {
    values.push(value)
    if (linesToConsider().length > regexes.length) {
      return values.shift()
    }
  }

  return {
    match,
    add,
    get: () => values,
    clear: () => values = []
  }
}

const unSummarize = () => {
  const parsedStream = parser()
  const unSumStream = parsedStream
    .pipe(unSum())
  return duplex(parsedStream, unSumStream)
}

module.exports = unSummarize
