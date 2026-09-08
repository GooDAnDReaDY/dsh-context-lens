import z from '@deepseek-ai/schemastery';
import { compressLog, estimateTokens as estLog } from './compression/log-compressor.js';
import { skeletonize } from './ast/skeletonizer.js';
import * as tracker from './tokens/tracker.js';
import { shouldAutoCompress } from './auto-compress.js';

export const name = '@goodandready/dsh-context-lens';
export const inject = ['tools', 'settings', 'webServer'];

export const Config = z.object({
  compressionMode: z.string().default('balanced').description('Log compression aggressiveness (raw/balanced/aggressive)'),
  astSkeletonMaxDepth: z.number().default(3).description('Max depth for AST skeleton generation'),
  tokenSavingsTracking: z.boolean().default(true).description('Track and display token budget savings'),
  autoCompressThreshold: z.number().default(4000).description('Auto-compress threshold in chars (0 to disable)'),
  budgetLimit: z.number().default(100000).description('Session token budget; compressions stop counting after this limit'),
  autoCollapse: z.boolean().default(true).description('Warn in UI when budget is nearly exhausted (does not force-close the settings card)')
});

const NS = '@goodandready/dsh-context-lens';

// #37/#18: focus keyed by session id (not process-global singleton)
const focusBySession = new Map();
let lastActiveSession = '__default__';

function sessionKey(params, meta) {
  const k = (
    (params && (params.sessionId || params.session_id)) ||
    (meta && (meta.sessionId || meta.session_id || (meta.session && meta.session.id))) ||
    '__default__'
  );
  if (k !== '__default__') lastActiveSession = k;
  return k;
}

function getFocus(key) {
  if (!focusBySession.has(key)) focusBySession.set(key, { paths: [], updatedAt: null });
  return focusBySession.get(key);
}

const OUTPUT_SCHEMA = { type: 'object', properties: { success: { type: 'boolean' } }, additionalProperties: true };
const renderOutput = (_args, result) => JSON.stringify(result, null, 2);

export function apply(ctx, config) {
  let getConfig = () => config;

  ctx.inject(['settings'], (sctx) => {
    const scope = sctx.settings.register(NS, Config, { base: config });
    getConfig = () => scope.get() ?? config;
  });

  function maybeTrack(original, compressed) {
    try {
      const cfg = getConfig();
      if (cfg && cfg.tokenSavingsTracking === false) return null;
      if (cfg && typeof cfg.budgetLimit === 'number') tracker.setBudgetLimit(cfg.budgetLimit);
      return tracker.record(original, compressed);
    } catch {
      // #39: never record on config/read errors
      return null;
    }
  }

  if (ctx.tools) {
    ctx.tools.register({
      name: 'context_lens_focus',
      description: 'Set focus files/folders for a session; other context will be auto-collapsed via skeletonizer',
      parameters: {
        type: 'object',
        properties: {
          paths: { type: 'array', items: { type: 'string' }, description: 'Focused file/folder paths' },
          maxDepth: { type: 'number', description: 'Max skeleton depth (overrides settings)' },
          sessionId: { type: 'string', description: 'Session id (defaults to host session when available)' }
        },
        required: ['paths']
      },
      output: { schema: OUTPUT_SCHEMA, render: renderOutput },
      execute: async (params, meta) => {
        const key = sessionKey(params, meta);
        const paths = Array.isArray(params.paths) ? params.paths : [];
        const focus = { paths, updatedAt: new Date().toISOString() };
        focusBySession.set(key, focus);
        return { success: true, sessionId: key, focus, hint: 'Use skeletonize helper via compress or read files with focus set' };
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
        // #33: never force balanced — keep configured/explicit mode
        const effectiveMode = mode;
        const res = compressLog(inputText, { mode: effectiveMode, maxLines });
        maybeTrack(inputText, res.compressed);
        return { success: true, mode: effectiveMode, autoCompressed: useAuto, ...res };
      }
    });

    ctx.tools.register({
      name: 'context_lens_compress_code',
      description: 'Generate AST skeleton for a large source file (JS/TS/Python/Go/Rust/Java) to save context',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Source code to skeletonize' },
          language: { type: 'string', enum: ['js', 'ts', 'py', 'python', 'go', 'rust', 'java'], description: 'Language hint' },
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
        const stats = tracker.getStats(cfg.budgetLimit);
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
          autoCompressThreshold: cfg.autoCompressThreshold
        };
      }
    });
  }

  if (ctx.webServer) {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/dsh-context-lens/status',
      handler: (req, res) => {
        const cfg = getConfig();
        if (typeof cfg.budgetLimit === 'number') tracker.setBudgetLimit(cfg.budgetLimit);
        let sId = '__default__';
        try {
          const u = new URL(req.url, 'http://127.0.0.1');
          sId = u.searchParams.get('sessionId') || u.searchParams.get('session_id') || lastActiveSession || '__default__';
        } catch {}
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({
          ok: true,
          plugin: 'dsh-context-lens',
          stats: tracker.getStats(cfg.budgetLimit),
          history: tracker.getHistory(),
          focus: getFocus(sId),
          sessionId: sId
        }));
      }
    }), 'dsh-context-lens status route');

    // #45: server-backed preview (same compressor as tools)
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/dsh-context-lens/compress-preview',
      handler: async (req, res) => {
        try {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
          const cfg = getConfig();
          const mode = body.mode || cfg.compressionMode || 'balanced';
          const text = body.text || '';
          const out = compressLog(text, { mode, maxLines: body.maxLines || 400 });
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, mode, ...out }));
        } catch (e) {
          res.statusCode = 400;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: e && e.message || String(e) }));
        }
      }
    }), 'dsh-context-lens compress-preview route');
  }
}

export { compressLog, skeletonize, shouldAutoCompress };
