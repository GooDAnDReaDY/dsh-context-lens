import test from 'node:test';
import assert from 'node:assert/strict';
import { name, Config } from '../lib/index.js';

test('dsh-context-lens exports valid name and schema', () => {
  assert.equal(name, '@goodandready-private/dsh-context-lens');
  assert.ok(Config);
});
