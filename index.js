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

    lastThreeValues.add(newValue)

    if (lastThreeValues.perfectMatch()) {
      lastThreeValues.clear()
    } else if (!lastThreeValues.mightMatchLater()) {
      lastThreeValues.get().forEach(value => push(value + '\n'))
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

  function existingValuesMatchRegexes(lines) {
    return combine({ value: lines, regex: regexes })
        .every(({ regex, value }) => !value || regex.test(value))
  }

  function mightMatchLater() {
    const relevantLines = linesToConsider()

    return relevantLines.length < regexes.length
      && existingValuesMatchRegexes(relevantLines)
  }

  function perfectMatch() {
    const relevantLines = linesToConsider()

    return relevantLines.length === regexes.length
      && existingValuesMatchRegexes(relevantLines)
  }

  function add(value) {
    values.push(value)
    if (linesToConsider().length > regexes.length) {
      return values.shift()
    }
  }

  return {
    mightMatchLater,
    perfectMatch,
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
