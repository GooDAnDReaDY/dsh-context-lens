window.__ModuleLoader__.load({
  id: '@goodandready/dsh-context-lens',
  factory: (require) => {
    var module = { exports: {} };
    const React = require('react');
    const NS = '@goodandready/dsh-context-lens';

    const en = {
      title: 'Context Lens & Token Guard',
      sub: 'AST compression, log filtering, token budget',
      mode: 'Compression mode',
      depth: 'AST max depth',
      tracking: 'Track token savings',
      preview: 'Log preview',
      compress: 'Compress',
      saved: 'Saved',
      tokens: 'tokens',
      placeholder: 'Paste Jest/Pytest log here…',
      saving: 'Saving…',
      ready: 'Ready'
    };
    const ru = {
      title: 'Context Lens & Token Guard',
      sub: 'Сжатие AST, фильтрация логов, контроль токенов',
      mode: 'Режим сжатия',
      depth: 'Глубина AST',
      tracking: 'Считать экономию',
      preview: 'Предпросмотр лога',
      compress: 'Сжать',
      saved: 'Сэкономлено',
      tokens: 'токенов',
      placeholder: 'Вставьте лог Jest/Pytest…',
      saving: 'Сохранение…',
      ready: 'Готово'
    };

    // ponytail: client-side replica of compressor for preview (no import)
    function compressPreview(text, mode) {
      if (!text) return '';
      const KEEP = /(FAIL|FAILED|Error|AssertionError|Exception|Traceback|panic|npm ERR!|Expected|Received|at\s+.*:\d+:\d+)/i;
      const lines = text.split(/\r?\n/);
      const keep = new Array(lines.length).fill(false);
      const ctx = mode === 'aggressive' ? 1 : 2;
      for (let i = 0; i < lines.length; i++) if (KEEP.test(lines[i])) {
        for (let j = Math.max(0, i - ctx); j <= Math.min(lines.length - 1, i + ctx); j++) keep[j] = true;
      }
      if (!keep.some(Boolean)) return lines.slice(0, 20).join('\n');
      return lines.filter((_, i) => keep[i]).slice(0, 200).join('\n');
    }

    function LensTab({ ctx: _ctx, scope }) {
      const [stats, setStats] = React.useState(null);
      React.useEffect(() => {
        fetch('/dsh-context-lens/status').then(r => r.ok ? r.json() : null).then(j => { if (j && j.stats) setStats(j.stats); }).catch(() => {});
      }, []);
      return React.createElement('div', { style: { padding: 12 } },
        React.createElement('div', { style: { fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--dsw-alias-label-primary)' } }, 'Context Lens'),
        stats ? React.createElement('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } }, `Saved ${stats.savedTokens} tokens (${stats.savedPercent}%) · ${stats.calls} ops`) : React.createElement('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } }, 'No data yet'),
        React.createElement('div', { style: { marginTop: 12, display: 'flex', gap: 8 } },
          React.createElement('button', { onClick: () => fetch('/dsh-context-lens/status').then(r=>r.json()).then(j=> setStats(j.stats)), style: { fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', cursor: 'pointer' } }, 'Refresh'),
          React.createElement('button', { onClick: () => { try { _ctx.betterSidebar.openTab({ type: 'dsh-context-lens:tab', title: 'Lens' }) } catch(e){} }, style: { fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent', cursor: 'pointer' } }, 'Settings')
        )
      );
    }

    function HeaderBadge({ ctx: _ctx }) {
      const [stats, setStats] = React.useState(null);
      React.useEffect(() => {
        const tick = () => fetch('/dsh-context-lens/status').then(r => r.ok ? r.json() : null).then(j => { if (j && j.stats) setStats(j.stats); }).catch(() => {});
        tick();
        const id = setInterval(tick, 5000);
        return () => clearInterval(id);
      }, []);
      if (!stats || !stats.savedTokens) return null;
      return React.createElement('span', { style: { fontSize: 11, padding: '2px 6px', borderRadius: 999, background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-secondary)', border: '1px solid var(--dsw-alias-border-l2)', marginLeft: 8 } }, `Lens ${stats.savedPercent}%`);
    }

    function PluginCard({ ctx: _ctx, t }) {
      const [expanded, setExpanded] = React.useState(false);
      // hooks must be before any return — React 310
      const [draft, setDraft] = React.useState({ compressionMode: 'balanced', astSkeletonMaxDepth: 3, tokenSavingsTracking: true });
      const [status, setStatus] = React.useState('loading');
      const [saving, setSaving] = React.useState(false);
      const [saveErr, setSaveErr] = React.useState('');
      const [previewIn, setPreviewIn] = React.useState('FAIL  src/app.test.js\n  ● should handle\n    Expected 1 got 2\n    at Object.<anonymous> (src/app.test.js:10:5)\nPASS  src/ok.test.js\n');
      const [previewOut, setPreviewOut] = React.useState('');
      const [stats, setStats] = React.useState(null);

      const scopeRef = React.useRef(null);
      if (!scopeRef.current && _ctx && _ctx.settingsScope) {
        try { scopeRef.current = _ctx.settingsScope.bind({ namespace: NS }); } catch (e) { scopeRef.current = null; }
      }
      const scope = scopeRef.current;

      React.useEffect(() => {
        if (!scope) { setStatus('unavailable'); return; }
        let cancelled = false;
        (async () => {
          try {
            const snap = await scope.get();
            if (cancelled) return;
            // check snapshot status if available
            if (snap && typeof snap === 'object' && 'status' in snap) {
              if (snap.status === 'loading') { setStatus('loading'); return; }
              if (snap.status === 'unavailable') { setStatus('unavailable'); return; }
            }
            // snap is either values or wrapper with values
            const vals = snap && snap.values ? snap.values : snap;
            if (vals && typeof vals === 'object') {
              setDraft((d) => ({ ...d, ...vals }));
            }
            setStatus('ready');
          } catch (e) {
            if (!cancelled) setStatus('unavailable');
          }
        })();
        return () => { cancelled = true; };
      }, [scope]);

      React.useEffect(() => {
        if (expanded) {
          fetch('/dsh-context-lens/status').then((r) => r.ok ? r.json() : null).then((j) => { if (j && j.stats) setStats(j.stats); }).catch(() => {});
        }
      }, [expanded]);

      const tt = t || ((k) => (en[k] || k));

      let ChevronIcon = null;
      try {
        const prim = require('@deepseek-ai/dsh-client-ui-primitives');
        ChevronIcon = prim && prim.IconChevronDownOutline14;
      } catch (e) { ChevronIcon = null; }

      const Chevron = ChevronIcon ? function ChevronNode(p) {
        return React.createElement(ChevronIcon, { className: 'cl-chev' + (p.open ? ' cl-chev-open' : ''), style: { marginLeft: 'auto', color: 'var(--dsw-alias-label-tertiary)', transition: 'transform .16s', transform: p.open ? 'rotate(180deg)' : 'none' } });
      } : function Fallback(p) {
        return React.createElement('span', { className: 'cl-chev' + (p.open ? ' cl-chev-open' : ''), style: { marginLeft: 'auto', color: 'var(--dsw-alias-label-tertiary)' } }, '▼');
      };

      async function onSave() {
        if (!scope) { setSaveErr('Settings unavailable'); return; }
        setSaving(true); setSaveErr('');
        const keys = Object.keys(draft);
        const errs = [];
        for (const k of keys) {
          try { await scope.set(k, draft[k]); } catch (e) { errs.push(k + ': ' + (e && e.message || String(e))); }
        }
        setSaving(false);
        if (errs.length) setSaveErr(errs.join('; '));
      }

      function onPreview() {
        const mode = draft.compressionMode || 'balanced';
        setPreviewOut(compressPreview(previewIn, mode));
      }

      // styles: ponytail minimal, theme vars only
      return React.createElement('li', { className: 'cl-card', style: { border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', borderRadius: 12, listStyle: 'none' } },
        React.createElement('button', {
          className: 'cl-head',
          onClick: () => setExpanded(!expanded),
          'aria-expanded': expanded,
          style: { appearance: 'none', width: '100%', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer', background: '0 0', border: 0, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }
        },
          React.createElement('span', { style: { display: 'flex', flexDirection: 'column' } },
            React.createElement('span', { className: 'cl-title', style: { color: 'var(--dsw-alias-label-primary)', fontSize: 15, fontWeight: 600, lineHeight: 1.4 } }, tt('title')),
            React.createElement('span', { className: 'cl-sub', style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 13 } }, tt('sub') + (stats ? ' · ' + tt('saved') + ' ' + (stats.savedTokens || 0) + ' ' + tt('tokens') + ' (' + (stats.savedPercent || 0) + '%)' : ''))
          ),
          React.createElement(Chevron, { open: expanded })
        ),
        expanded ? React.createElement('div', { className: 'cl-body', style: { borderTop: '1px solid var(--dsw-alias-border-l2)', margin: '0 16px', paddingBottom: 8 } },
          status === 'loading' ? React.createElement('div', { style: { padding: 12, color: 'var(--dsw-alias-label-secondary)' } }, 'Loading…') :
          status === 'unavailable' ? React.createElement('div', { style: { padding: 12, color: 'var(--dsw-alias-label-secondary)' } }, 'Settings unavailable — plugin not registered on host yet') :
          React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('mode')),
              React.createElement('select', {
                className: 'cl-input',
                value: draft.compressionMode,
                onChange: (e) => setDraft((d) => ({ ...d, compressionMode: e.target.value })),
                style: { height: 34, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: '0 12px', fontSize: 13 }
              },
                React.createElement('option', { value: 'raw' }, 'raw'),
                React.createElement('option', { value: 'balanced' }, 'balanced'),
                React.createElement('option', { value: 'aggressive' }, 'aggressive')
              )
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('depth')),
              React.createElement('input', {
                className: 'cl-input',
                type: 'number', min: 1, max: 10,
                value: draft.astSkeletonMaxDepth,
                onChange: (e) => setDraft((d) => ({ ...d, astSkeletonMaxDepth: parseInt(e.target.value, 10) || 3 })),
                style: { height: 34, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: '0 12px', fontSize: 13 }
              })
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: '12px 0' } },
              React.createElement('input', {
                type: 'checkbox',
                checked: !!draft.tokenSavingsTracking,
                onChange: (e) => setDraft((d) => ({ ...d, tokenSavingsTracking: e.target.checked })),
                id: 'cl-tracking'
              }),
              React.createElement('label', { htmlFor: 'cl-tracking', style: { fontSize: 13 } }, tt('tracking'))
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('preview')),
              React.createElement('textarea', {
                value: previewIn,
                onChange: (e) => setPreviewIn(e.target.value),
                placeholder: tt('placeholder'),
                rows: 5,
                style: { border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: 12, fontSize: 12, fontFamily: 'monospace' }
              }),
              React.createElement('button', {
                onClick: onPreview,
                style: { appearance: 'none', font: 'inherit', cursor: 'pointer', border: '1px solid transparent', borderRadius: 8, padding: '5px 14px', fontSize: 13, background: 'var(--dsw-alias-label-primary)', color: 'var(--dsw-alias-bg-layer-3)', alignSelf: 'flex-start' }
              }, tt('compress')),
              previewOut ? React.createElement('pre', { style: { whiteSpace: 'pre-wrap', fontSize: 12, background: 'var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-3))', padding: 12, borderRadius: 8, maxHeight: 200, overflow: 'auto' } }, previewOut) : null
            ),
            saveErr ? React.createElement('div', { style: { color: '#d73a4a', fontSize: 12, padding: '4px 0' } }, saveErr) : null,
            React.createElement('div', { className: 'cl-foot', style: { borderTop: '1px solid var(--dsw-alias-border-l2)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '12px 0 4px' } },
              React.createElement('button', {
                className: 'cl-save',
                onClick: onSave,
                disabled: saving,
                style: { appearance: 'none', font: 'inherit', cursor: 'pointer', border: '1px solid transparent', borderRadius: 8, padding: '5px 14px', fontSize: 13, background: 'var(--dsw-alias-label-primary)', color: 'var(--dsw-alias-bg-layer-3)', opacity: saving ? 0.6 : 1 }
              }, saving ? tt('saving') : tt('ready'))
            )
          )
        ) : null
      );
    }

    module.exports.inject = ['slots', 'locale', 'betterSidebar'];
    module.exports.apply = function apply(ctx) {
      try { ctx.locale.register(NS, { en, ru }); } catch (e) { console.warn('[dsh-context-lens] locale register failed', e && e.message || e); }
      if (!ctx.slots) return;
      let registered = false;
      const doRegister = () => {
        if (registered) return;
        try {
          const dispose = ctx.slots.register({
            name: 'settings.plugin.item',
            key: NS,
            locale: NS,
            inject: () => ({ ctx })
          }, PluginCard);
          registered = true;
          return dispose;
        } catch (e) {
          // Do not swallow real registration errors — surface diagnostics
          console.error('[dsh-context-lens] settings.plugin.item register failed', e && e.stack || e);
          throw e;
        }
      };
      // Declaration-aware: wait for host to declare the slot (alpha2 SlotCore throws if not declared)
      if (typeof ctx.slots.inject === 'function') {
        try {
          const ok = ctx.slots.inject('settings.plugin.item', doRegister);
          if (!ok) console.warn('[dsh-context-lens] settings.plugin.item inject returned false — slot not declared yet');
        } catch (e) {
          console.error('[dsh-context-lens] settings.plugin.item inject failed', e && e.stack || e);
          // Fallback for older DSH without inject or if inject itself fails — surface error
          try { doRegister(); } catch (e2) { console.error('[dsh-context-lens] fallback register failed', e2 && e2.stack || e2); throw e2; }
          throw e;
        }
      } else {
        try { doRegister(); } catch (e) { console.error('[dsh-context-lens] direct register failed (no inject)', e && e.stack || e); throw e; }
      }
      // BetterSidebar tab (optional, for dsh-better-sidebar)
      if (ctx.betterSidebar && typeof ctx.betterSidebar.registerTab === 'function') {
        try {
          ctx.effect(() => ctx.betterSidebar.registerTab({
            id: 'dsh-context-lens:tab',
            title: () => 'Lens',
            icon: () => React.createElement('span', null, '◐'),
            order: 50,
            component: ({ scope }) => React.createElement(LensTab, { ctx, scope })
          }));
        } catch (e) {
          console.warn('[dsh-context-lens] betterSidebar registerTab failed', e && e.message || e);
        }
      }
      // Header badge (#20) — compact savings in conversation header
      if (ctx.slots) {
        const headerBadgeRegister = () => {
          try {
            return ctx.slots.register({
              name: 'conversation.header',
              id: 'dsh-context-lens:header-badge',
              order: 50,
              inject: () => ({ ctx })
            }, HeaderBadge);
          } catch (e) {
            console.warn('[dsh-context-lens] header badge register failed', e && e.message || e);
          }
        };
        if (typeof ctx.slots.inject === 'function') {
          try { ctx.slots.inject('conversation.header', headerBadgeRegister); } catch (e) { console.warn('[dsh-context-lens] header inject failed', e && e.message || e); try { headerBadgeRegister(); } catch (e2) {} }
        } else {
          try { headerBadgeRegister(); } catch (e) {}
        }
      }
    };
    return module.exports;
  }
});
