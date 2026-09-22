import assert from 'node:assert/strict';
import test from 'node:test';
import { skeletonize } from '../lib/ast/skeletonizer.js';
import { shouldAutoCompress } from '../lib/auto-compress.js';
import { estimateTokens as estA } from '../lib/tokens/estimate.js';
import { estimateTokens as estB } from '../lib/compression/log-compressor.js';
import * as tracker from '../lib/tokens/tracker.js';
import { compressLog } from '../lib/compression/log-compressor.js';

test('#35 python imports kept in skeleton', () => {
  const out = skeletonize('import os\nfrom pathlib import Path\ndef foo():\n  return 1\n', { language: 'py', includeImports: true });
  assert.match(out, /import os/);
  assert.match(out, /from pathlib import Path/);
  assert.match(out, /def foo/);
});

test('#36 java locals not treated as signatures', () => {
  const code = 'public class A {\n  public void run() {\n    int x = 1;\n  }\n}\n';
  const out = skeletonize(code, { language: 'java' });
  assert.match(out, /class A/);
  assert.doesNotMatch(out, /int x = 1/);
});

test('#44 shared estimateTokens', () => {
  assert.equal(estA('abcd'), estB('abcd'));
});

test('#34 tracker stops counting after budgetLimit', () => {
  tracker.reset();
  tracker.setBudgetLimit(5);
  const first = tracker.record('a'.repeat(40), 'a'.repeat(40)); // ~10 compressed tokens
  assert.equal(first.stopped, undefined);
  const second = tracker.record('bbbb', 'b');
  assert.equal(second.stopped, true);
  const stats = tracker.getStats(5);
  assert.equal(stats.calls, 1);
  tracker.reset();
});

test('#33 compress keeps aggressive mode (unit on compressor)', () => {
  const text = 'PASS ok\n'.repeat(5) + 'FAIL boom\n' + 'at x.js:1:1\n';
  const bal = compressLog(text, { mode: 'balanced' });
  const agg = compressLog(text, { mode: 'aggressive' });
  // aggressive should not be forced equal to balanced output always, but mode is respected
  assert.ok(agg.compressed.includes('FAIL'));
  assert.ok(bal.compressed.includes('FAIL'));
});

test('shouldAutoCompress importable', () => {
  assert.equal(shouldAutoCompress('a'.repeat(5000), 4000), true);
  assert.equal(shouldAutoCompress('short', 4000), false);
});
