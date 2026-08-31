import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compressLog } from '../lib/compression/log-compressor.js';
import { skeletonize } from '../lib/ast/skeletonizer.js';
import * as tracker from '../lib/tokens/tracker.js';

test('compressor keeps cargo/Java failures (#17)', () => {
  const log = ['   Compiling foo v0.1.0', 'error[E0432]: unresolved import', "thread 'main' panicked at 'boom'", 'test result: FAILED. 1 passed; 1 failed', 'BUILD FAILED in 2s', 'Tests run: 3, Failures: 1'].join('\n');
  const res = compressLog(log, { mode: 'balanced' });
  for (const frag of ['error[E0432]', 'panicked', 'test result: FAILED', 'BUILD FAILED', 'Tests run: 3']) {
    assert.ok(res.compressed.includes(frag), 'missing: ' + frag);
  }
  assert.ok(!compressLog('   Compiling foo v0.1.0', { mode: 'raw' }).compressed.includes('Compiling'), 'noise not dropped in raw mode');
});

test('skeletonizer keeps imports and doc comments, drops bodies (#19)', () => {
  const code = [
    "import { foo } from './foo.js';",
    '/** Adds one */',
    'export function add(n) {',
    '  return n + 1;',
    '}'
  ].join('\n');
  const sk = skeletonize(code, { language: 'ts' });
  assert.ok(sk.includes("import { foo }"), 'import kept');
  assert.ok(sk.includes('/** Adds one */'), 'doc comment kept');
  assert.ok(sk.includes('export function add(n)'), 'signature kept');
  assert.ok(!sk.includes('return n + 1'), 'body dropped');
});

test('rust signatures are recognized (#17)', () => {
  const code = ['pub fn main() {', '  println!("hi");', '}', 'struct Point {', '  x: i32,', '}'].join('\n');
  const sk = skeletonize(code, { language: 'rust' });
  assert.ok(sk.includes('pub fn main()'), 'fn kept');
  assert.ok(sk.includes('struct Point'), 'struct kept');
});

test('tracker exposes budget and history (#16/#21)', () => {
  tracker.reset();
  tracker.record('a'.repeat(400), 'b'.repeat(100));
  const stats = tracker.getStats();
  assert.equal(stats.calls, 1);
  assert.equal(stats.budgetUsed, 25);
  assert.ok(stats.budgetRemaining > 0);
  assert.equal(stats.budgetPercent, 0);
  assert.ok(!stats.lowBudget);
  const hist = tracker.getHistory();
  assert.equal(hist.length, 1);
  assert.equal(hist[0].savedTokens, 75);
  assert.ok(hist[0].timestamp);
  tracker.clearHistory();
  assert.equal(tracker.getHistory().length, 0);
  tracker.reset();
});
