// ponytail: heuristic line filter, not ML — O(n) scan, no deps
const ANSI_RE = /\u001b\[[0-9;]*[a-zA-Z]/g;
const KEEP_RE = /(FAIL|FAILED|Error|AssertionError|Exception|Traceback|panic|npm ERR!|ERR!|Expected|Received|missing|×|●|✕|FAIL:|--- FAIL|not ok|at\s+.*:\d+:\d+|stack|Caused by|test result:\s*FAILED|running \d+ test|test .* \.\.\. FAILED|BUILD FAILED|Tests run:|FAILURE:|cargo:.*error|error\[E\d+\]|thread '.*' panicked)/i;
const PASS_RE = /^(PASS|\s*✓|\s*✔|\s*ok\s|…+\s*$|\s*\.\s*$|test result:\s*ok|running \d+ test.*ok)/i;
const NOISE_RE = /^\s*(npm (notice|warn|info)|Browserslist|cached|Downloading|Done in|Compiling\s|cargo:.*Finished)/i;
const STACK_RE = /^\s*(at\s+|File ".*", line \d+|#\d+\s+0x|goroutine \d+ \[|thread '.*' panicked|note: run with)/;

function cleanAnsi(str) {
  return (str || '').replace(ANSI_RE, '');
}

function keepLine(line) {
  const clean = cleanAnsi(line);
  if (KEEP_RE.test(clean) || STACK_RE.test(clean)) return true;
  return false;
}

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

export function compressLog(text, { mode = 'balanced', maxLines = 400 } = {}) {
  if (!text || typeof text !== 'string') return { compressed: '', originalTokens: 0, compressedTokens: 0, savedTokens: 0, savedPercent: 0, keptLines: 0, totalLines: 0 };
  const lines = text.split(/\r?\n/);
  const totalLines = lines.length;
  if (mode === 'raw') {
    // raw: drop only obvious noise and non-failure passes, keep rest
    const filtered = lines.filter((l) => {
      const clean = cleanAnsi(l);
      if (KEEP_RE.test(clean) || STACK_RE.test(clean)) return true;
      if (NOISE_RE.test(clean)) return false;
      return true;
    });
    const truncated = filtered.length > maxLines ? [...filtered.slice(0, maxLines - 1), `… truncated ${filtered.length - maxLines + 1} lines`] : filtered;
    const compressed = truncated.join('\n');
    const originalTokens = estimateTokens(text);
    const compressedTokens = estimateTokens(compressed);
    return { compressed, originalTokens, compressedTokens, savedTokens: Math.max(0, originalTokens - compressedTokens), savedPercent: originalTokens ? Math.round((1 - compressedTokens / originalTokens) * 100) : 0, keptLines: truncated.length, totalLines };
  }

  const keep = new Array(lines.length).fill(false);
  const context = mode === 'aggressive' ? 1 : 2;
  for (let i = 0; i < lines.length; i++) {
    if (keepLine(lines[i])) {
      const s = Math.max(0, i - context);
      const e = Math.min(lines.length - 1, i + context);
      for (let j = s; j <= e; j++) keep[j] = true;
    }
  }
  // if nothing matched, keep first/last few lines as hint
  if (!keep.some(Boolean)) {
    const head = Math.min(6, lines.length);
    for (let i = 0; i < head; i++) keep[i] = true;
    if (lines.length > head) {
      keep[lines.length - 1] = true;
    }
  }
  // drop pure PASS/noise unless within keep window already marked via context
  let out = [];
  for (let i = 0; i < lines.length; i++) if (keep[i]) {
    const l = lines[i];
    const clean = cleanAnsi(l);
    // aggressive drops more noise even inside window
    if (mode === 'aggressive' && (PASS_RE.test(clean) || NOISE_RE.test(clean)) && !KEEP_RE.test(clean) && !STACK_RE.test(clean)) continue;
    out.push(l);
  }

  // collapse consecutive empty lines
  const collapsed = [];
  let emptyStreak = 0;
  for (const l of out) {
    if (l.trim() === '') { emptyStreak++; if (emptyStreak <= 1) collapsed.push(l); }
    else { emptyStreak = 0; collapsed.push(l); }
  }
  out = collapsed;

  // deduplicate repeated progress dots lines like "................"
  out = out.filter((l, idx, arr) => {
    if (/^[.\s]+$/.test(l) && l.length > 20) return false;
    if (idx > 0 && l === arr[idx - 1] && l.trim() !== '') return false;
    return true;
  });

  if (out.length > maxLines) {
    const half = Math.floor((maxLines - 1) / 2);
    out = [...out.slice(0, half), `… truncated ${out.length - maxLines + 1} lines …`, ...out.slice(out.length - half)];
  }
  const compressed = out.join('\n');
  const originalTokens = estimateTokens(text);
  const compressedTokens = estimateTokens(compressed);
  return { compressed, originalTokens, compressedTokens, savedTokens: Math.max(0, originalTokens - compressedTokens), savedPercent: originalTokens ? Math.round((1 - compressedTokens / originalTokens) * 100) : 0, keptLines: out.length, totalLines };
}

export default { compressLog, estimateTokens };
