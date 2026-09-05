// ponytail: in-memory per-process tracker + history, no DB
import { estimateTokens } from './estimate.js';

let totalOriginal = 0;
let totalCompressed = 0;
let calls = 0;
const history = []; // last 10
const MAX_HISTORY = 10;
let defaultBudgetLimit = 100000; // tokens

export { estimateTokens };

export function setBudgetLimit(limit) {
  if (typeof limit === 'number' && limit > 0) {
    defaultBudgetLimit = limit;
  }
}

export function record(originalText, compressedText) {
  const o = estimateTokens(originalText);
  const c = estimateTokens(compressedText);
  const saved = Math.max(0, o - c);
  // #34: stop counting after budgetLimit (description promised this)
  if (totalCompressed >= defaultBudgetLimit) {
    return { originalTokens: o, compressedTokens: c, savedTokens: 0, stopped: true };
  }
  totalOriginal += o;
  totalCompressed += c;
  calls++;
  const entry = {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    originalTokens: o,
    compressedTokens: c,
    savedTokens: saved,
    savedPercent: o ? Math.round((1 - c / o) * 100) : 0,
    timestamp: new Date().toISOString(),
    preview: (compressedText || '').slice(0, 120)
  };
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();
  return { originalTokens: o, compressedTokens: c, savedTokens: saved };
}

export function getStats(budgetLimitOverride) {
  const limit = (typeof budgetLimitOverride === 'number' && budgetLimitOverride > 0)
    ? budgetLimitOverride
    : defaultBudgetLimit;
  const saved = Math.max(0, totalOriginal - totalCompressed);
  const pct = totalOriginal ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;
  const budgetUsed = totalCompressed;
  const budgetRemaining = Math.max(0, limit - budgetUsed);
  const budgetPercent = Math.min(100, Math.round((budgetUsed / limit) * 100));
  const lowBudget = budgetPercent > 90;
  return {
    totalOriginal,
    totalCompressed,
    savedTokens: saved,
    savedPercent: pct,
    calls,
    budgetUsed,
    budgetRemaining,
    budgetPercent,
    lowBudget,
    budgetLimit: limit,
    countingStopped: budgetUsed >= limit
  };
}

export function getHistory() {
  return [...history];
}

export function clearHistory() {
  history.length = 0;
}

export function reset() {
  totalOriginal = 0;
  totalCompressed = 0;
  calls = 0;
  history.length = 0;
  defaultBudgetLimit = 100000;
}

export default { estimateTokens, setBudgetLimit, record, getStats, getHistory, clearHistory, reset };
