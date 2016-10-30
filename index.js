const through = require('throo').obj
const duplex = require('duplexer')
const parser = require('tap_parser')
const combine = require('combine-arrays')

const summaryRegexes = [
  /^# tests \d+$/,
  /^# pass  \d+$/,
  /^# (ok|fail  \d+)$/,
]

const lastValuesClosure = (regexes) => {
  let values = []

  // ignore blank lines
  const linesToConsider = () => values.filter(str => str.length > 0)

  const existingValuesMatchRegexes = (lines) => {
    return combine({value: lines, regex: regexes})
      .every(({regex, value}) => value === undefined || regex.test(value))
  }

  const mightMatchLater = () => {
    const relevantLines = linesToConsider()
    return relevantLines.length < regexes.length && existingValuesMatchRegexes(relevantLines)
  }

  const perfectMatch = () => {
    const relevantLines = linesToConsider()
    return relevantLines.length === regexes.length && existingValuesMatchRegexes(relevantLines)
  }

  return {
    mightMatchLater,
    perfectMatch,
    add: value => values.push(value),
    get: () => values,
    clear: () => values = []
  }
}

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
  }, (push, cb) => {
    lastThreeValues.get().forEach(value => push(value + '\n'))
    cb()
  })
}

const unSummarize = () => {
  const parsedStream = parser()
  const unSumStream = parsedStream
    .pipe(unSum())
  return duplex(parsedStream, unSumStream)
}

module.exports = unSummarize
