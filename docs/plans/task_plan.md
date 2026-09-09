# Plan: Issue #54 — Support native DSH Sidebar alongside dsh-better-sidebar

## Goal
Make the Context Lens UI available and stable across all DSH sidebar environments:
1. Native DSH Sidebar only (`sidebarRightTabs` / `sidebar.right.pane.tab`).
2. Legacy `dsh-better-sidebar` only (`betterSidebar.registerTab`).
3. Both sidebars active simultaneously (deterministic IDs, no conflict, no double mounting).
4. Neither sidebar active (safe fallback, zero boot errors).

## Status: complete
Current Phase: Phase 5 (Complete)
Next Step: Propose deployment to user

## Phases
- [x] Phase 1: Research native DSH Sidebar contract and lifecycle in DSH 0.1.5-alpha.1
- [x] Phase 2: Implement native sidebar adapter & coexistence logic in lib/client.js
- [x] Phase 3: Add unit tests covering all 4 matrix scenarios in test/sidebar-matrix-54.test.mjs
- [x] Phase 4: Update DESIGN.md, README.md, README.ru.md, and package.json to v0.1.15
- [x] Phase 5: Verification & Gitea commit
