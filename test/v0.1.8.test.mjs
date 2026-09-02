import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compressLog } from '../lib/compression/log-compressor.js';
import { skeletonize } from '../lib/ast/skeletonizer.js';
import * as tracker from '../lib/tokens/tracker.js';

function shouldAutoCompress(text, threshold) {
  if (!threshold || threshold <= 0) return false;
  return (text || '').length > threshold || (text || '').split('\n').length > 100;
}

test('compressLog handles colored terminal logs with ANSI codes', () => {
  const coloredLog = [
    '\u001b[32mPASS\u001b[39m src/foo.test.js',
    '\u001b[31mFAIL\u001b[39m src/bar.test.js',
    '  ● bar > fails here',
    '    Expected: \u001b[32m1\u001b[39m',
    '    Received: \u001b[31m2\u001b[39m',
    '    at Object.<anonymous> (src/bar.test.js:10:5)'
  ].join('\n');
  const res = compressLog(coloredLog, { mode: 'balanced' });
  assert.ok(res.compressed.includes('FAIL'), 'FAIL preserved');
  assert.ok(res.compressed.includes('Expected:'), 'Expected preserved');
  assert.ok(res.compressed.includes('Received:'), 'Received preserved');
  assert.ok(!res.compressed.includes('PASS src/foo.test.js'), 'PASS filtered out');
});

test('raw mode correctly filters noise lines', () => {
  const log = [
    'npm info using npm@10.0.0',
    'Browserslist: caniuse-lite is outdated',
    'FAIL src/app.test.js',
    'Done in 1.2s'
  ].join('\n');
  const res = compressLog(log, { mode: 'raw' });
  assert.ok(res.compressed.includes('FAIL src/app.test.js'));
  assert.ok(!res.compressed.includes('npm info'));
  assert.ok(!res.compressed.includes('Browserslist'));
});

test('tracker supports dynamic budgetLimit override and setBudgetLimit', () => {
  tracker.reset();
  tracker.record('a'.repeat(400), 'b'.repeat(200)); // 50 tokens compressed
  const stats50k = tracker.getStats(50000);
  assert.equal(stats50k.budgetLimit, 50000);
  assert.equal(stats50k.budgetUsed, 50);
  assert.equal(stats50k.budgetRemaining, 49950);

  tracker.setBudgetLimit(200000);
  const stats200k = tracker.getStats();
  assert.equal(stats200k.budgetLimit, 200000);
  tracker.reset();
});

test('skeletonizer supports rust async fn, pub(crate), and use imports', () => {
  const code = [
    'use std::sync::Arc;',
    'pub(crate) async fn fetch_data() -> Result<Data, Error> {',
    '    let x = 1;',
    '    Ok(x)',
    '}',
    'pub async fn run() {',
    '    println!("hello");',
    '}'
  ].join('\n');
  const sk = skeletonize(code, { language: 'rust' });
  assert.ok(sk.includes('use std::sync::Arc;'), 'use kept');
  assert.ok(sk.includes('pub(crate) async fn fetch_data()'), 'pub(crate) async fn kept');
  assert.ok(sk.includes('pub async fn run()'), 'pub async fn kept');
  assert.ok(!sk.includes('let x = 1;'), 'function body dropped');
});

test('skeletonizer uses # comment prefix for python files', () => {
  const pyCode = [
    '# Top module comment',
    'def calculate(a, b):',
    '    x = a + b',
    '    y = x * 2',
    '    return y',
    'class Handler:',
    '    def process(self):',
    '        pass'
  ].join('\n');
  const sk = skeletonize(pyCode, { language: 'py' });
  assert.ok(sk.includes('def calculate(a, b)'), 'def kept');
  assert.ok(sk.includes('class Handler'), 'class kept');
  assert.ok(sk.includes('# ...'), 'Python comment style used');
  assert.ok(!sk.includes('// ...'), 'JS comment style not used for python');
});

test('shouldAutoCompress triggers on threshold or line count', () => {
  assert.equal(shouldAutoCompress('a'.repeat(5000), 4000), true);
  assert.equal(shouldAutoCompress('short', 4000), false);
  assert.equal(shouldAutoCompress(new Array(150).fill('line').join('\n'), 4000), true);
  assert.equal(shouldAutoCompress('short', 0), false);
});
