import z from '@deepseek-ai/schemastery';
import { compressLog, estimateTokens as estLog } from './compression/log-compressor.js';
import { skeletonize } from './ast/skeletonizer.js';
import * as tracker from './tokens/tracker.js';

export const name = '@goodandready/dsh-context-lens';
export const inject = ['tools', 'settings', 'webServer'];

export const Config = z.object({
  compressionMode: z.string().default('balanced').description('Log compression aggressiveness (raw/balanced/aggressive)'),
  astSkeletonMaxDepth: z.number().default(3).description('Max depth for AST skeleton generation'),
  tokenSavingsTracking: z.boolean().default(true).description('Track and display token budget savings'),
  autoCompressThreshold: z.number().default(4000).description('Auto-compress threshold in chars (0 to disable)')
});

const NS = '@goodandready/dsh-context-lens';

// in-memory focus state
let focusState = { paths: [], updatedAt: null };

const OUTPUT_SCHEMA = { type: 'object', properties: { success: { type: 'boolean' } }, additionalProperties: true };
const renderOutput = (_args, result) => JSON.stringify(result, null, 2);

function shouldAutoCompress(text, threshold) {
  if (!threshold || threshold <= 0) return false;
  return (text || '').length > threshold || (text || '').split('\n').length > 100;
}

export function apply(ctx, config) {
  let getConfig = () => config;

  ctx.inject(['settings'], (sctx) => {
    const scope = sctx.settings.register(NS, Config, { base: config });
    getConfig = () => scope.get() ?? config;
  });

  // helper to record savings if enabled
  function maybeTrack(original, compressed) {
    try {
      const cfg = getConfig();
      if (cfg && cfg.tokenSavingsTracking === false) return null;
      return tracker.record(original, compressed);
    } catch { return tracker.record(original, compressed); }
  }

  if (ctx.tools) {
    ctx.tools.register({
      name: 'context_lens_focus',
      description: 'Set focus files/folders; other context will be auto-collapsed via skeletonizer',
      parameters: {
        type: 'object',
        properties: {
          paths: { type: 'array', items: { type: 'string' }, description: 'Focused file/folder paths' },
          maxDepth: { type: 'number', description: 'Max skeleton depth (overrides settings)' }
        },
        required: ['paths']
      },
      output: { schema: OUTPUT_SCHEMA, render: renderOutput },
      execute: async (params) => {
        const paths = Array.isArray(params.paths) ? params.paths : [];
        focusState = { paths, updatedAt: new Date().toISOString() };
        return { success: true, focus: focusState, hint: 'Use skeletonize helper via compress or read files with focus set' };
      }
    });

    ctx.tools.register({
      name: 'context_lens_compress_log',
      description: 'Compress a large log/test output block, keeping failures and stacktraces (Jest/Pytest/Go/nnpm)',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Raw log text to compress' },
          mode: { type: 'string', enum: ['raw', 'balanced', 'aggressive'], description: 'Compression aggressiveness' },
          maxLines: { type: 'number', description: 'Max output lines' },
          auto: { type: 'boolean', description: 'Auto-compress if large (uses threshold)' }
        },
        required: ['text']
      },
      output: { schema: OUTPUT_SCHEMA, render: renderOutput },
      execute: async (params) => {
        const cfg = getConfig();
        const mode = params.mode || cfg.compressionMode || 'balanced';
        const maxLines = params.maxLines || 400;
        // Auto-compress check (#15)
        const threshold = cfg.autoCompressThreshold ?? 4000;
        const useAuto = params.auto !== false && shouldAutoCompress(params.text, threshold);
        const effectiveMode = useAuto ? mode : mode;
        const res = compressLog(params.text, { mode: effectiveMode, maxLines });
        maybeTrack(params.text, res.compressed);
        return { success: true, mode: effectiveMode, autoCompressed: useAuto, ...res };
      }
    });

    ctx.tools.register({
      name: 'context_lens_compress_code',
      description: 'Generate AST skeleton for a large source file (JS/TS/Python/Go) to save context',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Source code to skeletonize' },
          language: { type: 'string', enum: ['js', 'ts', 'py', 'python', 'go'], description: 'Language hint' },
          maxDepth: { type: 'number', description: 'Max depth' },
          filePath: { type: 'string', description: 'File path to check focus (if in focus, returns full code)' }
        },
        required: ['code']
      },
      output: { schema: OUTPUT_SCHEMA, render: renderOutput },
      execute: async (params) => {
        const cfg = getConfig();
        const maxDepth = params.maxDepth ?? cfg.astSkeletonMaxDepth ?? 3;
        // Focus mode (#18): if file is in focus, return full code, else skeleton
        const isFocused = params.filePath && focusState.paths.length > 0 ? focusState.paths.some(p => params.filePath.includes(p) || p.includes(params.filePath)) : false;
        if (isFocused) {
          maybeTrack(params.code, params.code);
          return { success: true, skeleton: params.code, originalTokens: estLog(params.code), skeletonTokens: estLog(params.code), maxDepth, focused: true, hint: 'File is in focus, returned full code' };
        }
        const skeleton = skeletonize(params.code, { maxDepth, language: params.language });
        maybeTrack(params.code, skeleton);
        return { success: true, skeleton, originalTokens: estLog(params.code), skeletonTokens: estLog(skeleton), maxDepth, focused: false };
      }
    });

    ctx.tools.register({
      name: 'context_lens_stats',
      description: 'Show session token savings stats for context-lens',
      parameters: { type: 'object', properties: {} },
      output: { schema: OUTPUT_SCHEMA, render: renderOutput },
      execute: async () => {
        const stats = tracker.getStats();
        const cfg = getConfig();
        return { success: true, ...stats, trackingEnabled: cfg.tokenSavingsTracking !== false, focus: focusState, autoCompressThreshold: cfg.autoCompressThreshold };
      }
    });
  }

  // optional status route
  if (ctx.webServer) {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/dsh-context-lens/status',
      handler: (req, res) => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, plugin: 'dsh-context-lens', stats: tracker.getStats(), focus: focusState }));
      }
    }), 'dsh-context-lens status route');
  }
}

export { compressLog, skeletonize, shouldAutoCompress };
