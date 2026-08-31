// ponytail: in-memory per-process tracker, no DB
let totalOriginal = 0;
let totalCompressed = 0;
let calls = 0;

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

export function record(originalText, compressedText) {
  const o = estimateTokens(originalText);
  const c = estimateTokens(compressedText);
  totalOriginal += o;
  totalCompressed += c;
  calls++;
  return { originalTokens: o, compressedTokens: c, savedTokens: Math.max(0, o - c) };
}

export function getStats() {
  const saved = Math.max(0, totalOriginal - totalCompressed);
  const pct = totalOriginal ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;
  return { totalOriginal, totalCompressed, savedTokens: saved, savedPercent: pct, calls };
}

export function reset() {
  totalOriginal = 0;
  totalCompressed = 0;
  calls = 0;
}

export default { estimateTokens, record, getStats, reset };
