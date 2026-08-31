# dsh-context-lens

DSH plugin for AST context compression, test log filtering, and token budget guard for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

Compresses noisy test output (Jest/Pytest/Go/Vitest/npm) to failures + stacktraces and generates compact AST skeletons for large source files to save context tokens.

## Tools
- `context_lens_focus` — set focused files/folders (other context collapsed)
- `context_lens_compress_log` — compress a log block (`text`, `mode` raw/balanced/aggressive, `maxLines`)
- `context_lens_compress_code` — skeletonize source code (`code`, `language` js/ts/py/go, `maxDepth`)
- `context_lens_stats` — session token savings stats

Status route: `GET /dsh-context-lens/status`

## Settings
Located in **Settings → Plugins → Context Lens & Token Guard**:
- `compressionMode`: `raw` | `balanced` | `aggressive` (default `balanced`)
- `astSkeletonMaxDepth`: max skeleton depth (default `3`)
- `tokenSavingsTracking`: track savings (default `true`)

Example config:
```yaml
# `compressionMode` — aggressiveness, `astSkeletonMaxDepth` — skeleton depth
compressionMode: balanced
astSkeletonMaxDepth: 3
tokenSavingsTracking: true
```

## Verification
```bash
npm test
```

## License
MIT
