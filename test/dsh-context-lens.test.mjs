import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const pkg = JSON.parse(read('package.json'));
const name = '@goodandready/dsh-context-lens';

test('public package identity matches all loader sites', () => {
  assert.equal(pkg.name, name);
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.publishConfig, undefined);
  assert.ok(read('cordis.patch.yml').includes("name: '@goodandready/dsh-context-lens'"));
  assert.ok(read('lib/client.js').includes("id: '@goodandready/dsh-context-lens'"));
});

test('tracked package sources contain no host-specific infra references', () => {
  const tracked = ['README.md', 'AGENTS.md', 'index.md', 'package.json', 'cordis.patch.yml', 'lib/client.js', 'lib/index.js'];
  for (const file of tracked) {
    const text = read(file);
    for (const marker of ['/' + 'home/', '/' + 'mnt/', '192.' + '168.', 'f' + 'ile:']) {
      assert.equal(text.includes(marker), false, file + ' contains ' + marker);
    }
  }
});

test('browser entry does not depend on removed dsh-client-runtime (alpha2)', () => {
  const inject = pkg.dsh?.client?.inject || [];
  assert.equal(inject.includes('@deepseek-ai/dsh-client-runtime'), false, 'inject must not contain dsh-client-runtime for DSH 0.1.2-alpha.2');
  assert.ok(inject.includes('@deepseek-ai/dsh-client-ui-slots'), 'inject must contain dsh-client-ui-slots');
  const clientText = read('lib/client.js');
  assert.equal(clientText.includes('@deepseek-ai/dsh-client-runtime'), false, 'client.js must not require dsh-client-runtime');
});
