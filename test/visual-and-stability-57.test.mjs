import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compressLog } from '../lib/compression/log-compressor.js';
import { skeletonize } from '../lib/ast/skeletonizer.js';
import { shouldAutoCompress } from '../lib/auto-compress.js';
import * as tracker from '../lib/tokens/tracker.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientSrc = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf8');

test('client.js includes dsh-clinebot CSS classes and tokens', () => {
  const requiredCssSelectors = [
    '.cl-section-card',
    '.cl-section-header',
    '.cl-badge',
    '.cl-badge-ok',
    '.cl-badge-warn',
    '.cl-stat-grid',
    '.cl-stat-box',
    '.cl-stat-val',
    '.cl-stat-lbl',
    '.cl-bar-box',
    '.cl-bar-track',
    '.cl-bar-fill',
    '.cl-input',
    '.cl-btn',
    '.cl-btn-primary',
    '.cl-banner-warn',
    '.cl-hist-item',
    '.cl-error-box'
  ];

  for (const sel of requiredCssSelectors) {
    assert.ok(clientSrc.includes(sel), `client.js must include CSS class: ${sel}`);
  }
});

test('client.js components are wrapped in ErrorBoundary', () => {
  assert.ok(clientSrc.includes('createErrorBoundary'), 'client.js must declare createErrorBoundary');
  assert.ok(clientSrc.includes('ErrorBoundary'), 'client.js must instantiate ErrorBoundary');
  assert.ok(clientSrc.includes('LensTabInner'), 'client.js must define LensTabInner for ErrorBoundary wrapping');
  assert.ok(clientSrc.includes('PluginCardInner'), 'client.js must define PluginCardInner for ErrorBoundary wrapping');
});

test('client.js calls ensureCss across all visual surfaces', () => {
  assert.ok(clientSrc.includes('ensureCss()'), 'client.js must call ensureCss');
  // ensureCss injected inside StatusPanel, HeaderChip, LensTabInner, PluginCardInner
  const matches = clientSrc.match(/ensureCss\(\);/g);
  assert.ok(matches && matches.length >= 4, 'ensureCss must be called across all 4 visual entrypoints');
});

test('client.js binds lanSettings or settingsScope reactively', () => {
  assert.ok(clientSrc.includes("lanSettings"), 'client.js must check lanSettings for DSH compatibility');
  assert.ok(clientSrc.includes("scope.subscribe"), 'client.js must subscribe to settings updates');
  assert.ok(clientSrc.includes("getSnapshot"), 'client.js must support getSnapshot for instantaneous reads');
});

test('compressLog handles unexpected, malformed, and non-string inputs safely', () => {
  const emptyRes = compressLog('');
  assert.equal(emptyRes.compressed, '');
  assert.equal(emptyRes.savedTokens, 0);

  const nullRes = compressLog(null);
  assert.equal(nullRes.compressed, '');
  assert.equal(nullRes.totalLines, 0);

  const undefRes = compressLog(undefined);
  assert.equal(undefRes.compressed, '');

  const numRes = compressLog(12345);
  assert.equal(numRes.compressed, '');

  const objRes = compressLog({ text: 'fail' });
  assert.equal(objRes.compressed, '');
});

test('skeletonize handles unexpected and non-string inputs safely', () => {
  assert.equal(skeletonize(null), '');
  assert.equal(skeletonize(undefined), '');
  assert.equal(skeletonize(12345), '');
  assert.equal(skeletonize({}), '');
  assert.equal(skeletonize(''), '');
});

test('shouldAutoCompress handles falsy and extreme arguments safely', () => {
  assert.equal(shouldAutoCompress(null, 100), false);
  assert.equal(shouldAutoCompress(undefined, 100), false);
  assert.equal(shouldAutoCompress('test', 0), false);
  assert.equal(shouldAutoCompress('test', -10), false);
  assert.equal(shouldAutoCompress('test', null), false);
  assert.equal(shouldAutoCompress('x'.repeat(200), 100), true);
});

test('tracker handles empty or identical inputs without negative savings', () => {
  tracker.reset();
  const res = tracker.record('', '');
  assert.equal(res.savedTokens, 0);
  assert.equal(res.originalTokens, 0);
  assert.equal(res.compressedTokens, 0);

  const same = tracker.record('hello world', 'hello world');
  assert.equal(same.savedTokens, 0);

  const stats = tracker.getStats();
  assert.ok(stats.savedTokens >= 0);
  assert.ok(stats.savedPercent >= 0);
});
