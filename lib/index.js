import { Schema } from '@deepseek-ai/schemastery';

export const name = '@goodandready-private/dsh-context-lens';
export const inject = ['tools', 'settings', 'webServer'];

export const Config = Schema.object({
  compressionMode: Schema.string().default("balanced").description("Log compression aggressiveness (raw/balanced/aggressive)"),
  astSkeletonMaxDepth: Schema.number().default(3).description("Max depth for AST skeleton generation"),
  tokenSavingsTracking: Schema.boolean().default(true).description("Track and display token budget savings")
});

const NS = '@goodandready-private/dsh-context-lens';

export function apply(ctx, config) {
  let getConfig = () => config;

  ctx.inject(['settings'], (sctx) => {
    const scope = sctx.settings.register(NS, Config, { base: config });
    getConfig = () => scope.get() ?? config;
  });

  if (ctx.tools) {
    ctx.tools.register({
      name: 'context_lens_focus',
      description: 'Initial tool for dsh-context-lens',
      parameters: { type: 'object', properties: {} },
      execute: async () => {
        return { success: true, plugin: 'dsh-context-lens' };
      }
    });
  }
}
