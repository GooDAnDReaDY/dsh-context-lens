# Findings: Native DSH Sidebar Contract (0.1.5-alpha.1)

- Native Right Sidebar service: `ctx.sidebarRightTabs` (Tab Registry) and `ctx.sidebarRight` (Navigation/Controller).
- Registration mechanism:
  1. `ctx.sidebarRightTabs.register({ id, kind, title, guide })` where `id` is unique (e.g. `@goodandready/dsh-context-lens`), `kind` is discriminator (e.g. `'context-lens'`), `title` is `(address) => string`, and `guide` is optional guide card array.
  2. `ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name: 'sidebar.right.pane.tab', key: id, locale, inject }, Component))`
- Injected props to component: `{ sidebar, panel, tab }` via hook or slot injection.
- Legacy BetterSidebar service: `ctx.inject(['betterSidebar'], sctx => sctx.betterSidebar.registerTab({ id, title, icon, order, component }))`.
- Coexistence:
  - Tab IDs and keys must be distinct and deterministic.
  - State should be clean and independent per surface.
  - Disposers must be preserved for clean teardown.
