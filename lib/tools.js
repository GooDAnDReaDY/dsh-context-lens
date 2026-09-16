import { compressLog, estimateTokens as estLog } from './compression/log-compressor.js';
import { skeletonize } from './ast/skeletonizer.js';
import * as tracker from './tokens/tracker.js';
import { shouldAutoCompress } from './auto-compress.js';

export const OUTPUT_SCHEMA = { type: 'object', properties: { success: { type: 'boolean' } }, additionalProperties: true };

// #71 (GH #2): output.render MUST return ContentBlock[] [{ type: 'text', text: ... }]
export const renderOutput = (_args, result) => [
  { type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }
];

const focusBySession = new Map();
let lastActiveSession = '__default__';

export function sessionKey(params, meta) {
  const k = (
    (params && (params.sessionId || params.session_id)) ||
    (meta && (meta.sessionId || meta.session_id || (meta.session && meta.session.id))) ||
    '__default__'
  );
  if (k !== '__default__') lastActiveSession = k;
  return k;
}

export function getFocus(key) {
  if (!focusBySession.has(key)) focusBySession.set(key, { paths: [], updatedAt: null });
  return focusBySession.get(key);
}

export function clearFocus(key) {
  if (key) {
    focusBySession.set(key, { paths: [], updatedAt: new Date().toISOString() });
  } else {
    focusBySession.clear();
  }
}

export function getLastActiveSession() {
  return lastActiveSession;
}

export function registerTools(ctx, { getConfig, maybeTrack }) {
  if (!ctx?.tools?.register) return;

  ctx.tools.register({
    name: 'context_lens_focus',
    description: 'Set active file paths for current session focus (these files skip AST compression)',
    parameters: {
      type: 'object',
      properties: {
        paths: { type: 'array', items: { type: 'string' }, description: 'File paths or patterns currently in focus' },
        sessionId: { type: 'string', description: 'Session id (uses active session if omitted)' }
      },
      required: ['paths']
    },
    output: { schema: OUTPUT_SCHEMA, render: renderOutput },
    execute: async (params, meta) => {
      const key = sessionKey(params, meta);
      const paths = Array.isArray(params.paths) ? params.paths : [];
      const state = getFocus(key);
      state.paths = paths;
      state.updatedAt = new Date().toISOString();
      return { success: true, sessionId: key, focus: state };
    }
  });

  ctx.tools.register({
    name: 'context_lens_compress_log',
    description: 'Compress a large log/test output block, keeping failures and stacktraces (Jest/Pytest/Go/npm)',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Raw log text to compress' },
        log: { type: 'string', description: 'Alias for text' },
        mode: { type: 'string', enum: ['raw', 'balanced', 'aggressive'], description: 'Compression aggressiveness' },
        maxLines: { type: 'number', description: 'Max output lines' },
        auto: { type: 'boolean', description: 'Auto-compress if large (uses threshold); keeps configured compressionMode' }
      }
    },
    output: { schema: OUTPUT_SCHEMA, render: renderOutput },
    execute: async (params) => {
      const cfg = getConfig();
      const inputText = params.text || params.log || '';
      const mode = params.mode || cfg.compressionMode || 'balanced';
      const maxLines = params.maxLines || 400;
      const threshold = cfg.autoCompressThreshold ?? 4000;
      const useAuto = params.auto !== false && shouldAutoCompress(inputText, threshold);
      const effectiveMode = mode;
      const res = compressLog(inputText, { mode: effectiveMode, maxLines });
      maybeTrack(inputText, res.compressed);
      return { success: true, mode: effectiveMode, autoCompressed: useAuto, ...res };
    }
  });

  ctx.tools.register({
    name: 'context_lens_compress_code',
    description: 'Generate AST skeleton for a large source file (JS/TS/Python/Go/Rust/Java/C/C++/SQL) to save context',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Source code to skeletonize' },
        language: { type: 'string', enum: ['js', 'ts', 'py', 'python', 'go', 'rust', 'java', 'c', 'cpp', 'sql'], description: 'Language hint' },
        maxDepth: { type: 'number', description: 'Max depth' },
        filePath: { type: 'string', description: 'File path to check focus (if in focus, returns full code)' },
        sessionId: { type: 'string', description: 'Session id for focus lookup' }
      },
      required: ['code']
    },
    output: { schema: OUTPUT_SCHEMA, render: renderOutput },
    execute: async (params, meta) => {
      const cfg = getConfig();
      const maxDepth = params.maxDepth ?? cfg.astSkeletonMaxDepth ?? 3;
      const key = sessionKey(params, meta);
      const focusState = getFocus(key);
      const isFocused = params.filePath && focusState.paths.length > 0
        ? focusState.paths.some(p => params.filePath.includes(p) || p.includes(params.filePath))
        : false;
      if (isFocused) {
        maybeTrack(params.code, params.code);
        return { success: true, skeleton: params.code, originalTokens: estLog(params.code), skeletonTokens: estLog(params.code), maxDepth, focused: true, sessionId: key, hint: 'File is in focus, returned full code' };
      }
      const skeleton = skeletonize(params.code, { maxDepth, language: params.language });
      maybeTrack(params.code, skeleton);
      return { success: true, skeleton, originalTokens: estLog(params.code), skeletonTokens: estLog(skeleton), maxDepth, focused: false, sessionId: key };
    }
  });

  ctx.tools.register({
    name: 'context_lens_reset',
    description: 'Reset context-lens savings stats and history (e.g. at the start of a new task)',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Optional session id to also reset session focus' }
      }
    },
    output: { schema: OUTPUT_SCHEMA, render: renderOutput },
    execute: async (params, meta) => {
      tracker.reset();
      const key = sessionKey(params || {}, meta);
      if (params && params.sessionId) {
        focusBySession.delete(key);
      }
      return { success: true, message: 'Context lens stats and history reset', sessionId: key };
    }
  });

  ctx.tools.register({
    name: 'context_lens_stats',
    description: 'Show session token savings stats for context-lens',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session id for focus snapshot' }
      }
    },
    output: { schema: OUTPUT_SCHEMA, render: renderOutput },
    execute: async (params, meta) => {
      const cfg = getConfig();
      if (typeof cfg.budgetLimit === 'number') tracker.setBudgetLimit(cfg.budgetLimit);
      if (typeof cfg.budgetAlertPercent === 'number') tracker.setBudgetAlertPercent(cfg.budgetAlertPercent);
      const stats = tracker.getStats(cfg.budgetLimit, cfg.budgetAlertPercent);
      const history = tracker.getHistory();
      const key = sessionKey(params || {}, meta);
      return {
        success: true,
        ...stats,
        history,
        trackingEnabled: cfg.tokenSavingsTracking !== false,
        autoCollapse: cfg.autoCollapse !== false,
        focus: getFocus(key),
        sessionId: key,
        autoCompressThreshold: cfg.autoCompressThreshold,
        budgetAlertPercent: cfg.budgetAlertPercent ?? 90
      };
    }
  });
}