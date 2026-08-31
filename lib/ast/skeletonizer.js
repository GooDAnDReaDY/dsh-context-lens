// ponytail: regex skeletons, no tree-sitter — handles JS/TS/Python/Go/Rust/Java signatures + imports/comments
const JS_FUNC_RE = /^\s*(export\s+)?(async\s+)?(function\s+(\w+)|const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>|(\w+)\s*:\s*\([^)]*\)\s*=>|class\s+(\w+)|interface\s+(\w+)|type\s+(\w+)\s*=)/;
const PY_RE = /^\s*(def\s+(\w+)\s*\([^)]*\)|class\s+(\w+).*?:|async def\s+(\w+)\s*\([^)]*\))/;
const GO_RE = /^\s*(func\s+(\([^)]+\)\s+)?(\w+)\s*\([^)]*\)|type\s+(\w+)\s+(struct|interface))/;
const IMPORT_RE = /^\s*import\s+.*from\s+['"].*['"]|^\s*import\s+['"].*['"]|^\s*export\s+.*from\s+['"]/;
const COMMENT_RE = /^\s*(\/\/.*|\/\*.*\*\/|#.*)/;

function indentDepth(line) {
  const m = line.match(/^(\s*)/);
  return m ? Math.floor(m[1].replace(/\t/g, '  ').length / 2) : 0;
}

export function skeletonize(text, { maxDepth = 3, language, includeImports = true, includeComments = true } = {}) {
  if (!text || typeof text !== 'string') return '';
  const lines = text.split(/\r?\n/);
  const out = [];
  let seen = new Set();
  let pendingComment = null;
  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const line = raw.trimEnd();
    if (!line.trim()) { pendingComment = null; continue; }
    const d = indentDepth(raw);
    if (d > maxDepth) { pendingComment = null; continue; }
    // Handle imports
    if (includeImports && IMPORT_RE.test(line)) {
      const sig = line.trim().slice(0, 120);
      if (!seen.has(sig)) {
        seen.add(sig);
        out.push('  '.repeat(Math.min(d, maxDepth)) + sig);
      }
      pendingComment = null;
      continue;
    }
    // Handle comments (keep JSDoc or line comments directly above a definition)
    if (includeComments && COMMENT_RE.test(line)) {
      // Keep comment if next non-empty line is a definition
      let nextIdx = idx + 1;
      while (nextIdx < lines.length && !lines[nextIdx].trim()) nextIdx++;
      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx];
        if (JS_FUNC_RE.test(nextLine) || PY_RE.test(nextLine) || GO_RE.test(nextLine) || /^\s*(class|function|interface|type|def |func )/.test(nextLine)) {
          pendingComment = line.trim().slice(0, 120);
          continue;
        }
      }
      // Otherwise, keep top-level comments (up to 5)
      if (out.length < 5 && line.trim().startsWith('//')) {
        const sig = line.trim().slice(0, 120);
        if (!seen.has(sig)) {
          seen.add(sig);
          out.push('  '.repeat(Math.min(d, maxDepth)) + sig);
        }
      }
      pendingComment = null;
      continue;
    }
    let sig = null;
    // try JS/TS
    if (!language || language === 'js' || language === 'ts' || language === 'rust' || language === 'java') {
      const m = line.match(/^\s*(export\s+)?(async\s+)?(function\s+\w+[^\n]*|const\s+\w+\s*=.*=>.*|class\s+\w+.*|interface\s+\w+.*|type\s+\w+\s*=.*|(?:public|private|protected)?\s*(async\s+)?\w+\s*\([^)]*\)\s*[:{]|import\s+.*|export\s+.*)/);
      if (m) sig = line.trim().replace(/\s*\{.*$/, '').replace(/\s+$/, '') + (line.trim().endsWith('{') ? '' : '');
      if (!sig && /^\s*(export\s+)?(async\s+)?function\s+\w+/.test(line)) sig = line.trim();
      if (!sig && /^\s*class\s+\w+/.test(line)) sig = line.trim();
      if (!sig && /^\s*import\s+/.test(line)) sig = line.trim().slice(0, 120);
    }
    if (!sig && (!language || language === 'py' || language === 'python')) {
      const m = line.match(PY_RE);
      if (m) sig = line.trim();
    }
    if (!sig && (!language || language === 'go')) {
      const m = line.match(GO_RE);
      if (m) sig = line.trim();
    }
    // Rust/Java fallback
    if (!sig && (language === 'rust' || language === 'java')) {
      if (/^\s*(pub\s+)?(fn|struct|enum|impl|trait)\s+\w+/.test(line)) sig = line.trim();
      if (/^\s*(public\s+)?(class|interface|enum)\s+\w+/.test(line)) sig = line.trim();
    }
    // generic fallback: if no specific language, try all
    if (!sig && !language) {
      if (JS_FUNC_RE.test(line) || PY_RE.test(line) || GO_RE.test(line)) sig = line.trim();
    }
    if (sig) {
      // If we have a pending comment, prepend it
      if (pendingComment) {
        const commentSig = pendingComment;
        if (!seen.has(commentSig)) {
          seen.add(commentSig);
          out.push('  '.repeat(Math.min(d, maxDepth)) + commentSig);
        }
        pendingComment = null;
      }
      // normalize: trim trailing { : etc, keep signature short
      sig = sig.replace(/\s*\{\s*$/, '').replace(/:\s*$/, '').trim();
      if (sig.length > 120) sig = sig.slice(0, 117) + '...';
      const key = sig;
      if (!seen.has(key)) {
        seen.add(key);
        out.push('  '.repeat(Math.min(d, maxDepth)) + sig);
      }
    } else {
      pendingComment = null;
    }
  }
  // if nothing found, fallback to first N non-empty lines truncated
  if (out.length === 0) {
    const fallback = lines.filter((l) => l.trim()).slice(0, Math.min(20, maxDepth * 6)).map((l) => l.trim().slice(0, 120));
    return fallback.join('\n');
  }
  // Add highlight comment for what was removed
  const total = lines.filter(l => l.trim()).length;
  const removed = total - out.length;
  if (removed > 0 && out.length > 0) {
    out.push(`// ... ${removed} lines collapsed (skeleton, maxDepth=${maxDepth})`);
  }
  return out.join('\n');
}

export default { skeletonize };
