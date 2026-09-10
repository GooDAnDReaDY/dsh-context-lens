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
      ready: 'Ready',
      budget: 'Budget',
      history: 'Recent ops',
      lowBudget: 'Budget nearly exhausted',
      threshold: 'Auto-compress threshold (chars)',
      autoCollapse: 'Warn when budget is nearly exhausted',
      previewApprox: 'Server preview',
      noData: 'No data yet',
      refresh: 'Refresh',
      ops: 'ops',
      active: 'Active',
      readyState: 'Ready',
      lowBudgetBadge: 'Low Budget ⚠'
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
      ready: 'Готово',
      budget: 'Бюджет',
      history: 'Последние операции',
      lowBudget: 'Бюджет почти исчерпан',
      threshold: 'Порог авто-сжатия (символы)',
      autoCollapse: 'Предупреждать при почти исчерпанном бюджете',
      previewApprox: 'Серверный предпросмотр',
      noData: 'Пока нет данных',
      refresh: 'Обновить',
      ops: 'оп.',
      active: 'Активен',
      readyState: 'Готов',
      lowBudgetBadge: 'Мало бюджета ⚠'
    };

    function ensureCss() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('dsh-context-lens-css')) return;
      const style = document.createElement('style');
      style.id = 'dsh-context-lens-css';
      style.dataset.dshPlugin = NS;
      style.textContent = `
.cl-section-card {
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-3);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;
}
.cl-section-header {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0;
  text-align: left;
}
.cl-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l2);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}
.cl-badge-ok {
  border-color: var(--dsw-alias-state-success-primary, #10b981);
  color: var(--dsw-alias-state-success-primary, #10b981);
  background: rgba(16, 185, 129, 0.08);
}
.cl-badge-warn {
  border-color: var(--dsw-alias-state-error-primary, #ef4444);
  color: var(--dsw-alias-state-error-primary, #ef4444);
  background: rgba(239, 68, 68, 0.08);
}
.cl-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  margin-top: 4px;
}
.cl-stat-box {
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cl-stat-val {
  font-size: 16px;
  font-weight: 700;
  color: var(--dsw-alias-label-primary);
}
.cl-stat-lbl {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
}
.cl-bar-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
}
.cl-bar-track {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1);
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l2);
}
.cl-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s;
}
.cl-input {
  height: 34px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 13px;
  box-sizing: border-box;
}
.cl-input:focus {
  outline: none;
  border-color: var(--dsw-alias-state-brand-primary, #3b82f6);
}
.cl-btn {
  appearance: none;
  font: inherit;
  cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s ease;
}
.cl-btn:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-4, var(--dsw-alias-bg-layer-2));
  border-color: var(--dsw-alias-label-dimmed, var(--dsw-alias-border-l2));
}
.cl-btn-primary {
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-layer-3);
  border-color: transparent;
}
.cl-btn-primary:hover:not(:disabled) {
  opacity: 0.88;
}
.cl-btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.cl-banner-warn {
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--dsw-alias-state-error-primary, #ef4444);
  color: var(--dsw-alias-state-error-primary, #ef4444);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}
.cl-hist-item {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
  padding: 4px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));
}
.cl-hist-item:last-child {
  border-bottom: none;
}
.cl-error-box {
  padding: 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid var(--dsw-alias-state-error-primary, #ef4444);
  color: var(--dsw-alias-state-error-primary, #ef4444);
  font-size: 12px;
}
`;
      document.head.appendChild(style);
    }

    function createErrorBoundary() {
      if (!React || typeof React.Component !== 'function') {
        return function NoopBoundary(props) { return (props && props.children) || null; };
      }
      return class ErrorBoundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { hasError: false, error: null };
        }
        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }
        componentDidCatch(error, errorInfo) {
          console.error('[dsh-context-lens] UI Error:', error, errorInfo);
        }
        render() {
          if (this.state.hasError) {
            return React.createElement('div', { className: 'cl-error-box' },
              React.createElement('div', { style: { fontWeight: 600, marginBottom: 4 } }, '⚠ Context Lens UI Error'),
              React.createElement('div', { style: { fontSize: 11, wordBreak: 'break-all' } }, String(this.state.error?.message || this.state.error)),
              React.createElement('button', {
                type: 'button',
                className: 'cl-btn',
                style: { marginTop: 8, fontSize: 11, padding: '3px 8px' },
                onClick: () => this.setState({ hasError: false, error: null })
              }, 'Retry')
            );
          }
          return (this.props && this.props.children) || null;
        }
      };
    }
    const ErrorBoundary = createErrorBoundary();

    function getActiveLocale(ctx) {
      try {
        if (ctx && ctx.locale && typeof ctx.locale.getSnapshot === 'function') {
          const snap = ctx.locale.getSnapshot();
          if (snap && snap.active && snap.active.startsWith('ru')) return ru;
        }
      } catch {}
      return en;
    }

    function StatusPanel({ stats, history, labels, onRefresh, title, showBadge, compact }) {
      ensureCss();
      const L = labels || en;
      const warn = !!(stats && stats.lowBudget);
      const hasSavings = !!(stats && stats.savedTokens > 0);
      const barColor = warn ? 'var(--dsw-alias-state-error-primary, #ef4444)' : 'var(--dsw-alias-state-success-primary, #10b981)';
      const previewLen = compact ? 28 : 44;
      const children = [];

      if (title || showBadge) {
        children.push(React.createElement('div', {
          key: 'head',
          style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }
        },
          title
            ? React.createElement('div', { style: { fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--dsw-alias-label-primary)' } },
                React.createElement('span', { style: { opacity: 0.8 } }, '◐'),
                title
              )
            : React.createElement('span'),
          showBadge
            ? React.createElement('span', {
                className: 'cl-badge ' + (warn ? 'cl-badge-warn' : 'cl-badge-ok')
              }, warn ? L.lowBudgetBadge : (stats ? L.active : L.readyState))
            : null
        ));
      }

      if (stats) {
        children.push(React.createElement('div', { key: 'stats', className: 'cl-stat-grid' },
          React.createElement('div', { className: 'cl-stat-box' },
            React.createElement('div', { className: 'cl-stat-val' }, stats.savedTokens ? `${stats.savedTokens}` : '0'),
            React.createElement('div', { className: 'cl-stat-lbl' }, `${L.saved} ${L.tokens}`)
          ),
          React.createElement('div', { className: 'cl-stat-box' },
            React.createElement('div', { className: 'cl-stat-val' }, `${stats.savedPercent || 0}%`),
            React.createElement('div', { className: 'cl-stat-lbl' }, '% ' + L.saved)
          ),
          React.createElement('div', { className: 'cl-stat-box' },
            React.createElement('div', { className: 'cl-stat-val' }, `${stats.calls || 0}`),
            React.createElement('div', { className: 'cl-stat-lbl' }, L.ops)
          )
        ));
      } else {
        children.push(React.createElement('div', {
          key: 'nodata',
          style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', padding: '6px 0' }
        }, L.noData));
      }

      if (stats && stats.lowBudget && !showBadge) {
        children.push(React.createElement('div', {
          key: 'warn',
          className: 'cl-banner-warn',
          style: { marginTop: 8 }
        }, '⚠ ' + L.lowBudget));
      }

      if (stats && stats.budgetLimit) {
        children.push(React.createElement('div', { key: 'budget', className: 'cl-bar-box', style: { marginTop: 8 } },
          React.createElement('div', {
            style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: warn ? 'var(--dsw-alias-state-error-primary, #ef4444)' : 'var(--dsw-alias-label-secondary)' }
          },
            React.createElement('span', { style: { fontWeight: 500 } }, L.budget),
            React.createElement('span', null, `${stats.budgetUsed || 0} / ${stats.budgetLimit} (${stats.budgetPercent || 0}%)`)
          ),
          React.createElement('div', { className: 'cl-bar-track' },
            React.createElement('div', {
              className: 'cl-bar-fill',
              style: { width: Math.min(100, stats.budgetPercent || 0) + '%', background: barColor }
            })
          )
        ));
      }

      if (history && history.length) {
        children.push(React.createElement('div', {
          key: 'hist',
          style: { marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--dsw-alias-border-l2)' }
        },
          React.createElement('div', { style: { fontSize: 11, fontWeight: 600, color: 'var(--dsw-alias-label-tertiary)', marginBottom: 4 } }, L.history),
          ...history.slice(0, 3).map((h) => React.createElement('div', {
            key: h.id,
            className: 'cl-hist-item',
            style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
          }, `−${h.savedTokens} tk (${h.savedPercent}%) · ${(h.preview || '').slice(0, previewLen)}`))
        ));
      }

      if (onRefresh) {
        children.push(React.createElement('div', {
          key: 'act',
          style: { marginTop: 10, display: 'flex', justifyContent: 'flex-end' }
        },
          React.createElement('button', {
            type: 'button',
            onClick: onRefresh,
            className: 'cl-btn'
          }, L.refresh)
        ));
      }

      return React.createElement(React.Fragment, null, ...children);
    }

    function fetchLensStatus() {
      return fetch('/dsh-context-lens/status', { headers: { accept: 'application/json' } })
        .then((r) => r.ok ? r.json() : null);
    }

    function LensTabInner({ ctx: _ctx, scope }) {
      ensureCss();
      const [stats, setStats] = React.useState(null);
      const [history, setHistory] = React.useState([]);
      const L = React.useMemo(() => getActiveLocale(_ctx), [_ctx]);
      const apply = (j) => {
        if (j && j.stats) setStats(j.stats);
        if (j && j.history) setHistory(j.history || []);
      };
      const refresh = () => fetchLensStatus().then(apply).catch(() => {});
      React.useEffect(() => { refresh(); }, []);
      return React.createElement('div', { style: { padding: 12 } },
        React.createElement(StatusPanel, {
          stats, history, labels: L, onRefresh: refresh, title: 'Context Lens', showBadge: false, compact: false
        })
      );
    }

    function LensTab(props) {
      return React.createElement(ErrorBoundary, null,
        React.createElement(LensTabInner, props)
      );
    }

    function HeaderChip({ ctx: _ctx }) {
      ensureCss();
      const [stats, setStats] = React.useState(null);
      const [history, setHistory] = React.useState([]);
      const [open, setOpen] = React.useState(false);
      const ref = React.useRef(null);
      const L = React.useMemo(() => getActiveLocale(_ctx), [_ctx]);

      const fetchStatus = () => fetchLensStatus().then((j) => {
        if (j && j.stats) setStats(j.stats);
        if (j && j.history) setHistory(j.history || []);
      }).catch(() => {});

      React.useEffect(() => {
        let alive = true;
        fetchStatus();
        const pollInterval = open ? 4000 : 15000;
        const id = setInterval(() => {
          if (!alive) return;
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          fetchStatus();
        }, pollInterval);

        const onVisChange = () => {
          if (typeof document !== 'undefined' && document.visibilityState === 'visible' && alive) {
            fetchStatus();
          }
        };
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', onVisChange);
        }
        return () => {
          alive = false;
          clearInterval(id);
          if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', onVisChange);
          }
        };
      }, [open]);

      React.useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
          if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
      }, [open]);

      const warn = !!(stats && stats.lowBudget);
      const hasSavings = !!(stats && stats.savedTokens > 0);
      const label = hasSavings ? `Lens ${stats.savedPercent}%` : 'Lens';
      const color = warn ? 'var(--dsw-alias-state-error-primary, #ef4444)' : 'var(--dsw-alias-label-secondary)';
      const borderColor = warn ? 'var(--dsw-alias-state-error-primary, #ef4444)' : open ? 'var(--dsw-alias-border-l1)' : 'var(--dsw-alias-border-l2)';

      const popover = open ? React.createElement('div', {
        style: {
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 280,
          background: 'var(--dsw-alias-bg-layer-3)', border: '1px solid var(--dsw-alias-border-l2)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)', padding: '12px 14px',
          zIndex: 1000, fontSize: 12, color: 'var(--dsw-alias-label-primary)', cursor: 'default', textAlign: 'left'
        },
        onClick: (e) => e.stopPropagation()
      },
        React.createElement(StatusPanel, {
          stats, history, labels: L, onRefresh: fetchStatus, title: 'Context Lens', showBadge: true, compact: true
        })
      ) : null;

      return React.createElement('div', { ref, style: { position: 'relative', display: 'inline-flex', alignItems: 'center' } },
        React.createElement('button', {
          type: 'button',
          title: hasSavings ? `Context Lens: ${L.saved} ${stats.savedTokens} ${L.tokens} (${stats.savedPercent}%)` : `Context Lens: ${L.active}`,
          onClick: () => setOpen((v) => !v),
          style: {
            appearance: 'none', font: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 999, fontSize: 11, lineHeight: '16px',
            background: open ? 'var(--dsw-alias-bg-layer-3)' : 'var(--dsw-alias-bg-layer-2)',
            color, border: '1px solid ' + borderColor, marginLeft: 6
          }
        },
          React.createElement('span', { style: { fontSize: 10, opacity: 0.8 } }, '◐'),
          label,
          warn ? React.createElement('span', { style: { color: 'var(--dsw-alias-state-error-primary, #ef4444)' } }, ' ⚠') : null
        ),
        popover
      );
    }

    function PluginCardInner({ ctx: _ctx, t }) {
      ensureCss();
      const [expanded, setExpanded] = React.useState(false);
      const [draft, setDraft] = React.useState({
        compressionMode: 'balanced',
        astSkeletonMaxDepth: 3,
        tokenSavingsTracking: true,
        budgetLimit: 100000,
        autoCollapse: true,
        autoCompressThreshold: 4000
      });
      const [status, setStatus] = React.useState('loading');
      const [saving, setSaving] = React.useState(false);
      const [saveErr, setSaveErr] = React.useState('');
      const [previewIn, setPreviewIn] = React.useState('FAIL  src/app.test.js\n  ● should handle\n    Expected 1 got 2\n    at Object.<anonymous> (src/app.test.js:10:5)\nPASS  src/ok.test.js\n');
      const [previewOut, setPreviewOut] = React.useState('');
      const [stats, setStats] = React.useState(null);
      const [budgetWarn, setBudgetWarn] = React.useState(false);

      const scopeRef = React.useRef(null);
      if (!scopeRef.current && _ctx) {
        try {
          const s = (_ctx.get && _ctx.get('lanSettings')) || _ctx.settingsScope;
          if (s && typeof s.bind === 'function') {
            scopeRef.current = s.bind({ namespace: NS });
          }
        } catch (e) { scopeRef.current = null; }
      }
      const scope = scopeRef.current;

      React.useEffect(() => {
        if (!scope) { setStatus('unavailable'); return; }
        let cancelled = false;

        const loadSnap = async () => {
          try {
            const snap = (typeof scope.getSnapshot === 'function')
              ? scope.getSnapshot()
              : (typeof scope.get === 'function' ? await scope.get() : null);
            if (cancelled) return;
            if (snap && typeof snap === 'object' && 'status' in snap) {
              if (snap.status === 'loading') { setStatus('loading'); return; }
              if (snap.status === 'unavailable') { setStatus('unavailable'); return; }
            }
            const vals = snap && snap.values ? snap.values : snap;
            if (vals && typeof vals === 'object') {
              setDraft((d) => ({ ...d, ...vals }));
            }
            setStatus('ready');
          } catch (e) {
            if (!cancelled) setStatus('unavailable');
          }
        };

        loadSnap();

        let unsub = null;
        if (typeof scope.subscribe === 'function') {
          try {
            unsub = scope.subscribe(() => {
              if (!cancelled) loadSnap();
            });
          } catch (_) {}
        }

        return () => {
          cancelled = true;
          if (typeof unsub === 'function') unsub();
        };
      }, [scope]);

      React.useEffect(() => {
        if (!expanded) return;
        fetch('/dsh-context-lens/status').then((r) => r.ok ? r.json() : null).then((j) => {
          if (j && j.stats) {
            setStats(j.stats);
            setBudgetWarn(!!(j.stats.lowBudget && draft.autoCollapse !== false));
          }
        }).catch(() => {});
      }, [expanded, draft.autoCollapse]);

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
        try {
          if (typeof scope.patch === 'function') {
            await scope.patch(draft);
          } else if (typeof scope.setAll === 'function') {
            await scope.setAll(draft);
          } else {
            const keys = Object.keys(draft);
            const errs = [];
            for (const k of keys) {
              try { await scope.set(k, draft[k]); } catch (e) { errs.push(k + ': ' + (e && e.message || String(e))); }
            }
            if (errs.length) throw new Error(errs.join('; '));
          }
        } catch (e) {
          setSaveErr(e && e.message || String(e));
        } finally {
          setSaving(false);
        }
      }

      async function onPreview() {
        try {
          const res = await fetch('/dsh-context-lens/compress-preview', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text: previewIn, mode: draft.compressionMode || 'balanced' })
          });
          const j = await res.json();
          setPreviewOut((j && j.compressed) || (j && j.error) || '');
        } catch (e) {
          setPreviewOut(String(e && e.message || e));
        }
      }

      return React.createElement('li', { className: 'cl-section-card' },
        React.createElement('button', {
          type: 'button',
          className: 'cl-section-header',
          onClick: () => setExpanded(!expanded),
          'aria-expanded': expanded
        },
          React.createElement('span', { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
            React.createElement('span', { className: 'cl-title', style: { color: 'var(--dsw-alias-label-primary)', fontSize: 15, fontWeight: 600, lineHeight: 1.4 } }, tt('title')),
            React.createElement('span', { className: 'cl-sub', style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 13 } }, tt('sub') + (stats ? ' · ' + tt('saved') + ' ' + (stats.savedTokens || 0) + ' ' + tt('tokens') + ' (' + (stats.savedPercent || 0) + '%)' : ''))
          ),
          React.createElement(Chevron, { open: expanded })
        ),
        expanded ? React.createElement('div', { className: 'cl-body', style: { borderTop: '1px solid var(--dsw-alias-border-l2)', paddingTop: 12 } },
          budgetWarn ? React.createElement('div', { className: 'cl-banner-warn', style: { marginBottom: 12 } }, '⚠ ' + tt('lowBudget')) : null,
          status === 'loading' ? React.createElement('div', { style: { padding: 12, color: 'var(--dsw-alias-label-secondary)' } }, 'Loading…') :
          status === 'unavailable' ? React.createElement('div', { style: { padding: 12, color: 'var(--dsw-alias-label-secondary)' } }, 'Settings unavailable — plugin not registered on host yet') :
          React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('mode')),
              React.createElement('select', {
                className: 'cl-input',
                value: draft.compressionMode,
                onChange: (e) => setDraft((d) => ({ ...d, compressionMode: e.target.value }))
              },
                React.createElement('option', { value: 'raw' }, 'raw'),
                React.createElement('option', { value: 'balanced' }, 'balanced'),
                React.createElement('option', { value: 'aggressive' }, 'aggressive')
              )
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('depth')),
              React.createElement('input', {
                className: 'cl-input',
                type: 'number', min: 1, max: 10,
                value: draft.astSkeletonMaxDepth,
                onChange: (e) => setDraft((d) => ({ ...d, astSkeletonMaxDepth: parseInt(e.target.value, 10) || 3 }))
              })
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: '8px 0' } },
              React.createElement('input', {
                type: 'checkbox',
                checked: !!draft.tokenSavingsTracking,
                onChange: (e) => setDraft((d) => ({ ...d, tokenSavingsTracking: e.target.checked })),
                id: 'cl-tracking'
              }),
              React.createElement('label', { htmlFor: 'cl-tracking', style: { fontSize: 13, color: 'var(--dsw-alias-label-primary)' } }, tt('tracking'))
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: '8px 0' } },
              React.createElement('input', {
                type: 'checkbox',
                checked: !!draft.autoCollapse,
                onChange: (e) => setDraft((d) => ({ ...d, autoCollapse: e.target.checked })),
                id: 'cl-autocollapse'
              }),
              React.createElement('label', { htmlFor: 'cl-autocollapse', style: { fontSize: 13, color: 'var(--dsw-alias-label-primary)' } }, tt('autoCollapse'))
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('budget') + ' (tokens)'),
              React.createElement('input', {
                className: 'cl-input', type: 'number', min: 1000, step: 1000,
                value: draft.budgetLimit,
                onChange: (e) => setDraft((d) => ({ ...d, budgetLimit: parseInt(e.target.value, 10) || 100000 }))
              })
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('threshold')),
              React.createElement('input', {
                className: 'cl-input', type: 'number', min: 0, step: 500,
                value: draft.autoCompressThreshold,
                onChange: (e) => setDraft((d) => ({ ...d, autoCompressThreshold: parseInt(e.target.value, 10) || 0 }))
              })
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('preview') + ' (' + tt('previewApprox') + ')'),
              React.createElement('textarea', {
                value: previewIn,
                onChange: (e) => setPreviewIn(e.target.value),
                placeholder: tt('placeholder'),
                rows: 5,
                style: { border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: 12, fontSize: 12, fontFamily: 'monospace' }
              }),
              React.createElement('button', {
                type: 'button',
                className: 'cl-btn cl-btn-primary',
                onClick: onPreview,
                style: { alignSelf: 'flex-start', marginTop: 4 }
              }, tt('compress')),
              previewOut ? React.createElement('pre', { style: { whiteSpace: 'pre-wrap', fontSize: 12, background: 'var(--dsw-alias-bg-layer-2)', padding: 12, borderRadius: 8, maxHeight: 200, overflow: 'auto', border: '1px solid var(--dsw-alias-border-l2)', marginTop: 8 } }, previewOut) : null
            ),
            saveErr ? React.createElement('div', { style: { color: 'var(--dsw-alias-state-error-primary, #ef4444)', fontSize: 12, padding: '4px 0' } }, saveErr) : null,
            React.createElement('div', { className: 'cl-foot', style: { borderTop: '1px solid var(--dsw-alias-border-l2)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 12 } },
              React.createElement('button', {
                type: 'button',
                className: 'cl-btn cl-btn-primary' + (saving ? ' cl-btn-disabled' : ''),
                onClick: onSave,
                disabled: saving
              }, saving ? tt('saving') : tt('ready'))
            )
          )
        ) : null
      );
    }

    function PluginCard(props) {
      return React.createElement(ErrorBoundary, null,
        React.createElement(PluginCardInner, props)
      );
    }

    module.exports.inject = ['slots', 'locale'];
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
          console.error('[dsh-context-lens] settings.plugin.item register failed', e && e.stack || e);
          throw e;
        }
      };
      if (typeof ctx.slots.inject === 'function') {
        try {
          const ok = ctx.slots.inject('settings.plugin.item', doRegister);
          if (!ok) console.warn('[dsh-context-lens] settings.plugin.item inject returned false — slot not declared yet');
        } catch (e) {
          console.error('[dsh-context-lens] settings.plugin.item inject failed', e && e.stack || e);
          try { doRegister(); } catch (e2) { console.error('[dsh-context-lens] fallback register failed', e2 && e2.stack || e2); throw e2; }
          throw e;
        }
      } else {
        try { doRegister(); } catch (e) { console.error('[dsh-context-lens] direct register failed (no inject)', e && e.stack || e); throw e; }
      }
      if (typeof ctx.inject === "function") {
        try {
          ctx.inject(["sidebarRightTabs"], (sctx) => {
            const tabs = sctx && sctx.sidebarRightTabs;
            if (!tabs || typeof tabs.register !== "function") return;
            try {
              const def = {
                id: "@goodandready/dsh-context-lens",
                kind: "context-lens",
                priority: "extension",
                title: () => "Lens",
                guide: [{
                  order: 50,
                  title: () => "Context Lens",
                  description: () => "AST compression, log filtering, token budget",
                  icon: () => React.createElement("span", null, "◐")
                }]
              };
              if (typeof sctx.effect === "function") {
                sctx.effect(() => tabs.register(def));
              } else {
                tabs.register(def);
              }

              if (ctx.slots) {
                const registerPaneTab = () => {
                  try {
                    return ctx.slots.register({
                      name: "sidebar.right.pane.tab",
                      key: "@goodandready/dsh-context-lens",
                      locale: NS,
                      inject: () => ({ ctx })
                    }, LensTab);
                  } catch (e) {
                    console.warn("[dsh-context-lens] native sidebar pane tab register failed", e && e.message || e);
                  }
                };
                if (typeof ctx.slots.inject === "function") {
                  try {
                    const ok = ctx.slots.inject("sidebar.right.pane.tab", registerPaneTab);
                    if (!ok) console.warn("[dsh-context-lens] sidebar.right.pane.tab inject returned false");
                  } catch (e) {
                    try { registerPaneTab(); } catch (e2) {}
                  }
                } else {
                  try { registerPaneTab(); } catch (e) {}
                }
              }
            } catch (e) {
              console.warn("[dsh-context-lens] native sidebar registration failed", e && e.message || e);
            }
          });
        } catch (e) {}
      }

      if (typeof ctx.inject === 'function') {
        try {
          ctx.inject(['betterSidebar'], (sctx) => {
            const svc = sctx && sctx.betterSidebar;
            if (!svc || typeof svc.registerTab !== 'function') return;
            try {
              const tabDef = {
                id: 'dsh-context-lens:tab',
                title: () => 'Lens',
                icon: () => React.createElement('span', null, '◐'),
                order: 50,
                component: ({ scope }) => React.createElement(LensTab, { ctx, scope })
              };
              if (typeof sctx.effect === 'function') {
                sctx.effect(() => svc.registerTab(tabDef));
              } else {
                svc.registerTab(tabDef);
              }
            } catch (e) {
              console.warn('[dsh-context-lens] betterSidebar registerTab failed', e && e.message || e);
            }
          });
        } catch (e) {}
      }

      if (ctx.slots) {
        const headerChipRegister = () => {
          try {
            return ctx.slots.register({
              name: 'conversation.session.header.utilities',
              id: 'dsh-context-lens-header-chip',
              order: 7,
              inject: () => ({ ctx })
            }, HeaderChip);
          } catch (e) {
            console.warn('[dsh-context-lens] header chip register failed', e && e.message || e);
          }
        };
        if (typeof ctx.slots.inject === 'function') {
          try {
            ctx.slots.inject('conversation.session.header.utilities', headerChipRegister);
          } catch (e) {
            console.warn('[dsh-context-lens] utilities inject failed', e && e.message || e);
            try { headerChipRegister(); } catch (e2) {}
          }
        } else {
          try { headerChipRegister(); } catch (e) {}
        }
      }
    };
    return module.exports;
  }
});
