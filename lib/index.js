import z from '@deepseek-ai/schemastery';
import { renderOutput, registerTools } from './tools.js';

export const name = '@goodandready/dsh-context-lens';
export const inject = ['tools', 'settings'];

export const Config = z.object({
  compressionMode: z.string().default('balanced').description('Log compression aggressiveness (raw/balanced/aggressive)'),
  astSkeletonMaxDepth: z.number().default(3).description('Max depth for AST skeleton generation'),
  autoCompressThreshold: z.number().default(4000).description('Auto-compress threshold in chars for test/build logs (0 to disable)')
});

const NS = '@goodandready/dsh-context-lens';

export { renderOutput };

export function apply(ctx, config) {
  let readConfig = () => config;
  const getConfig = () => readConfig();

  ctx.inject(['settings'], (sctx) => {
    if (!sctx?.settings) return;

    let disposeConfigure;
    try {
      if (typeof sctx.settings.configure === 'function') {
        disposeConfigure = sctx.settings.configure({ auto: false }, ctx.fiber);
      }
    } catch (error) {
      ctx.logger?.warn?.('dsh-context-lens: settings configure failed: ' + (error instanceof Error ? error.message : String(error)));
    }

    const readLiveSettings = () => {
      try {
        if (typeof sctx.settings.describe === 'function') {
          const desc = sctx.settings.describe()?.find?.((row) => row.ns === NS);
          if (desc && desc.value && typeof desc.value === 'object') {
            return Config(desc.value);
          }
        } else if (typeof sctx.settings.get === 'function') {
          const val = sctx.settings.get(NS);
          if (val && typeof val === 'object') {
            return Config(val);
          }
        }
      } catch (error) {
        ctx.logger?.warn?.('dsh-context-lens: settings describe failed: ' + (error instanceof Error ? error.message : String(error)));
      }
      return null;
    };

    readConfig = () => readLiveSettings() ?? Config(ctx.fiber?.config ?? config) ?? config;

    if (typeof sctx.effect === 'function') {
      sctx.effect(() => {
        const disposeDocUpdated = typeof sctx.on === 'function'
          ? sctx.on('settings/document-updated', (updatedNs) => {
              if (updatedNs === NS) {
                // Live settings refreshed on next readLiveSettings call
              }
            })
          : null;
        return () => {
          if (typeof disposeConfigure === 'function') {
            try {
              disposeConfigure();
            } catch (err) {
              ctx.logger?.debug?.('dsh-context-lens: disposeConfigure failed', err);
            }
          }
          if (typeof disposeDocUpdated === 'function') {
            try {
              disposeDocUpdated();
            } catch (err) {
              ctx.logger?.debug?.('dsh-context-lens: disposeDocUpdated failed', err);
            }
          }
          readConfig = () => config;
        };
      }, 'dsh-context-lens: settings');
    }
  });

  // Register consolidated AI agent tools (context_lens_code, context_lens_log)
  if (ctx.tools) {
    registerTools(ctx, { getConfig });
  }
}