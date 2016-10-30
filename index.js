const through = require('throo').obj
const duplex = require('duplexer')
const parser = require('tap_parser')

const isSummaryLine = chunk => {
  return chunk.type === 'diagnostic' && /^(tests|pass|fail) +\d+$/.test(chunk.parsed.message)
}

const sendChunk = (push, chunk) => push(chunk.value + '\n')

const beginning = [
  /^# tests \d+$/,
  /^# pass  \d+$/
]
const pass = [
  ...beginning,
  /^# ok$/
]
const fail = [
  ...beginning,
  /^# fail  \d+$/
]

const match = (pending, rs) => pending.every((v, idx) => rs[idx].test(v))

const unSum = () => {
  let pendingValues = []
  let afterPlan = false
  let hasFailingTest = false
  return through((push, chunk, enc, cb) => {
    if (chunk.type === 'test' && chunk.parsed.ok === false) {
      hasFailingTest = true
    }

    if (!afterPlan) {
      if (chunk.type === 'plan') {
        afterPlan = true
      }
      sendChunk(push, chunk)
      return cb()
    }
    pendingValues.push(chunk.value)
    const values = pendingValues.filter(v => v.length)
    const matchArray = hasFailingTest ? fail : pass
    const mustMatch = matchArray.slice(0, values.length)
    const matched = match(values, mustMatch)
    if (matched) {
      if (values.length === matchArray.length) {
        pendingValues = []
      }
      cb()
    } else {
      pendingValues.forEach(v => push(v + '\n'))
      pendingValues = []
      cb()
    }
  })
}

const unSummarize = () => {
  const parsedStream = parser()
  const unSumStream = parsedStream
    .pipe(unSum())
  return duplex(parsedStream, unSumStream)
}

module.exports = unSummarize
