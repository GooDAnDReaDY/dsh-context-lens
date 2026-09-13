import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { skeletonize } from '../lib/ast/skeletonizer.js';
import * as tracker from '../lib/tokens/tracker.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientSrc = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf8');

test('client.js strictly excludes embedded Russian translations and provides native Chinese (zh)', () => {
  // Russian dictionary and keys must not be present
  assert.ok(!clientSrc.includes('const ru ='), 'client.js must not declare const ru');
  assert.ok(!clientSrc.includes("snap.active.startsWith('ru')"), 'client.js must not check for ru locale');
  assert.ok(!clientSrc.includes('Сжатие AST'), 'client.js must not contain hardcoded Russian strings');

  // Chinese dictionary must be present
  assert.ok(clientSrc.includes('const zh ='), 'client.js must declare const zh');
  assert.ok(clientSrc.includes("snap.active.startsWith('zh')"), 'client.js must check for zh locale');
  assert.ok(clientSrc.includes('ctx.locale.register(NS, { en, zh })'), 'client.js must register { en, zh }');
  assert.ok(clientSrc.includes('上下文镜头与 Token 守卫'), 'client.js must include Chinese title');
});

test('client.js and status panel support session focus management and clear focus', () => {
  assert.ok(clientSrc.includes('focusPaths:'), 'client.js dictionaries must include focusPaths');
  assert.ok(clientSrc.includes('clearFocus:'), 'client.js dictionaries must include clearFocus');
  assert.ok(clientSrc.includes('clearLensFocus'), 'client.js must implement clearLensFocus API call');
  assert.ok(clientSrc.includes('/dsh-context-lens/clear-focus'), 'client.js must call clear-focus endpoint');
  assert.ok(clientSrc.includes('cl-tag'), 'client.js must use .cl-tag for focus paths');
});

test('tracker supports configurable budgetAlertPercent and warns dynamically', () => {
  tracker.reset();
  tracker.setBudgetLimit(10000);
  tracker.setBudgetAlertPercent(80); // alert at 80%

  // Record 7000 compressed tokens -> 70% used -> no warning yet
  tracker.record('a'.repeat(28000), 'b'.repeat(28000));
  let stats = tracker.getStats(10000, 80);
  assert.equal(stats.lowBudget, false, '70% used is below 80% alert threshold');

  // Record another 1500 tokens -> 85% used -> warning triggered
  tracker.record('c'.repeat(6000), 'd'.repeat(6000));
  stats = tracker.getStats(10000, 80);
  assert.equal(stats.lowBudget, true, '85% used triggers 80% alert threshold');
  assert.equal(stats.budgetAlertPercent, 80);
});

test('skeletonizer supports C/C++ classes, methods, and #include directives', () => {
  const cppCode = `
#include <iostream>
#include <vector>

// Engine controller class
class EngineController : public BaseController {
public:
    virtual void start(int timeout) override {
        std::cout << "Starting engine" << std::endl;
        doInternalStartup();
    }
    int getRpm() const noexcept {
        return m_rpm;
    }
private:
    int m_rpm = 0;
};
`;
  const sk = skeletonize(cppCode, { language: 'cpp' });
  assert.ok(sk.includes('#include <iostream>'), 'keeps #include directives');
  assert.ok(sk.includes('class EngineController : public BaseController'), 'detects C++ class declaration');
  assert.ok(sk.includes('virtual void start(int timeout) override'), 'detects virtual method signature without body');
  assert.ok(sk.includes('int getRpm() const noexcept'), 'detects const noexcept method signature');
  assert.ok(!sk.includes('std::cout'), 'collapses method bodies');
});

test('skeletonizer supports SQL DDL statements and -- comments', () => {
  const sqlCode = `
-- Database initialization schema
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE INDEX idx_users_email ON users(email);

ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
`;
  const sk = skeletonize(sqlCode, { language: 'sql' });
  assert.ok(sk.includes('CREATE TABLE IF NOT EXISTS users'), 'keeps CREATE TABLE');
  assert.ok(sk.includes('CREATE INDEX idx_users_email ON users(email)'), 'keeps CREATE INDEX');
  assert.ok(sk.includes('ALTER TABLE users ADD COLUMN updated_at'), 'keeps ALTER TABLE');
  assert.ok(sk.includes('-- ...'), 'uses -- comment prefix for collapsed SQL lines');
});