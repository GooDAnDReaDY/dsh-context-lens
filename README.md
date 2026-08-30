# dsh-context-lens

DSH plugin for AST context compression, test log filtering, and token budget guard for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

## Tools
- `context_lens_focus`
- `context_lens_compress_log`
- `context_lens_stats`

## Settings
Located in **Settings -> Plugins -> Context Lens & Token Guard**:
- `compressionMode`: Log compression aggressiveness (raw/balanced/aggressive) (default: `balanced`)
- `astSkeletonMaxDepth`: Max depth for AST skeleton generation (default: `3`)
- `tokenSavingsTracking`: Track and display token budget savings (default: `true`)

## Verification
```bash
npm test
```
