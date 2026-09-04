import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { test } from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientPath = path.join(root, 'lib/client.js');
const clientSrc = fs.readFileSync(clientPath, 'utf8');

// Helper to load the ModuleLoader client factory with mocks
function loadClientFactory() {
  const mod = { exports: {} };
  const fakeWindow = {};
  fakeWindow.__ModuleLoader__ = {
    load: ({ factory }) => {
      const req = (id) => {
        if (id === 'react') return { createElement: () => null, useState: () => [null, () => {}], useEffect: () => {}, useRef: () => ({ current: null }) };
        if (id === '@deepseek-ai/dsh-client-ui-primitives') return {};
        throw new Error(`unexpected require(${id})`);
      };
      const result = factory(req);
      mod.exports = result;
      fakeWindow.__loaded = result;
    }
  };
  const ctx = { window: fakeWindow };
  const script = new vm.Script(clientSrc, { filename: 'lib/client.js' });
  const sandbox = { window: fakeWindow, module: mod, exports: mod.exports, require: () => { throw new Error('top-level require not expected'); } };
  // Provide global window for the script
  const context = vm.createContext({ window: fakeWindow, console });
  script.runInContext(context);
  return fakeWindow.__loaded;
}

class MockSlotCore {
  constructor() {
    this.declared = new Set();
    this.registered = [];
    this.pendingInject = new Map();
  }
  declare(name) {
    this.declared.add(name);
    const pending = this.pendingInject.get(name) || [];
    for (const fn of pending) fn();
    this.pendingInject.delete(name);
  }
  register(opts, comp) {
    if (!this.declared.has(opts.name)) throw new Error(`slot "${opts.name}" is not declared`);
    this.registered.push({ opts, comp });
    return () => {};
  }
  inject(name, factory) {
    if (this.declared.has(name)) {
      factory();
      return true;
    }
    if (!this.pendingInject.has(name)) this.pendingInject.set(name, []);
    this.pendingInject.get(name).push(factory);
    return true;
  }
}

test('client registers settings.plugin.item via inject (declaration-aware)', () => {
  const client = loadClientFactory();
  assert.ok(client, 'client module loaded');
  assert.ok(Array.isArray(client.inject), 'client.inject is array');
  // apply-before-declaration should not throw AggregateError
  const slots = new MockSlotCore();
  const locale = { register: () => {} };
  const ctx = { slots, locale };
  // Should not throw even though slot not declared yet
  assert.doesNotThrow(() => client.apply(ctx), 'apply before declaration must not throw');
  assert.equal(slots.registered.length, 0, 'should not have registered yet before declaration');
  // Now declare the slot and verify registration happens
  slots.declare('settings.plugin.item');
  assert.equal(slots.registered.length, 1, 'should have registered after declaration via inject');
  assert.equal(slots.registered[0].opts.name, 'settings.plugin.item');
  assert.equal(slots.registered[0].opts.key, '@goodandready/dsh-context-lens');
});

test('client apply after declaration also registers', () => {
  const client = loadClientFactory();
  const slots = new MockSlotCore();
  slots.declare('settings.plugin.item');
  const locale = { register: () => {} };
  const ctx = { slots, locale };
  assert.doesNotThrow(() => client.apply(ctx));
  assert.equal(slots.registered.length, 1);
});

test('client does not silently swallow real registration errors', () => {
  const client = loadClientFactory();
  const slots = new MockSlotCore();
  slots.declare('settings.plugin.item');
  // Make register throw for a different reason (not not-declared)
  const originalRegister = slots.register.bind(slots);
  slots.register = (opts, comp) => {
    if (opts.key === '@goodandready/dsh-context-lens') throw new Error('simulated real registration failure');
    return originalRegister(opts, comp);
  };
  const locale = { register: () => {} };
  const ctx = { slots, locale };
  // Our client should surface the error (throw or log), not silently swallow
  // We check that apply throws or at least logs error — in our implementation it logs and re-throws
  assert.throws(() => client.apply(ctx), /simulated real registration failure/);
});

test('package.json inject does not contain removed runtime', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const inject = pkg.dsh?.client?.inject || [];
  assert.equal(inject.includes('@deepseek-ai/dsh-client-runtime'), false, 'must not contain dsh-client-runtime');
  assert.equal(inject.includes('@deepseek-ai/dsh-client-ui-slots'), false, 'must contain ui-slots — инвертировано для ядра 0.1.2-rc.1 (модуль убран)');
});

test('client registers conversation.session.header.utilities chip via inject (#31)', () => {
  const client = loadClientFactory();
  const slots = new MockSlotCore();
  const locale = { register: () => {} };
  const ctx = { slots, locale };
  assert.doesNotThrow(() => client.apply(ctx));
  assert.equal(slots.registered.length, 0, 'should not register before declaration');
  slots.declare('conversation.session.header.utilities');
  assert.equal(slots.registered.length, 1, 'should register header chip after declaration');
  assert.equal(slots.registered[0].opts.name, 'conversation.session.header.utilities');
  assert.equal(slots.registered[0].opts.id, 'dsh-context-lens-header-chip');
  assert.equal(slots.registered[0].opts.order, 7);
});

