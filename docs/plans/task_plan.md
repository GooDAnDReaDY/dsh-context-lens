# Plan: Issue #57 — Align UI with dsh-clinebot & Stability Improvements

## Goal
1. Visual Polish: Align the Context Lens UI styling with `dsh-clinebot` design system:
   - Dedicated CSS injection (`ensureCss`) using scoped classes (`.cl-section-card`, `.cl-stat-box`, `.cl-badge`, `.cl-bar-*`, `.cl-btn`, `.cl-input`, `.cl-banner-warning`).
   - Unified ErrorBoundary around Card and Tab bodies.
   - High-contrast typography, stat cards, progress bars, and badges for status and budget.
2. Stability & Code Health:
   - Fix `scope.get()` / `scope.subscribe()` reactive lifecycle in `PluginCard`.
   - Remove dead code and unused fallback paths.
   - Guard against non-string / nullish payloads in log compressor and skeletonizer.
   - Add unit tests for error boundaries, CSS injection, edge cases, and expanded coverage.

## Status: in_progress
Current Phase: Phase 1 (Visual Architecture & Analysis)
Next Step: Implement UI updates and stability fixes in worktree

## Phases
- [ ] Phase 1: Code analysis, edge cases, and plan definition
- [ ] Phase 2: Visual styling & ErrorBoundary implementation in lib/client.js
- [ ] Phase 3: Server and utility stability improvements (safe inputs, dead code cleanup)
- [ ] Phase 4: Unit test suite expansion
- [ ] Phase 5: Documentation update (DESIGN.md, README.md, README.ru.md) & version bump to 0.1.16
- [ ] Phase 6: Gitea PR, Test server verification, and release preparation
