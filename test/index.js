const test = require('tape')
const unSummarize = require('../')

test('removes ok summary', t => {
  t.plan(1)
  let output = ''
  const s = unSummarize()
  s.on('data', d => (output += d))
  s.on('end', () => t.equal(output, '1..6\n# win?\n'))
  s.write('1..6\n')
  s.write('# tests 6\n')
  s.write('# pass  6\n')
  s.write('\n')
  s.write('# ok\n')
  s.write('# win?\n')
  s.end()
})

test('removes fail summary', t => {
  t.plan(1)
  let output = ''
  const s = unSummarize()
  s.on('data', d => (output += d))
  s.on('end', () => t.equal(output, 'not ok\n1..10\n# win?\n'))
  s.write('not ok\n')
  s.write('1..10\n')
  s.write('# tests 10\n')
  s.write('# pass  8\n')
  s.write('# fail  2\n')
  s.write('# win?\n')
  s.end()
})

test(`doesn't remove almost ok summary`, t => {
  t.plan(1)
  const input = [
    '1..6\n',
    '# tests 6\n',
    '# pass  6\n',
    '\n',
    '# win?\n'
  ]
  let output = ''
  const s = unSummarize()
  s.on('data', d => (output += d))
  s.on('end', () => t.equal(output, input.join('')))
  input.forEach(inp => s.write(inp))
  s.end()
})

test(`doesn't remove almost fail summary`, t => {
  t.plan(1)
  const input = [
    '1..6\n',
    '# tests 6\n',
    '# fail  5\n',
    '# win?\n'
  ]
  let output = ''
  const s = unSummarize()
  s.on('data', d => (output += d))
  s.on('end', () => t.equal(output, input.join('')))
  input.forEach(inp => s.write(inp))
  s.end()
})
