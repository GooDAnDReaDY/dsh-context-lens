import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { test } from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientPath = path.join(root, 'lib/client.js');
const clientSrc = fs.readFileSync(clientPath, 'utf8');

function loadClientFactory() {
  const mod = { exports: {} };
  const fakeWindow = {};
  fakeWindow.__ModuleLoader__ = {
    load: ({ factory }) => {
      const req = (id) => {
        if (id === 'react') {
          return {
            createElement: (type, props, ...children) => ({ type, props, children }),
            useState: (init) => [init, () => {}],
            useEffect: () => {},
            useRef: () => ({ current: null }),
            useMemo: (fn) => fn(),
            Fragment: 'React.Fragment'
          };
        }
        if (id === '@deepseek-ai/dsh-client-ui-primitives') return {};
        throw new Error(`unexpected require(${id})`);
      };
      const result = factory(req);
      mod.exports = result;
      fakeWindow.__loaded = result;
    }
  };
  const script = new vm.Script(clientSrc, { filename: 'lib/client.js' });
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
    return () => {
      this.registered = this.registered.filter((r) => r.opts !== opts);
    };
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

// 4-state matrix tests for Issue #54:
// Layout 1: Native DSH Sidebar only
// Layout 2: Legacy dsh-better-sidebar only
// Layout 3: Both sidebars enabled simultaneously
// Layout 4: Neither sidebar available (safe fallback)

test('Layout 1: Native DSH Sidebar only registers tab and pane tab slot', () => {
  const client = loadClientFactory();
  const slots = new MockSlotCore();
  slots.declare('settings.plugin.item');
  slots.declare('conversation.session.header.utilities');
  slots.declare('sidebar.right.pane.tab');

  let nativeRegistered = null;
  const mockSidebarRightTabs = {
    register: (def) => {
      nativeRegistered = def;
      return () => { nativeRegistered = null; };
    }
  };

  const ctx = {
    slots,
    locale: { register: () => {} },
    inject: (deps, cb) => {
      if (deps.includes('sidebarRightTabs')) {
        cb({ sidebarRightTabs: mockSidebarRightTabs, effect: (fn) => fn() });
      }
      // betterSidebar is NOT provided
    }
  };

  assert.doesNotThrow(() => client.apply(ctx));
  assert.ok(nativeRegistered, 'native sidebar tab definition was registered');
  assert.equal(nativeRegistered.id, '@goodandready/dsh-context-lens');
  assert.equal(nativeRegistered.kind, 'context-lens');
  assert.equal(nativeRegistered.priority, 'extension');
  assert.equal(nativeRegistered.title(), 'Lens');
  assert.ok(Array.isArray(nativeRegistered.guide));
  assert.equal(nativeRegistered.guide[0].title(), 'Context Lens');

  const paneReg = slots.registered.find((r) => r.opts.name === 'sidebar.right.pane.tab');
  assert.ok(paneReg, 'sidebar.right.pane.tab slot was registered');
  assert.equal(paneReg.opts.key, '@goodandready/dsh-context-lens');
});

test('Layout 2: Legacy dsh-better-sidebar only registers tab', () => {
  const client = loadClientFactory();
  const slots = new MockSlotCore();
  slots.declare('settings.plugin.item');
  slots.declare('conversation.session.header.utilities');

  let legacyRegistered = null;
  const mockBetterSidebar = {
    registerTab: (def) => {
      legacyRegistered = def;
      return () => { legacyRegistered = null; };
    }
  };

  const ctx = {
    slots,
    locale: { register: () => {} },
    inject: (deps, cb) => {
      if (deps.includes('betterSidebar')) {
        cb({ betterSidebar: mockBetterSidebar, effect: (fn) => fn() });
      }
      // sidebarRightTabs is NOT provided
    }
  };

  assert.doesNotThrow(() => client.apply(ctx));
  assert.ok(legacyRegistered, 'legacy betterSidebar tab was registered');
  assert.equal(legacyRegistered.id, 'dsh-context-lens:tab');
  assert.equal(legacyRegistered.title(), 'Lens');
  assert.equal(legacyRegistered.order, 50);

  const paneReg = slots.registered.find((r) => r.opts.name === 'sidebar.right.pane.tab');
  assert.equal(paneReg, undefined, 'sidebar.right.pane.tab should not be registered without native sidebar');
});

test('Layout 3: Both sidebars enabled register distinct, non-conflicting IDs', () => {
  const client = loadClientFactory();
  const slots = new MockSlotCore();
  slots.declare('settings.plugin.item');
  slots.declare('conversation.session.header.utilities');
  slots.declare('sidebar.right.pane.tab');

  let nativeRegistered = null;
  const mockSidebarRightTabs = {
    register: (def) => {
      nativeRegistered = def;
      return () => { nativeRegistered = null; };
    }
  };

  let legacyRegistered = null;
  const mockBetterSidebar = {
    registerTab: (def) => {
      legacyRegistered = def;
      return () => { legacyRegistered = null; };
    }
  };

  const ctx = {
    slots,
    locale: { register: () => {} },
    inject: (deps, cb) => {
      if (deps.includes('sidebarRightTabs')) {
        cb({ sidebarRightTabs: mockSidebarRightTabs, effect: (fn) => fn() });
      }
      if (deps.includes('betterSidebar')) {
        cb({ betterSidebar: mockBetterSidebar, effect: (fn) => fn() });
      }
    }
  };

  assert.doesNotThrow(() => client.apply(ctx));
  assert.ok(nativeRegistered, 'native sidebar tab registered');
  assert.ok(legacyRegistered, 'legacy betterSidebar tab registered');
  assert.notEqual(nativeRegistered.id, legacyRegistered.id, 'tab IDs must be distinct and non-conflicting');
  assert.equal(nativeRegistered.id, '@goodandready/dsh-context-lens');
  assert.equal(legacyRegistered.id, 'dsh-context-lens:tab');

  const paneReg = slots.registered.find((r) => r.opts.name === 'sidebar.right.pane.tab');
  assert.ok(paneReg, 'sidebar.right.pane.tab slot registered');
  assert.equal(paneReg.opts.key, '@goodandready/dsh-context-lens');
});

test('Layout 4: Neither sidebar available boots cleanly without uncaught errors', () => {
  const client = loadClientFactory();
  const slots = new MockSlotCore();
  slots.declare('settings.plugin.item');
  slots.declare('conversation.session.header.utilities');

  const ctx = {
    slots,
    locale: { register: () => {} },
    inject: (deps, cb) => {
      // Neither service provided
    }
  };

  assert.doesNotThrow(() => client.apply(ctx));
  const paneReg = slots.registered.find((r) => r.opts.name === 'sidebar.right.pane.tab');
  assert.equal(paneReg, undefined);
  // Settings card and header chip should still register
  assert.ok(slots.registered.some((r) => r.opts.name === 'settings.plugin.item'));
  assert.ok(slots.registered.some((r) => r.opts.name === 'conversation.session.header.utilities'));
});
