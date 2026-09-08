// ponytail: regex skeletons, no tree-sitter — handles JS/TS/Python/Go/Rust/Java signatures + imports/comments + multiline signatures
const JS_FUNC_RE = /^\s*(export\s+)?(async\s+)?(function\s+(\w+)|const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>|(\w+)\s*:\s*\([^)]*\)\s*=>|class\s+(\w+)|interface\s+(\w+)|type\s+(\w+)\s*=)/;
const PY_RE = /^\s*(def\s+(\w+)\s*\([^)]*\)|class\s+(\w+).*?:|async def\s+(\w+)\s*\([^)]*\))/;
const GO_RE = /^\s*(func\s+(\([^)]+\)\s+)?(\w+)\s*\([^)]*\)|type\s+(\w+)\s+(struct|interface))/;
const RUST_RE = /^\s*(pub(\([^)]+\))?\s+)?(async\s+)?(fn|struct|enum|impl|trait|type|const|static)\s+\w+/;
const IMPORT_RE = /^\s*import\s+.*from\s+['"].*['"]|^\s*import\s+['"].*['"]|^\s*export\s+.*from\s+['"]|^\s*use\s+[a-zA-Z0-9_:]+|^\s*(from\s+\S+\s+)?import\s+\S+|^\s*from\s+\S+\s+import\s+/;
const COMMENT_RE = /^\s*(\/\/.*|\/\*.*\*\/|\/\*.*|\*.*|#.*)/;

// Multiline signature starters
const MULTILINE_START_RE = /^\s*(export\s+)?(async\s+)?(function\b|const\s+\w+\s*=|\w+\s*:\s*(async\s+)?\(|def\b|async\s+def\b|func\b|(pub(\([^)]+\))?\s+)?(async\s+)?fn\b|(?:(?:public|protected|private|static|final|abstract|synchronized|native|default)\s+)+[\w.<>,\[\]?]+\s+\w+\s*\()/;

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
      let nextIdx = idx + 1;
      while (nextIdx < lines.length && !lines[nextIdx].trim()) nextIdx++;
      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx];
        if (JS_FUNC_RE.test(nextLine) || PY_RE.test(nextLine) || GO_RE.test(nextLine) || RUST_RE.test(nextLine) || MULTILINE_START_RE.test(nextLine) || /^\s*(class|function|interface|type|def |func |pub |fn )/.test(nextLine)) {
          pendingComment = line.trim().slice(0, 120);
          continue;
        }
      }
      // Otherwise, keep top-level comments (up to 5)
      if (out.length < 5 && (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*'))) {
        const sig = line.trim().slice(0, 120);
        if (!seen.has(sig)) {
          seen.add(sig);
          out.push('  '.repeat(Math.min(d, maxDepth)) + sig);
        }
      }
      pendingComment = null;
      continue;
    }

    // Multiline signature detection: if line starts a signature but doesn't finish with '{', '=>', or ':'
    let candidateLine = line;
    let accumulatedIdx = idx;
    const isComplete = (s) => (s.includes('{') && s.includes(')')) || (s.includes('=>') && s.includes(')')) || (s.endsWith(':') && s.includes(')'));
    if (MULTILINE_START_RE.test(candidateLine) && !isComplete(candidateLine)) {
      let buffer = candidateLine.trim();
      let scanIdx = idx + 1;
      while (scanIdx < lines.length && scanIdx <= idx + 12) {
        const nextRaw = lines[scanIdx].trim();
        if (!nextRaw) { scanIdx++; continue; }
        buffer += ' ' + nextRaw;
        if ((nextRaw.includes('{') || nextRaw.includes('=>') || nextRaw.endsWith(':')) && buffer.includes(')')) {
          candidateLine = buffer;
          accumulatedIdx = scanIdx;
          break;
        }
        scanIdx++;
      }
    }

    let sig = null;
    // try JS/TS
    if (!language || language === 'js' || language === 'ts') {
      const m = candidateLine.match(/^\s*(export\s+)?(async\s+)?(function\s+\w+[^\n]*|const\s+\w+\s*=.*=>.*|class\s+\w+.*|interface\s+\w+.*|type\s+\w+\s*=.*|(?:public|private|protected)?\s*(async\s+)?\w+\s*\([^)]*\)\s*[:{]|import\s+.*|export\s+.*)/);
      if (m) sig = candidateLine.trim().replace(/\s*\{\s*$/, '').replace(/\s+$/, '');
      if (!sig && /^\s*(export\s+)?(async\s+)?function\s+\w+/.test(candidateLine)) sig = candidateLine.trim();
      if (!sig && /^\s*class\s+\w+/.test(candidateLine)) sig = candidateLine.trim();
      if (!sig && /^\s*import\s+/.test(candidateLine)) sig = candidateLine.trim().slice(0, 120);
    }
    if (!sig && (!language || language === 'py' || language === 'python')) {
      const m = candidateLine.match(PY_RE);
      if (m) sig = candidateLine.trim();
    }
    if (!sig && (!language || language === 'go')) {
      const m = candidateLine.match(GO_RE);
      if (m) sig = candidateLine.trim();
    }
    if (!sig && (!language || language === 'rust')) {
      if (RUST_RE.test(candidateLine)) sig = candidateLine.trim();
    }
    if (!sig && (!language || language === 'java')) {
      if (/^\s*(?:(?:public|protected|private|static|final|abstract|synchronized|native|default)\s+)+(?:class|interface|enum|record)\s+\w+/.test(candidateLine)
        || /^\s*(?:(?:public|protected|private|static|final|abstract|synchronized|native|default)\s+)+[\w.<>,\[\]?]+\s+\w+\s*\(/.test(candidateLine)
        || /^\s*(class|interface|enum|record)\s+\w+/.test(candidateLine)) sig = candidateLine.trim();
    }
    // generic fallback: if no specific language, try all
    if (!sig && !language) {
      if (JS_FUNC_RE.test(candidateLine) || PY_RE.test(candidateLine) || GO_RE.test(candidateLine) || RUST_RE.test(candidateLine)) sig = candidateLine.trim();
    }

    if (sig) {
      if (accumulatedIdx > idx) {
        idx = accumulatedIdx; // advance loop past multiline signature lines
      }
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
      if (sig.length > 180) sig = sig.slice(0, 177) + '...';
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
    const commentPrefix = (language === 'py' || language === 'python') ? '# ' : '// ';
    out.push(`${commentPrefix}... ${removed} lines collapsed (skeleton, maxDepth=${maxDepth})`);
  }
  return out.join('\n');
}

export default { skeletonize };
