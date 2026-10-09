import { skeletonize } from './ast/skeletonizer.js';
import { compressLog } from './compression/log-compressor.js';
import { shouldAutoCompress } from './auto-compress.js';

export function normalizePath(p) {
  return (p || '').replace(/\\/g, '/').replace(/\/+$/, '');
}

export function isPathFocused(pattern, filePath) {
  const normP = normalizePath(pattern);
  const normF = normalizePath(filePath);
  if (!normP || !normF) return false;
  if (normF === normP) return true;
  if (normF.startsWith(normP + '/')) return true;
  if (normF.endsWith('/' + normP)) return true;
  return false;
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

export const MAX_FOCUS_SESSIONS = 500;
const focusBySession = new Map();

export function sessionKey(params, meta) {
  const k = (
    (params && (params.sessionId || params.session_id)) ||
    (meta && (meta.sessionId || meta.session_id || (meta.session && meta.session.id))) ||
    '__default__'
  );
  return k;
}

export function getFocus(key) {
  const k = key || '__default__';
  if (!focusBySession.has(k)) {
    if (focusBySession.size >= MAX_FOCUS_SESSIONS) {
      const oldestKey = focusBySession.keys().next().value;
      if (oldestKey) focusBySession.delete(oldestKey);
    }
    focusBySession.set(k, { paths: [], updatedAt: null });
  }
  return focusBySession.get(k);
}

export function clearFocus(key) {
  if (key) {
    focusBySession.delete(key);
  } else {
    focusBySession.clear();
  }
}

export function resetFocusBySession() {
  focusBySession.clear();
}

export function getFocusBySessionSize() {
  return focusBySession.size;
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
        code: { type: 'string', description: 'Source code to skeletonize (for action=skeleton)' },
        language: { type: 'string', enum: ['js', 'ts', 'py', 'python', 'go', 'rust', 'java', 'c', 'cpp', 'sql'], description: 'Language hint for skeletonization' },
        maxDepth: { type: 'number', description: 'Max depth for AST skeleton' },
        filePath: { type: 'string', description: 'File path to check against focus paths (if in focus, returns full code without skeletonization)' },
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
      const code = params?.code || '';
      const rawFilePath = typeof params?.filePath === 'string' ? params.filePath.trim() : '';
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
          sessionId: key,
          hint: 'File is in focus, returned full code'
        };
      }

      const skeleton = skeletonize(code, { maxDepth, language: params?.language });
      return {
        success: true,
        action: 'skeleton',
        skeleton,
        maxDepth,
        focused: false,
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