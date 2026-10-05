import z from '@deepseek-ai/schemastery';
import { renderOutput, registerTools } from './tools.js';

export const name = '@goodandready/dsh-context-lens';
export const inject = ['tools', 'settings'];

// DSH builds a namespace's settings form from the volatile fields of its profile
// entry schema, and volatileForm() returns undefined when there are none — so with
// no .volatile() field this namespace served no form at all. All three fields are
// ones the card edits. A volatile field holds a Volatile box, so plainConfig()
// unwraps before any caller reads a value.
export const Config = z.object({
  compressionMode: z.string().default('balanced').volatile().description('Log compression aggressiveness (raw/balanced/aggressive)'),
  astSkeletonMaxDepth: z.number().default(3).volatile().description('Max depth for AST skeleton generation'),
  autoCompressThreshold: z.number().default(4000).volatile().description('Auto-compress threshold in chars for test/build logs (0 to disable)')
});

/** Unwrap DSH Volatile boxes into plain values, recursing through plain containers. */
export function plainConfig(value) {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(plainConfig)
  if (typeof value.get === 'function') return plainConfig(value.get())
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plainConfig(v)]))
}

// The settings namespace is the profile entry id from cordis.patch.yml, not the
// package name. DSH keys a served form by entry id, so a package-name namespace
// resolves to nothing and the card reports the form as unavailable.
const NS = 'dsh-context-lens';

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

    // describe() supplies a served form's plain value; the fallback covers a
    // profile mounted without the settings service. Either way the value is run
    // through plainConfig so callers never see a Volatile box.
    const readLiveSettings = () => {
      try {
        if (typeof sctx.settings.describe === 'function') {
          const desc = sctx.settings.describe()?.find?.((row) => row.ns === NS);
          if (desc && desc.value && typeof desc.value === 'object') {
            return plainConfig(Config(desc.value));
          }
        } else if (typeof sctx.settings.get === 'function') {
          const val = sctx.settings.get(NS);
          if (val && typeof val === 'object') {
            return plainConfig(Config(val));
          }
        }
      } catch (error) {
        ctx.logger?.warn?.('dsh-context-lens: settings describe failed: ' + (error instanceof Error ? error.message : String(error)));
      }
      return null;
    };

    readConfig = () => readLiveSettings() ?? plainConfig(Config(ctx.fiber?.config ?? config)) ?? config;

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