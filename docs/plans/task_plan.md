# Plan: Issue #59 — Multilingual i18n Compliance, Session Focus Management, and Configurable Budget Alert Threshold

## Goal
Advance `dsh-context-lens` functionality and align strictly with latest skills standards:
1. **i18n Compliance (No Russian in product code/UI, Native ZH added)**:
   - Removed embedded `ru` dictionary and all hardcoded Russian text/fallbacks from `lib/client.js`.
   - Implemented native `zh` dictionary alongside canonical `en` dictionary in `lib/client.js`.
   - Filed issue in `goodandready/dsh-russian-lang` (#187) with complete key/string mapping.
2. **Session Focus UI Management**:
   - In `StatusPanel` (popover and sidebar tab), displayed active focused paths (`focus.paths`) in `.cl-tag` chips.
   - Added fast "Clear focus" action button calling `/dsh-context-lens/clear-focus` to reset focused paths without agent roundtrip.
3. **Configurable Budget Alert Threshold (`budgetAlertPercent`)**:
   - Added `budgetAlertPercent` (number, default 90, 50-99%) to `lib/index.js` `Config` schema.
   - Wired `budgetAlertPercent` to settings card in `lib/client.js`.
   - Updated `lib/tokens/tracker.js` and `StatusPanel` to use dynamic threshold for `lowBudget` warning.
4. **Extended AST Skeletons in `lib/ast/skeletonizer.js`**:
   - Added lightweight regex detection for C/C++ classes/methods, and SQL DDL tables/indexes.
5. **Clean Distribution Verification**:
   - Verified `npm pack --dry-run` contains zero internal non-product files (only lib/, cordis.patch.yml, READMEs, LICENSE, package.json).
   - 47 unit tests passing.

## Status: in_progress
Current Phase: Phase 5 (MiniPC test server verification & packaging)

## Phases
- [x] Phase 1: Implement i18n (EN+ZH), Focus Management UI, Configurable budgetAlertPercent, and AST Skeletons
- [x] Phase 2: Add and update unit tests (settings-card-fields, skeletonizer, tracker, i18n)
- [x] Phase 3: Register Russian localization issue in `goodandready/dsh-russian-lang` (#187)
- [x] Phase 4: Update documentation (DESIGN.md, README.md, README.zh.md, README.ru.md)
- [ ] Phase 5: Pack check (`npm pack`), test on MiniPC test server (192.168.1.123)
- [ ] Phase 6: Push, create Gitea PR, merge, tag v0.1.17, publish to npm & GitHub, deploy to production