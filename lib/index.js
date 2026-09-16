import z from '@deepseek-ai/schemastery';
import * as tracker from './tokens/tracker.js';
import { compressLog } from './compression/log-compressor.js';
import { writeJson, readBody, isTrustedRequest } from './http.js';
import { registerPluginUpdater } from './updater.js';
import {
  renderOutput,
  registerTools,
  getFocus,
  clearFocus,
  getLastActiveSession
} from './tools.js';

export const name = '@goodandready/dsh-context-lens';
export const inject = ['tools', 'settings', 'webServer'];

export const Config = z.object({
  compressionMode: z.string().default('balanced').description('Log compression aggressiveness (raw/balanced/aggressive)'),
  astSkeletonMaxDepth: z.number().default(3).description('Max depth for AST skeleton generation'),
  tokenSavingsTracking: z.boolean().default(true).description('Track and display token budget savings'),
  autoCompressThreshold: z.number().default(4000).description('Auto-compress threshold in chars (0 to disable)'),
  budgetLimit: z.number().default(100000).description('Session token budget; compressions stop counting after this limit'),
  budgetAlertPercent: z.number().default(90).description('Budget percentage threshold (50-99%) for warning alert'),
  autoCollapse: z.boolean().default(true).description('Warn in UI when budget is nearly exhausted (does not force-close the settings card)')
});

const NS = '@goodandready/dsh-context-lens';

export { renderOutput };

export function apply(ctx, config) {
  let getConfig = () => config;

  ctx.inject(['settings'], (sctx) => {
    if (typeof sctx.effect === 'function') {
      sctx.effect(() => {
        const scope = sctx.settings.register(NS, Config, { base: config });
        getConfig = () => scope.get() ?? config;
        return () => {
          if (typeof scope?.dispose === 'function') scope.dispose();
          getConfig = () => config;
        };
      }, 'dsh-context-lens: settings');
    } else {
      const scope = sctx.settings.register(NS, Config, { base: config });
      getConfig = () => scope.get() ?? config;
    }
  });

  function maybeTrack(original, compressed) {
    const cfg = getConfig();
    if (cfg.tokenSavingsTracking === false) return;
    tracker.record(original, compressed);
  }

  // Register AI agent tools
  if (ctx.tools) {
    registerTools(ctx, { getConfig, maybeTrack });
  }

  if (ctx.webServer) {
    // #61: One-click plugin updater endpoint (/api/dsh-context-lens/update)
    const mountUpdater = () => registerPluginUpdater(ctx, {
      packageName: '@goodandready/dsh-context-lens',
      manifestUrl: new URL('../package.json', import.meta.url),
      endpoint: '/api/dsh-context-lens/update'
    });
    if (typeof ctx.effect === 'function') {
      ctx.effect(mountUpdater, 'dsh-context-lens: updater');
    } else {
      mountUpdater();
    }

    // Status route (#70: explicit URL parsing and validation)
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/dsh-context-lens/status',
      handler: (req, res) => {
        const cfg = getConfig();
        if (typeof cfg.budgetLimit === 'number') tracker.setBudgetLimit(cfg.budgetLimit);
        if (typeof cfg.budgetAlertPercent === 'number') tracker.setBudgetAlertPercent(cfg.budgetAlertPercent);
        let sId = getLastActiveSession() || '__default__';
        try {
          const u = new URL(req.url, 'http://127.0.0.1');
          const qId = u.searchParams.get('sessionId') || u.searchParams.get('session_id');
          if (qId !== null) {
            if (!qId || typeof qId !== 'string' || qId.trim() === '') {
              writeJson(res, 400, { ok: false, error: 'Invalid sessionId parameter' });
              return;
            }
            sId = qId.trim();
          }
        } catch (err) {
          ctx.logger?.warn?.('dsh-context-lens: failed to parse request url in status', err);
          writeJson(res, 400, { ok: false, error: 'Malformed request URL' });
          return;
        }

        writeJson(res, 200, {
          ok: true,
          plugin: 'dsh-context-lens',
          stats: tracker.getStats(cfg.budgetLimit, cfg.budgetAlertPercent),
          history: tracker.getHistory(),
          focus: getFocus(sId),
          sessionId: sId
        });
      }
    }), 'dsh-context-lens status route');

    // Quick clear-focus API route (#62: POST only, trusted origin check; #70: clean URL error handling)
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/dsh-context-lens/clear-focus',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { Allow: 'POST', 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed: POST required' }));
          return;
        }
        if (!isTrustedRequest(req)) {
          writeJson(res, 403, { ok: false, error: 'Forbidden: untrusted request origin' });
          return;
        }

        let sId = getLastActiveSession() || '__default__';
        try {
          const u = new URL(req.url, 'http://127.0.0.1');
          const qId = u.searchParams.get('sessionId') || u.searchParams.get('session_id');
          if (qId !== null) {
            if (!qId || typeof qId !== 'string' || qId.trim() === '') {
              writeJson(res, 400, { ok: false, error: 'Invalid sessionId parameter' });
              return;
            }
            sId = qId.trim();
          }
        } catch (err) {
          ctx.logger?.warn?.('dsh-context-lens: failed to parse request url in clear-focus', err);
          writeJson(res, 400, { ok: false, error: 'Malformed request URL' });
          return;
        }

        clearFocus(sId);
        writeJson(res, 200, { ok: true, sessionId: sId, focus: getFocus(sId) });
      }
    }), 'dsh-context-lens clear-focus route');

    // Server-backed preview (#63: POST only, trusted origin, bounded body size, clamped maxLines)
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/dsh-context-lens/compress-preview',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { Allow: 'POST', 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed: POST required' }));
          return;
        }
        if (!isTrustedRequest(req)) {
          writeJson(res, 403, { ok: false, error: 'Forbidden: untrusted request origin' });
          return;
        }

        let body;
        try {
          const raw = await readBody(req, 256 * 1024);
          body = JSON.parse(raw.toString('utf8') || '{}');
        } catch (e) {
          if (e?.message === 'body too large') {
            writeJson(res, 413, { ok: false, error: 'Payload Too Large: maximum 256KB allowed' });
            return;
          }
          writeJson(res, 400, { ok: false, error: 'Malformed JSON body' });
          return;
        }

        let maxLines = 400;
        if (body.maxLines !== undefined) {
          const parsed = Number(body.maxLines);
          if (Number.isNaN(parsed) || parsed < 1 || parsed > 5000) {
            writeJson(res, 400, { ok: false, error: 'maxLines must be a number between 1 and 5000' });
            return;
          }
          maxLines = Math.floor(parsed);
        }

        const cfg = getConfig();
        const mode = body.mode || cfg.compressionMode || 'balanced';
        const text = typeof body.text === 'string' ? body.text : '';
        const out = compressLog(text, { mode, maxLines });
        writeJson(res, 200, { ok: true, mode, ...out });
      }
    }), 'dsh-context-lens compress-preview route');
  }
}