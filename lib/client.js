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

    // #45: preview uses POST /dsh-context-lens/compress-preview (server compressor)

    // #43: shared status UI for LensTab + HeaderChip popover
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
      const L = labels || en;
      const warn = !!(stats && stats.lowBudget);
      const hasSavings = !!(stats && stats.savedTokens > 0);
      const barColor = warn ? '#d73a4a' : 'var(--dsw-alias-label-primary)';
      const previewLen = compact ? 28 : 40;
      const barH = compact ? 5 : 6;
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
                style: {
                  fontSize: 11, padding: '1px 6px', borderRadius: 4,
                  background: warn ? 'rgba(215, 58, 74, 0.15)' : 'var(--dsw-alias-bg-layer-2)',
                  color: warn ? '#d73a4a' : 'var(--dsw-alias-label-tertiary)',
                  border: '1px solid ' + (warn ? 'rgba(215, 58, 74, 0.3)' : 'var(--dsw-alias-border-l2)')
                }
              }, warn ? L.lowBudgetBadge : (stats ? L.active : L.readyState))
            : null
        ));
      }
      children.push(
        hasSavings
          ? React.createElement('div', { key: 'sum', style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: compact ? 8 : 0 } },
              `${L.saved} ${stats.savedTokens} ${L.tokens} (${stats.savedPercent}%) · ${stats.calls} ${L.ops}`)
          : React.createElement('div', { key: 'sum', style: { fontSize: 12, color: compact ? 'var(--dsw-alias-label-tertiary)' : 'var(--dsw-alias-label-secondary)', marginBottom: compact ? 8 : 0 } }, L.noData)
      );
      if (stats && stats.lowBudget && !showBadge) {
        children.push(React.createElement('div', { key: 'warn', style: { marginTop: 6, fontSize: 11, color: '#d73a4a' } }, '⚠ ' + L.lowBudget));
      }
      if (stats && stats.budgetLimit) {
        children.push(React.createElement('div', { key: 'budget', style: { marginTop: compact ? 6 : 8, marginBottom: compact ? 8 : 0 } },
          React.createElement('div', {
            style: {
              display: compact ? 'flex' : 'block',
              justifyContent: 'space-between',
              fontSize: 11,
              color: warn ? '#d73a4a' : 'var(--dsw-alias-label-secondary)',
              marginBottom: 4
            }
          },
            compact
              ? React.createElement(React.Fragment, null,
                  React.createElement('span', null, L.budget),
                  React.createElement('span', null, `${stats.budgetUsed || 0} / ${stats.budgetLimit} (${stats.budgetPercent || 0}%)`)
                )
              : `${L.budget} ${stats.budgetUsed}/${stats.budgetLimit} ${L.tokens} (${stats.budgetPercent}%)${warn ? ' ⚠' : ''}`
          ),
          React.createElement('div', { style: { height: barH, borderRadius: 3, background: compact ? 'var(--dsw-alias-bg-layer-1)' : 'var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-3))', overflow: 'hidden' } },
            React.createElement('div', { style: { height: '100%', width: Math.min(100, stats.budgetPercent || 0) + '%', background: barColor, transition: 'width .2s' } })
          )
        ));
      }
      if (history && history.length) {
        children.push(React.createElement('div', {
          key: 'hist',
          style: { marginTop: compact ? 8 : 10, paddingTop: compact ? 8 : 0, borderTop: compact ? '1px solid var(--dsw-alias-border-l3)' : undefined }
        },
          React.createElement('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginBottom: 4 } }, L.history),
          ...history.slice(0, 3).map((h) => React.createElement('div', {
            key: h.id,
            style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', padding: '2px 0', overflow: compact ? 'hidden' : undefined, textOverflow: compact ? 'ellipsis' : undefined, whiteSpace: compact ? 'nowrap' : undefined }
          }, `−${h.savedTokens} tk (${h.savedPercent}%) · ${(h.preview || '').slice(0, previewLen)}`))
        ));
      }
      if (onRefresh) {
        children.push(React.createElement('div', {
          key: 'act',
          style: { marginTop: compact ? 10 : 12, display: 'flex', gap: 8, justifyContent: compact ? 'flex-end' : undefined }
        },
          React.createElement('button', {
            type: 'button',
            onClick: onRefresh,
            style: {
              appearance: 'none', cursor: 'pointer', fontSize: compact ? 11 : 12,
              padding: compact ? '3px 8px' : '4px 10px', borderRadius: 6,
              border: '1px solid var(--dsw-alias-border-l2)',
              background: compact ? 'var(--dsw-alias-bg-layer-2)' : 'var(--dsw-alias-bg-layer-3)',
              color: compact ? 'var(--dsw-alias-label-secondary)' : 'var(--dsw-alias-label-primary)'
            }
          }, L.refresh)
        ));
      }
      return React.createElement(React.Fragment, null, ...children);
    }

    function fetchLensStatus() {
      return fetch('/dsh-context-lens/status', { headers: { accept: 'application/json' } })
        .then((r) => r.ok ? r.json() : null);
    }

    function LensTab({ ctx: _ctx, scope }) {
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

    function HeaderChip({ ctx: _ctx }) {
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
        // Adaptive polling: poll every 4s when popover is open, 15s when closed, pause when tab hidden
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
      const color = warn ? '#d73a4a' : 'var(--dsw-alias-label-secondary)';
      const borderColor = warn ? '#d73a4a' : open ? 'var(--dsw-alias-border-l1)' : 'var(--dsw-alias-border-l2)';

      const popover = open ? React.createElement('div', {
        style: {
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 270,
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
          warn ? React.createElement('span', { style: { color: '#d73a4a' } }, ' ⚠') : null
        ),
        popover
      );
    }

    function PluginCard({ ctx: _ctx, t }) {
      const [expanded, setExpanded] = React.useState(false);
      // hooks must be before any return — React 310
      const [draft, setDraft] = React.useState({ compressionMode: 'balanced', astSkeletonMaxDepth: 3, tokenSavingsTracking: true, budgetLimit: 100000, autoCollapse: true, autoCompressThreshold: 4000 });
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
          if (_ctx.settingsScope) {
            scopeRef.current = _ctx.settingsScope.bind({ namespace: NS });
          }
        } catch (e) { scopeRef.current = null; }
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
        if (!expanded) return;
        fetch('/dsh-context-lens/status').then((r) => r.ok ? r.json() : null).then((j) => {
          if (j && j.stats) {
            setStats(j.stats);
            // #41: warn instead of force-closing the card
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
          budgetWarn ? React.createElement('div', { style: { marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(215,58,74,0.12)', color: '#d73a4a', fontSize: 12 } }, '⚠ ' + tt('lowBudget')) : null,
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
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: '12px 0' } },
              React.createElement('input', {
                type: 'checkbox',
                checked: !!draft.autoCollapse,
                onChange: (e) => setDraft((d) => ({ ...d, autoCollapse: e.target.checked })),
                id: 'cl-autocollapse'
              }),
              React.createElement('label', { htmlFor: 'cl-autocollapse', style: { fontSize: 13 } }, tt('autoCollapse'))
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('budget') + ' (tokens)'),
              React.createElement('input', {
                className: 'cl-input', type: 'number', min: 1000, step: 1000,
                value: draft.budgetLimit,
                onChange: (e) => setDraft((d) => ({ ...d, budgetLimit: parseInt(e.target.value, 10) || 100000 })),
                style: { height: 34, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: '0 12px', fontSize: 13 }
              })
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('threshold')),
              React.createElement('input', {
                className: 'cl-input', type: 'number', min: 0, step: 500,
                value: draft.autoCompressThreshold,
                onChange: (e) => setDraft((d) => ({ ...d, autoCompressThreshold: parseInt(e.target.value, 10) || 0 })),
                style: { height: 34, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: '0 12px', fontSize: 13 }
              })
            ),
            React.createElement('div', { className: 'cl-field', style: { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' } },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('preview') + ' (' + tt('previewApprox') + ')'),
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
      // BetterSidebar tab (optional, for dsh-better-sidebar via ctx.inject)
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
        } catch (e) {
          // host without betterSidebar declared or inject failure
        }
      }
      // Header chip (#31) — telemetry and token guard in conversation session utilities slot
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
