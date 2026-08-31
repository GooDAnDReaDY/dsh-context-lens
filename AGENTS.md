# AGENTS.md for dsh-context-lens

## Project Scope
- Plugin: `@goodandready/dsh-context-lens`
- Architecture: DeepSeek Harness Cordis plugin + Web client
- Base Directory: `dhsplugins/dsh-context-lens`

## Rules
- Tests must pass: `node --test test/*.test.mjs`
- Settings registered only via `settings.plugin.item` card format.
- No infrastructure paths or credentials hardcoded.
