import fs from 'node:fs';
import path from 'node:path';
import { skeletonize } from './ast/skeletonizer.js';
import { compressLog } from './compression/log-compressor.js';
import { shouldAutoCompress } from './auto-compress.js';

export function normalizePath(p) {
  return (typeof p === "string" ? p : "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+$/, "")
    .replace(/^(\.\/)+/, "");
}

export function isPathFocused(pattern, filePath) {
  const normP = normalizePath(pattern);
  const normF = normalizePath(filePath);
  if (!normP || !normF) return false;

  if (normF === normP) return true;
  if (normF.startsWith(normP + "/")) return true;
  if (normF.endsWith("/" + normP)) return true;
  if (normF.includes("/" + normP + "/")) return true;

  // Handle root-relative patterns like "/src" or "/lib/foo.ts" matching absolute filePath
  const relP = normP.replace(/^\/+/, "");
  if (relP && relP !== normP) {
    if (normF === relP) return true;
    if (normF.startsWith(relP + "/")) return true;
    if (normF.endsWith("/" + relP)) return true;
    if (normF.includes("/" + relP + "/")) return true;
  }

  return false;
}

export const MAX_DIRECT_READ_BYTES = 1024 * 1024; // 1 MiB

export function detectLanguageFromPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return undefined;
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.js':
    case '.mjs':
    case '.cjs':
    case '.jsx':
      return 'js';
    case '.ts':
    case '.mts':
    case '.cts':
    case '.tsx':
      return 'ts';
    case '.py':
    case '.pyw':
      return 'python';
    case '.go':
      return 'go';
    case '.rs':
      return 'rust';
    case '.java':
      return 'java';
    case '.c':
    case '.h':
      return 'c';
    case '.cpp':
    case '.hpp':
    case '.cc':
    case '.cxx':
      return 'cpp';
    case '.sql':
      return 'sql';
    default:
      return undefined;
  }
}

export const OUTPUT_SCHEMA = {
  type: 'object',
  properties: { success: { type: 'boolean' } },
  additionalProperties: true
};

// #71 (GH #2): output.render MUST return ContentBlock[] [{ type: 'text', text: ... }]
export const renderOutput = (_args, result) => [
  { type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }
];

/**
 * In-memory LRU cache storing session focus paths.
 *
 * Architecture and Sharing Semantics (#104):
 * - Focus state is stored in-memory, keyed by `sessionId` (resolved via `sessionKey`).
 * - Callers that pass an explicit `sessionId` (or whose execution `meta` includes
 *   `sessionId`, `session_id`, `session.id`, `conversationId`, or `conversation_id`)
 *   receive strictly isolated focus paths.
 * - Callers where neither parameters nor runtime metadata contain a session identifier
 *   fall back to the shared `'__default__'` session bucket.
 * - Capacity is capped at `MAX_FOCUS_SESSIONS` (500) with LRU eviction of the oldest
 *   entry on overflow, preventing unbounded memory growth.
 */
export const MAX_FOCUS_SESSIONS = 500;
const focusBySession = new Map();

export function sessionKey(params, meta) {
  const k = (
    (params && (params.sessionId || params.session_id)) ||
    (meta && (
      meta.sessionId ||
      meta.session_id ||
      (meta.session && (meta.session.id || meta.session.sessionId)) ||
      meta.conversationId ||
      meta.conversation_id
    )) ||
    '__default__'
  );
  return k;
}

export function getFocus(key) {
  const k = key || '__default__';
  if (focusBySession.has(k)) {
    // Refresh LRU position on access
    const val = focusBySession.get(k);
    focusBySession.delete(k);
    focusBySession.set(k, val);
    return val;
  }
  if (focusBySession.size >= MAX_FOCUS_SESSIONS) {
    const oldestKey = focusBySession.keys().next().value;
    if (oldestKey) focusBySession.delete(oldestKey);
  }
  const entry = { paths: [], updatedAt: null };
  focusBySession.set(k, entry);
  return entry;
}

export function clearFocus(key) {
  if (key) {
    focusBySession.delete(key);
  } else {
    focusBySession.clear();
  }
}

export function registerTools(ctx, { getConfig } = {}) {
  if (!ctx?.tools?.register) return;

  // Tool 1: Code semantic compression & focus management
  ctx.tools.register({
    name: 'context_lens_code',
    description: 'Semantic AST skeletonization of code (JS/TS/Python/Go/Rust/Java/C/C++/SQL) and path-based focus management',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['skeleton', 'focus', 'get_focus', 'clear_focus'],
          description: "Action to perform: 'skeleton' (default: AST code skeleton), 'focus' (set session focus paths), 'get_focus' (view active focus), or 'clear_focus' (reset focus)"
        },
        code: { type: 'string', description: 'Source code to skeletonize (for action=skeleton). If omitted, code is read directly from filePath.' },
        language: { type: 'string', enum: ['js', 'ts', 'py', 'python', 'go', 'rust', 'java', 'c', 'cpp', 'sql'], description: 'Language hint for skeletonization (inferred from filePath if omitted)' },
        maxDepth: { type: 'number', description: 'Max depth for AST skeleton' },
        filePath: { type: 'string', description: 'File path to read from (when code is omitted) and check against session focus paths' },
        paths: { type: 'array', items: { type: 'string' }, description: 'File paths or patterns to put in focus (for action=focus)' },
        sessionId: { type: 'string', description: 'Session id for session-isolated focus' }
      }
    },
    output: { schema: OUTPUT_SCHEMA, render: renderOutput },
    execute: async (params, meta) => {
      const action = (params && params.action) || 'skeleton';
      const key = sessionKey(params, meta);

      if (action === 'focus') {
        const rawPaths = Array.isArray(params?.paths) ? params.paths : [];
        const paths = rawPaths
          .filter(p => typeof p === 'string')
          .map(p => p.trim())
          .filter(p => p.length > 0);
        const state = getFocus(key);
        state.paths = paths;
        state.updatedAt = new Date().toISOString();
        return { success: true, action: 'focus', sessionId: key, focus: state };
      }

      if (action === 'get_focus') {
        return { success: true, action: 'get_focus', sessionId: key, focus: getFocus(key) };
      }

      if (action === 'clear_focus') {
        clearFocus(key);
        return { success: true, action: 'clear_focus', sessionId: key, focus: getFocus(key) };
      }

      // Default: skeleton
      const cfg = getConfig ? getConfig() : {};
      const maxDepth = params?.maxDepth ?? cfg.astSkeletonMaxDepth ?? 3;
      let code = typeof params?.code === 'string' ? params.code : '';
      const rawFilePath = typeof params?.filePath === 'string' ? params.filePath.trim() : '';

      // Direct file reading when code is omitted but filePath is provided
      if (!code && rawFilePath) {
        try {
          const resolvedPath = path.resolve(rawFilePath);
          const stat = await fs.promises.stat(resolvedPath);
          if (stat.isDirectory()) {
            return {
              success: false,
              action: 'skeleton',
              error: `Path '${rawFilePath}' is a directory, expected a file`,
              filePath: rawFilePath,
              sessionId: key
            };
          }
          if (stat.size > MAX_DIRECT_READ_BYTES) {
            return {
              success: false,
              action: 'skeleton',
              error: `File exceeds maximum direct read size of ${MAX_DIRECT_READ_BYTES} bytes (${stat.size} bytes)`,
              filePath: rawFilePath,
              sessionId: key
            };
          }
          code = await fs.promises.readFile(resolvedPath, 'utf8');
        } catch (err) {
          return {
            success: false,
            action: 'skeleton',
            error: `Failed to read file '${rawFilePath}': ${err.message}`,
            filePath: rawFilePath,
            sessionId: key
          };
        }
      }

      const focusState = getFocus(key);
      const isFocused = rawFilePath && focusState.paths.length > 0
        ? focusState.paths.some(p => isPathFocused(p, rawFilePath))
        : false;

      if (isFocused) {
        return {
          success: true,
          action: 'skeleton',
          skeleton: code,
          maxDepth,
          focused: true,
          filePath: rawFilePath || undefined,
          sessionId: key,
          hint: 'File is in focus, returned full code'
        };
      }

      const lang = params?.language || detectLanguageFromPath(rawFilePath);
      const skeleton = skeletonize(code, { maxDepth, language: lang });
      return {
        success: true,
        action: 'skeleton',
        skeleton,
        maxDepth,
        focused: false,
        filePath: rawFilePath || undefined,
        sessionId: key
      };
    }
  });

  // Tool 2: Test & build log compression
  ctx.tools.register({
    name: 'context_lens_log',
    description: 'Compress test and build output logs, keeping failures, stack traces, and summary',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw log text to compress' },
        log: { type: 'string', description: 'Alias for text' },
        mode: { type: 'string', enum: ['raw', 'balanced', 'aggressive'], description: 'Compression mode (default: balanced)' },
        maxLines: { type: 'number', description: 'Max output lines' },
        auto: { type: 'boolean', description: 'Auto-compress only if large and matches test/build signatures' },
        command: { type: 'string', description: 'Command that generated output (used to identify test/build logs in auto mode)' }
      }
    },
    output: { schema: OUTPUT_SCHEMA, render: renderOutput },
    execute: async (params) => {
      const cfg = getConfig ? getConfig() : {};
      const inputText = params?.text || params?.log || '';
      const mode = params?.mode || cfg.compressionMode || 'balanced';
      const maxLines = params?.maxLines || 400;
      const threshold = cfg.autoCompressThreshold ?? 4000;

      if (params?.auto === true) {
        if (!shouldAutoCompress(inputText, threshold, params?.command)) {
          return {
            success: true,
            mode,
            autoCompressed: false,
            compressed: inputText,
            skipped: true,
            reason: 'Not recognized as test/build output or below threshold; preserved for core pruner'
          };
        }
      }

      const res = compressLog(inputText, { mode, maxLines });
      return {
        success: true,
        mode,
        autoCompressed: params?.auto === true,
        ...res
      };
    }
  });
}