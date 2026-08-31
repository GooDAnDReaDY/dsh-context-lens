// ponytail: regex skeletons, no tree-sitter — handles JS/TS/Python/Go signatures
const JS_FUNC_RE = /^\s*(export\s+)?(async\s+)?(function\s+(\w+)|const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>|(\w+)\s*:\s*\([^)]*\)\s*=>|class\s+(\w+)|interface\s+(\w+)|type\s+(\w+)\s*=)/;
const PY_RE = /^\s*(def\s+(\w+)\s*\([^)]*\)|class\s+(\w+).*?:|async def\s+(\w+)\s*\([^)]*\))/;
const GO_RE = /^\s*(func\s+(\([^)]+\)\s+)?(\w+)\s*\([^)]*\)|type\s+(\w+)\s+(struct|interface))/;

function indentDepth(line) {
  const m = line.match(/^(\s*)/);
  return m ? Math.floor(m[1].replace(/\t/g, '  ').length / 2) : 0;
}

export function skeletonize(text, { maxDepth = 3, language } = {}) {
  if (!text || typeof text !== 'string') return '';
  const lines = text.split(/\r?\n/);
  const out = [];
  let seen = new Set();
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const d = indentDepth(raw);
    if (d > maxDepth) continue;
    let sig = null;
    // try JS/TS
    if (!language || language === 'js' || language === 'ts') {
      const m = line.match(/^\s*(export\s+)?(async\s+)?(function\s+\w+[^\n]*|const\s+\w+\s*=.*=>.*|class\s+\w+.*|interface\s+\w+.*|type\s+\w+\s*=.*|(?:public|private|protected)?\s*(async\s+)?\w+\s*\([^)]*\)\s*[:{])/);
      if (m) sig = line.trim().replace(/\s*\{.*$/, '').replace(/\s+$/, '') + (line.trim().endsWith('{') ? '' : '');
      // fallback simple
      if (!sig && /^\s*(export\s+)?(async\s+)?function\s+\w+/.test(line)) sig = line.trim();
      if (!sig && /^\s*class\s+\w+/.test(line)) sig = line.trim();
    }
    if (!sig && (!language || language === 'py' || language === 'python')) {
      const m = line.match(PY_RE);
      if (m) sig = line.trim();
    }
    if (!sig && (!language || language === 'go')) {
      const m = line.match(GO_RE);
      if (m) sig = line.trim();
    }
    // generic fallback: if no specific language, try all
    if (!sig && !language) {
      if (JS_FUNC_RE.test(line) || PY_RE.test(line) || GO_RE.test(line)) sig = line.trim();
    }
    if (sig) {
      // normalize: trim trailing { : etc, keep signature short
      sig = sig.replace(/\s*\{\s*$/, '').replace(/:\s*$/, '').trim();
      if (sig.length > 120) sig = sig.slice(0, 117) + '...';
      const key = sig;
      if (!seen.has(key)) {
        seen.add(key);
        out.push('  '.repeat(Math.min(d, maxDepth)) + sig);
      }
    }
  }
  // if nothing found, fallback to first N non-empty lines truncated
  if (out.length === 0) {
    const fallback = lines.filter((l) => l.trim()).slice(0, Math.min(20, maxDepth * 6)).map((l) => l.trim().slice(0, 120));
    return fallback.join('\n');
  }
  return out.join('\n');
}

export default { skeletonize };
