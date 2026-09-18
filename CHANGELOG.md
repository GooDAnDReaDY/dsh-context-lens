# Changelog

All notable changes to `@goodandready/dsh-context-lens` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.18] - 2026-09-17

### Fixed
- **AI Tool ContentBlock Format (GH #2 / Gitea #71)**: Fixed output formatting across all 5 AI tools (`context_lens_status`, `context_lens_compress_preview`, `context_lens_skeletonize`, `context_lens_track`, `context_lens_clear_focus`). All tools now return structured `ContentBlock[]` arrays (`[{ type: 'text', text: ... }]`) instead of raw JSON strings, preventing session-poisoning `TypeError: content.some is not a function` exceptions in `@deepseek-ai/dsh-llm`.
- **HTTP Parameter Validation (#70)**: Replaced silent error swallows with explicit 400 Bad Request responses and diagnostic warning logging when parsing malformed URL queries or invalid session parameters.

### Added
- **In-App One-Click Auto-Updater (#61)**: Added standard updater module (`lib/updater.js`) with `/api/dsh-context-lens/update` endpoint and an in-app update banner with version badge and update button in the settings card.

### Security
- **HTTP Endpoint Hardening (#62, #63)**: 
  - `/clear-focus` strictly requires `POST` method (returns 405 on GET) and validates loopback / same-origin trusted source (403 on untrusted).
  - `/compress-preview` strictly requires `POST`, verifies loopback / same-origin, caps request body at 256KB (413 on exceed), and validates `maxLines` parameter (clamped between 1 and 5000).

### Changed
- **UI Design System & Theme Alignment (#67, #68)**: Replaced text fallback chevron `▼` with an animated SVG 14x14 icon with smooth 180° rotation. Removed all hardcoded `rgba()` values in favor of DeepSeek Harness `--dsw-alias-*` theme variables.
- **Settings & Cordis Lifecycle (#64, #66)**: Injected `settingsScope` directly into client plugin dependencies and removed foreign `lanSettings` fallback. Wrapped settings and locale registrations in `ctx.effect` with disposable cleanups.
- **Code Decomposition (#69)**: Modularized server half into `lib/http.js`, `lib/tools.js`, `lib/updater.js`, and a compact `lib/index.js`.
- **Repository Hygiene (#65)**: Purged internal agent artifacts (`AGENTS.md`, `index.md`, `docs/plans/`) from tracked git tree and updated `.gitignore`.

## [0.1.17] - 2026-09-15

### Added
- **Focus Management UI**: Added active session focus path chips (`focus.paths`) and an instant "Clear focus" button in `StatusPanel`.
- **Configurable Budget Alert Threshold**: Added `budgetAlertPercent` (50–99%, default 90%) to `Config` and the settings card, allowing customizable budget alert levels.
- **Expanded AST Syntax**: Added pure regex AST skeletonization for C/C++ (`class`, methods, `#include`) and SQL DDL (`CREATE/ALTER TABLE`, `INDEX`).

### Changed
- **Multi-Language Standard**: Client bundle now strictly contains only canonical English (`en`) and Chinese (`zh`) dictionaries. Russian translations are provided externally via `dsh-russian-lang`.

## [0.1.16] - 2026-09-13

### Added
- **UI Error Boundary**: Wrapped visual components (`PluginCard`, `LensTab`, `StatusPanel`) in native React error boundaries with retry buttons, preventing parent crashes and React Error 310.
- **Reactive Settings Synchronization**: Added support for reading settings snapshots via `scope.getSnapshot()` and reactive subscriptions via `scope.subscribe()`.

### Changed
- **ClineBot Unified Style**: Migrated UI classes to the unified `.cl-*` design system with `--dsw-alias-*` CSS tokens.
- **Input Validation**: Added defensive input validation across all compression, skeletonization, and tracking functions.

## [0.1.15] - 2026-09-11

### Added
- **Native DSH Right Sidebar**: Added support for DeepSeek Harness 0.1.5-alpha.1+ native right sidebar via `ctx.sidebarRightTabs` and `sidebar.right.pane.tab` slot.

### Changed
- **Sidebar Coexistence**: Preserved legacy `dsh-better-sidebar` integration with deterministic, non-conflicting IDs (`@goodandready/dsh-context-lens` vs `dsh-context-lens:tab`) and graceful fallback across all 4 layouts.

## [0.1.14] - 2026-09-09

### Added
- **AST Multiline Signatures**: Added multiline function and method signature parsing for TypeScript, JavaScript, Rust, and Go.
- **Reset Tool**: Added `context_lens_reset` tool to reset token tracker statistics and compression history.

### Changed
- **Adaptive Polling**: Header chip pauses polling on hidden browser tabs (`visibilitychange`) and polls actively (4s) only when the popover is open.
- **Settings Atomicity**: Added atomic settings patch saving in `PluginCard`.

## [0.1.13] - 2026-09-07

### Fixed
- **Cordis Proxy Safety**: Guarded optional `betterSidebar` tab registration via `ctx.inject(['betterSidebar'], ...)` instead of direct property access on Cordis context proxy.
- **Settings Scope Guard**: Protected `_ctx.settingsScope` access in `PluginCard` with try/catch to avoid proxy errors on older hosts.

## [0.1.12] - 2026-09-05

### Changed
- **Component Refactoring**: Extracted shared `StatusPanel` component reused by `LensTab` and the `HeaderChip` popover.

## [0.1.11] - 2026-09-03

### Fixed
- **Audit Fixes**: Auto-compress honors configured `compressionMode`, `budgetLimit` halts token accumulation once exceeded, focus state is tracked per-session (`sessionId`), and Python imports are properly retained.

## [0.1.10] - 2026-08-30

### Added
- **Session Header Chip**: Registered header chip in `conversation.session.header.utilities` (`order: 7`) with interactive dropdown popover showing live token savings, budget progress, and recent operations.

## [0.1.9] - 2026-08-25

### Changed
- **Compatibility**: Removed obsolete kernel modules from client injects for DSH 0.1.2-rc.1.

## [0.1.8] - 2026-08-20

### Fixed
- **Tool Arguments**: Supported both `text` and `log` parameter names in `context_lens_compress_log`.
- **Tracker & Parsing**: Fixed cross-platform path resolution on Windows, dynamic `budgetLimit` propagation, ANSI terminal escape sequence stripping, and Rust `pub async fn` syntax support.
