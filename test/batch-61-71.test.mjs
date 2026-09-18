import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Readable } from 'node:stream';
import { renderOutput, registerTools, getFocus, clearFocus, sessionKey } from '../lib/tools.js';
import { isNewerVersion } from '../lib/updater.js';
import { readBody, isTrustedRequest, isTrustedUpdateRequest } from '../lib/http.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientPath = path.join(root, 'lib/client.js');
const clientSrc = fs.readFileSync(clientPath, 'utf8');
const indexPath = path.join(root, 'lib/index.js');
const indexSrc = fs.readFileSync(indexPath, 'utf8');

// #71 (GH #2): output.render contract
test('#71 (GH #2): renderOutput returns ContentBlock[] array with type and text', () => {
  const resultObj = { success: true, count: 42 };
  const blocks = renderOutput({}, resultObj);
  assert.ok(Array.isArray(blocks), 'renderOutput must return an array');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'text');
  assert.ok(blocks[0].text.includes('"success": true'));

  // Verify @deepseek-ai/dsh-llm contentHasImage iterator works without TypeError
  function contentHasImage(content) {
    return content.some(block => block.type === 'image'
      || (block.type === 'tool-result' && contentHasImage(block.content)));
  }
  assert.doesNotThrow(() => {
    const hasImg = contentHasImage(blocks);
    assert.equal(hasImg, false);
  });
});

test('#71 (GH #2): all registered tools have output.render returning ContentBlock[]', async () => {
  const registeredTools = [];
  const fakeCtx = {
    tools: {
      register: (toolDef) => {
        registeredTools.push(toolDef);
      }
    }
  };

  registerTools(fakeCtx, { getConfig: () => ({}), maybeTrack: () => {} });
  assert.ok(registeredTools.length >= 5, 'All 5 context-lens tools should be registered');

  for (const t of registeredTools) {
    assert.ok(t.output, `Tool ${t.name} must have output definition`);
    assert.ok(typeof t.output.render === 'function', `Tool ${t.name} must have render function`);
    const rendered = t.output.render({}, { success: true });
    assert.ok(Array.isArray(rendered), `Tool ${t.name} render() must return an array`);
    assert.ok(rendered.length > 0);
    assert.equal(rendered[0].type, 'text');
    assert.ok(typeof rendered[0].text === 'string');
  }
});

// #62 & #63 & #70: Server routes security and validation checks in lib/index.js
test('#62: lib/index.js enforces POST method and trusted source check on /clear-focus', () => {
  assert.ok(indexSrc.includes("path: '/dsh-context-lens/clear-focus'"));
  assert.ok(indexSrc.includes("req.method !== 'POST'"), 'Must require POST method');
  assert.ok(indexSrc.includes('isTrustedRequest(req)'), 'Must check isTrustedRequest');
  assert.ok(indexSrc.includes("res.writeHead(405"), 'Must return 405 for non-POST');
  assert.ok(indexSrc.includes("writeJson(res, 403"), 'Must return 403 for untrusted');
});

test('#63: lib/index.js enforces 256KB body limit and clamped maxLines on /compress-preview', () => {
  assert.ok(indexSrc.includes("path: '/dsh-context-lens/compress-preview'"));
  assert.ok(indexSrc.includes('readBody(req, 256 * 1024)'), 'Must enforce 256KB body limit');
  assert.ok(indexSrc.includes("writeJson(res, 413"), 'Must return 413 for oversized body');
  assert.ok(indexSrc.includes("parsed < 1 || parsed > 5000"), 'Must clamp maxLines between 1 and 5000');
});

test('#70: lib/index.js properly handles malformed URL/sessionId with 400 and warning log', () => {
  assert.ok(indexSrc.includes("writeJson(res, 400, { ok: false, error: 'Invalid sessionId parameter' })"));
  assert.ok(indexSrc.includes("writeJson(res, 400, { ok: false, error: 'Malformed request URL' })"));
  assert.ok(indexSrc.includes("ctx.logger?.warn?."));
});

// #62 & #63: HTTP security helper unit tests
test('http: isTrustedRequest correctly validates origin, loopback, and sec-fetch-site', () => {
  // Cross-site rejected
  assert.equal(isTrustedRequest({
    headers: { 'sec-fetch-site': 'cross-site', host: '127.0.0.1:3080', origin: 'http://evil.com' }
  }), false);

  // Same-origin accepted
  assert.equal(isTrustedRequest({
    headers: { 'sec-fetch-site': 'same-origin', host: '127.0.0.1:3080', origin: 'http://127.0.0.1:3080' }
  }), true);

  // Loopback remote accepted
  assert.equal(isTrustedRequest({
    socket: { remoteAddress: '127.0.0.1' }
  }), true);
});

test('http: readBody enforces maxBytes limit and reads streams', async () => {
  const streamOk = Readable.from([Buffer.from('hello ')]);
  const res = await readBody(streamOk, 1024);
  assert.equal(res.toString('utf8'), 'hello ');

  const bigStream = Readable.from([Buffer.alloc(2000)]);
  bigStream.destroy = () => {};
  await assert.rejects(async () => {
    await readBody(bigStream, 500);
  }, /body too large/);
});

// #64: SettingsScope declared and lanSettings eliminated
test('#64: client.js declares settingsScope in inject and has 0 references to lanSettings', () => {
  assert.ok(clientSrc.includes("module.exports.inject = ['slots', 'locale', 'settingsScope']"));
  assert.ok(!clientSrc.includes('lanSettings'), 'Must not reference foreign lanSettings');
  assert.ok(clientSrc.includes('_ctx.settingsScope'));
});

// #66: Settings and locale registrations wrapped in ctx.effect
test('#66: sctx.settings.register in index.js and ctx.locale in client.js use effect with cleanup', () => {
  assert.ok(indexSrc.includes("sctx.effect(() => {"), 'index.js must wrap settings.register in sctx.effect');
  assert.ok(indexSrc.includes("scope?.dispose === 'function'"), 'index.js must dispose settings scope');
  assert.ok(clientSrc.includes("ctx.effect(() => {"), 'client.js must wrap locale.register in ctx.effect');
});

// #67: Zero bare rgba in client.js
test('#67: client.js contains zero rgba( color declarations', () => {
  const matches = clientSrc.match(/rgba\(/g);
  assert.equal(matches, null, 'client.js must not contain any rgba( values');
});

// #68: Fallback chevron is an SVG with 14x14 viewBox and transition
test('#68: Fallback chevron in client.js is SVG with 14x14 viewBox and transform transition', () => {
  assert.ok(clientSrc.includes("viewBox: '0 0 14 14'"), 'Chevron must have viewBox 0 0 14 14');
  assert.ok(clientSrc.includes("transition: 'transform .16s ease'"), 'Chevron must animate transform .16s');
  assert.ok(clientSrc.includes("stroke: 'currentColor'"), 'Chevron must use stroke: currentColor');
  assert.ok(!clientSrc.includes("'>'"), 'Must not use raw text symbol');
});

// #61: One-click plugin updater
test('#61: semver parser supports prerelease and updates correctly', () => {
  assert.equal(isNewerVersion('0.1.17', '0.1.18'), true);
  assert.equal(isNewerVersion('0.1.17', '0.1.17'), false);
  assert.equal(isNewerVersion('0.1.18', '0.1.17'), false);
  assert.equal(isNewerVersion('0.1.17-rc.1', '0.1.17'), true);
  assert.equal(isNewerVersion('0.1.17', '0.1.17-rc.1'), false);
  assert.equal(isNewerVersion('0.1.17-rc.1', '0.1.17-rc.2'), true);
});

test('#61: updater module does not pass --config.minimumReleaseAge=0 and uses /api/dsh-context-lens/update', () => {
  const updaterSrc = fs.readFileSync(path.join(root, 'lib/updater.js'), 'utf8');
  assert.ok(!updaterSrc.includes('--config.minimumReleaseAge=0'), 'Must not disable pnpm minimum release age');
  assert.ok(indexSrc.includes("endpoint: '/api/dsh-context-lens/update'"));
  assert.ok(clientSrc.includes("fetch('/api/dsh-context-lens/update'"));
});
// #76: No silent/empty catch blocks in lib/client.js
test('#76: lib/client.js contains zero empty catch blocks and logs slot registration failures', () => {
  const emptyCatchRegex = /catch\s*\([^)]*\)\s*\{\s*(\s*void\s+[a-zA-Z0-9_$]+;\s*)?\}/g;
  const matches = [...clientSrc.matchAll(emptyCatchRegex)];
  assert.equal(matches.length, 0, `Unmarked empty catch blocks found in client.js: ${JSON.stringify(matches.map(m => m[0]))}`);
  assert.ok(clientSrc.includes("[dsh-context-lens] sidebar.right.pane.tab inject failed"));
  assert.ok(clientSrc.includes("[dsh-context-lens] registerPaneTab direct register fallback failed"));
  assert.ok(clientSrc.includes("[dsh-context-lens] utilities inject failed, falling back to direct register"));
  assert.ok(clientSrc.includes("[dsh-context-lens] headerChipRegister fallback failed"));
});
