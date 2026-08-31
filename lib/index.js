import { Schema } from '@deepseek-ai/schemastery';
import { compressLog, estimateTokens as estLog } from './compression/log-compressor.js';
import { skeletonize } from './ast/skeletonizer.js';
import * as tracker from './tokens/tracker.js';

export const name = '@goodandready-private/dsh-context-lens';
export const inject = ['tools', 'settings', 'webServer'];

export const Config = Schema.object({
  compressionMode: Schema.string().default('balanced').description('Log compression aggressiveness (raw/balanced/aggressive)'),
  astSkeletonMaxDepth: Schema.number().default(3).description('Max depth for AST skeleton generation'),
  tokenSavingsTracking: Schema.boolean().default(true).description('Track and display token budget savings')
});

const NS = '@goodandready-private/dsh-context-lens';

// in-memory focus state
let focusState = { paths: [], updatedAt: null };

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
          maxLines: { type: 'number', description: 'Max output lines' }
        },
        required: ['text']
      },
      execute: async (params) => {
        const cfg = getConfig();
        const mode = params.mode || cfg.compressionMode || 'balanced';
        const maxLines = params.maxLines || 400;
        const res = compressLog(params.text, { mode, maxLines });
        maybeTrack(params.text, res.compressed);
        return { success: true, mode, ...res };
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
          maxDepth: { type: 'number', description: 'Max depth' }
        },
        required: ['code']
      },
      execute: async (params) => {
        const cfg = getConfig();
        const maxDepth = params.maxDepth ?? cfg.astSkeletonMaxDepth ?? 3;
        const skeleton = skeletonize(params.code, { maxDepth, language: params.language });
        maybeTrack(params.code, skeleton);
        return { success: true, skeleton, originalTokens: estLog(params.code), skeletonTokens: estLog(skeleton), maxDepth };
      }
    });

    ctx.tools.register({
      name: 'context_lens_stats',
      description: 'Show session token savings stats for context-lens',
      parameters: { type: 'object', properties: {} },
      execute: async () => {
        const stats = tracker.getStats();
        const cfg = getConfig();
        return { success: true, ...stats, trackingEnabled: cfg.tokenSavingsTracking !== false, focus: focusState };
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

export { compressLog, skeletonize };
