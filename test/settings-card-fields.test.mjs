import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexSrc = fs.readFileSync(path.join(root, 'lib/index.js'), 'utf8');
const clientSrc = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf8');

test('all schema fields in lib/index.js Config are exposed and editable in lib/client.js PluginCard', () => {
  const configMatch = indexSrc.match(/export const Config = z\.object\(\{([\s\S]*?)\}\);/);
  assert.ok(configMatch, 'Config schema found in lib/index.js');

  const schemaFields = [];
  for (const line of configMatch[1].split('\n')) {
    const m = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (m) schemaFields.push(m[1]);
  }

  assert.equal(schemaFields.length, 6, 'Config should declare exactly 6 fields');
  assert.deepEqual(schemaFields, [
    'compressionMode',
    'astSkeletonMaxDepth',
    'tokenSavingsTracking',
    'autoCompressThreshold',
    'budgetLimit',
    'autoCollapse'
  ]);

  // Verify that all 6 fields are present in the PluginCard draft state and inputs
  for (const field of schemaFields) {
    assert.ok(clientSrc.includes(field), `Field "${field}" must be present in lib/client.js`);
    assert.ok(
      clientSrc.includes(`draft.${field}`) || clientSrc.includes(`${field}:`),
      `Field "${field}" must be wired to draft state in PluginCard`
    );
  }
});
