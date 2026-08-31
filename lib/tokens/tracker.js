// ponytail: in-memory per-process tracker + history, no DB
let totalOriginal = 0;
let totalCompressed = 0;
let calls = 0;
const history = []; // last 10
const MAX_HISTORY = 10;
const BUDGET_LIMIT = 100000; // tokens, ~100k default budget

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

export function record(originalText, compressedText) {
  const o = estimateTokens(originalText);
  const c = estimateTokens(compressedText);
  const saved = Math.max(0, o - c);
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

export function getStats() {
  const saved = Math.max(0, totalOriginal - totalCompressed);
  const pct = totalOriginal ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;
  const budgetUsed = totalCompressed;
  const budgetRemaining = Math.max(0, BUDGET_LIMIT - budgetUsed);
  const budgetPercent = Math.min(100, Math.round((budgetUsed / BUDGET_LIMIT) * 100));
  const lowBudget = budgetPercent > 90;
  return { totalOriginal, totalCompressed, savedTokens: saved, savedPercent: pct, calls, budgetUsed, budgetRemaining, budgetPercent, lowBudget, budgetLimit: BUDGET_LIMIT };
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
}

export default { estimateTokens, record, getStats, getHistory, clearHistory, reset };
