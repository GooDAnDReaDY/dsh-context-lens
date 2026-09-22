window.__ModuleLoader__.load({
  id: '@goodandready/dsh-context-lens',
  factory: (require) => {
    var module = { exports: {} };
    const React = require('react');
    const NS = '@goodandready/dsh-context-lens';
    // Plugins page row seat (DSH 0.1.6-alpha.2): key = '<package name>#<row id>',
    // row id as cordis.patch.yml declares it.
    const PKG = '@goodandready/dsh-context-lens';
    const ROW_ID = 'dsh-context-lens';
    const ROW_CONFIG_KEY = PKG + '#' + ROW_ID;

        const en = {
      'update.available': 'Update available: v{latestVersion} (current: v{currentVersion})',
      'update.btn': 'Update Now',
      'update.updating': 'Updating…',
      'update.done': 'Successfully updated to v{version}! Please restart DSH.',
      'update.failed': 'Update failed: {error}',
      'update.checking': 'Checking for updates…',
      'update.up_to_date': 'Up to date',
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
      budgetAlertPercent: 'Budget alert threshold (%)',
      previewApprox: 'Server preview',
      noData: 'No data yet',
      refresh: 'Refresh',
      ops: 'ops',
      active: 'Active',
      readyState: 'Ready',
      lowBudgetBadge: 'Low Budget ⚠',
      focusPaths: 'Active focus',
      noFocus: 'No focus paths set',
      clearFocus: 'Clear focus'
    };

    const zh = {
      'update.available': '发现新版本 v{latestVersion}（当前版本 v{currentVersion}）',
      'update.btn': '立即更新',
      'update.updating': '正在更新…',
      'update.done': '更新成功至 v{version}！请重启 DSH 服务生效。',
      'update.failed': '更新失败：{error}',
      'update.checking': '正在检查更新…',
      'update.up_to_date': '已是最新版本',
      title: 'Context Lens 上下文镜头与 Token 守卫',
      sub: 'AST 代码精简、日志过滤与 Token 预算监控',
      mode: '压缩模式',
      depth: 'AST 最大深度',
      tracking: '追踪 Token 节省',
      preview: '日志预览',
      compress: '压缩',
      saved: '已节省',
      tokens: 'Token',
      placeholder: '在此粘贴 Jest/Pytest 等测试日志…',
      saving: '保存中…',
      ready: '已就绪',
      budget: '预算',
      history: '近期操作',
      lowBudget: 'Token 预算即将耗尽',
      threshold: '自动压缩阈值 (字符数)',
      autoCollapse: '预算偏低时在界面提示警告',
      budgetAlertPercent: '预算警告阈值 (%)',
      previewApprox: '服务端压缩预览',
      noData: '暂无数据',
      refresh: '刷新',
      ops: '次操作',
      active: '运行中',
      readyState: '已就绪',
      lowBudgetBadge: '预算紧张 ⚠',
      focusPaths: '当前聚焦路径',
      noFocus: '未设置聚焦路径',
      clearFocus: '清除聚焦'
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
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #10b981) 8%, transparent);
}
.cl-badge-warn {
  border-color: var(--dsw-alias-state-error-primary, #ef4444);
  color: var(--dsw-alias-state-error-primary, #ef4444);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef4444) 8%, transparent);
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
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef4444) 10%, transparent);
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
.cl-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  color: var(--dsw-alias-label-secondary);
}
.cl-error-box {
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #ef4444) 8%, transparent);
  border: 1px solid var(--dsw-alias-state-error-primary, #ef4444);
  color: var(--dsw-alias-state-error-primary, #ef4444);
  font-size: 12px;
}
`;
      document.head.appendChild(style);
    }

    function makeT(dict, fallback) {
      return function t(key, vars) {
        let val = (dict && dict[key]) || (fallback && fallback[key]) || key;
        if (vars && typeof val === 'string') {
          for (const k of Object.keys(vars)) {
            val = val.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
          }
        }
        return val;
      };
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
          if (snap && snap.active && snap.active.startsWith('zh')) return zh;
        }
      } catch (err) {
        /* intentional fallback: default to english on snapshot error */
      }
      return en;
    }

    function StatusPanel({ stats, history, focus, sessionId, labels, onRefresh, onClearFocus, title, showBadge, compact }) {
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

            // Active focus paths section
      const focusPaths = (focus && focus.paths) || [];
      if (focusPaths.length > 0 || onClearFocus) {
        children.push(React.createElement('div', {
          key: 'focus',
          style: { marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--dsw-alias-border-l2)' }
        },
          React.createElement('div', {
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }
          },
            React.createElement('span', { style: { fontSize: 11, fontWeight: 600, color: 'var(--dsw-alias-label-secondary)' } }, L.focusPaths),
            focusPaths.length > 0 && onClearFocus
              ? React.createElement('button', {
                  type: 'button',
                  onClick: onClearFocus,
                  style: { background: 'none', border: 'none', padding: 0, fontSize: 10, color: 'var(--dsw-alias-label-tertiary)', cursor: 'pointer', textDecoration: 'underline' }
                }, L.clearFocus)
              : null
          ),
          focusPaths.length > 0
            ? React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 } },
                ...focusPaths.slice(0, 4).map((p, i) => React.createElement('span', { key: i, className: 'cl-tag' }, p))
              )
            : React.createElement('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', fontStyle: 'italic' } }, L.noFocus)
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

    function clearLensFocus(sessionId) {
      const q = sessionId ? '?sessionId=' + encodeURIComponent(sessionId) : '';
      return fetch('/dsh-context-lens/clear-focus' + q, { method: 'POST', headers: { accept: 'application/json' } })
        .then((r) => r.ok ? r.json() : null);
    }

    function LensTabInner({ ctx: _ctx, scope }) {
      ensureCss();
      const [stats, setStats] = React.useState(null);
      const [history, setHistory] = React.useState([]);
      const [focus, setFocus] = React.useState(null);
      const [sessionId, setSessionId] = React.useState(null);
      const L = React.useMemo(() => getActiveLocale(_ctx), [_ctx]);
      const apply = (j) => {
        if (j && j.stats) setStats(j.stats);
        if (j && j.history) setHistory(j.history || []);
        if (j && j.focus) setFocus(j.focus);
        if (j && j.sessionId) setSessionId(j.sessionId);
      };
      const refresh = () => fetchLensStatus().then(apply).catch(() => {});
      const handleClearFocus = () => clearLensFocus(sessionId).then(() => refresh()).catch(() => {});
      React.useEffect(() => { refresh(); }, []);
      return React.createElement('div', { style: { padding: 12 } },
        React.createElement(StatusPanel, {
          stats, history, focus, sessionId, labels: L, onRefresh: refresh, onClearFocus: handleClearFocus, title: 'Context Lens', showBadge: false, compact: false
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
      const [focus, setFocus] = React.useState(null);
      const [sessionId, setSessionId] = React.useState(null);
      const [open, setOpen] = React.useState(false);
      const ref = React.useRef(null);
      const L = React.useMemo(() => getActiveLocale(_ctx), [_ctx]);

      const fetchStatus = () => fetchLensStatus().then((j) => {
        if (j && j.stats) setStats(j.stats);
        if (j && j.history) setHistory(j.history || []);
        if (j && j.focus) setFocus(j.focus);
        if (j && j.sessionId) setSessionId(j.sessionId);
      }).catch(() => {});

      const handleClearFocus = () => clearLensFocus(sessionId).then(() => fetchStatus()).catch(() => {});

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
          borderRadius: 10, boxShadow: 'var(--dsw-alias-modal-shadow, var(--dsw-alias-shadow-large, 0 4px 16px var(--dsw-alias-border-l1)))', padding: '12px 14px',
          zIndex: 1000, fontSize: 12, color: 'var(--dsw-alias-label-primary)', cursor: 'default', textAlign: 'left'
        },
        onClick: (e) => e.stopPropagation()
      },
        React.createElement(StatusPanel, {
          stats, history, focus, sessionId, labels: L, onRefresh: fetchStatus, onClearFocus: handleClearFocus, title: 'Context Lens', showBadge: true, compact: true
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

    function PluginCardInner({ ctx: _ctx, t, page }) {
      ensureCss();
      const [expanded, setExpanded] = React.useState(!!page);
      const [draft, setDraft] = React.useState({
        compressionMode: 'balanced',
        astSkeletonMaxDepth: 3,
        tokenSavingsTracking: true,
        budgetLimit: 100000,
        budgetAlertPercent: 90,
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
          const s = _ctx.configForms || (_ctx.get && _ctx.get('configForms'));
          if (s && typeof s.get === 'function') {
            scopeRef.current = s.get(NS);
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
          } catch (_err) {
            console.warn('[dsh-context-lens] scope subscribe failed', _err && _err.message || _err);
          }
        }

        return () => {
          cancelled = true;
          if (typeof unsub === 'function') unsub();
        };
      }, [scope]);

      const [updateState, setUpdateState] = React.useState({
        checking: false,
        updating: false,
        currentVersion: '0.1.18',
        latestVersion: '',
        updateAvailable: false,
        canAutoUpdate: true,
        notice: '',
        error: ''
      });

      const checkUpdate = React.useCallback(async () => {
        setUpdateState((s) => ({ ...s, checking: true, error: '' }));
        try {
          const res = await fetch('/api/dsh-context-lens/update');
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const data = await res.json().catch(() => ({}));
          setUpdateState((s) => ({
            ...s,
            checking: false,
            currentVersion: data.currentVersion || s.currentVersion,
            latestVersion: data.latestVersion || '',
            updateAvailable: !!data.updateAvailable,
            canAutoUpdate: data.canAutoUpdate !== false,
          }));
        } catch (_) {
          setUpdateState((s) => ({ ...s, checking: false }));
        }
      }, []);

      React.useEffect(() => {
        if (expanded) checkUpdate();
      }, [expanded, checkUpdate]);

      async function handleTriggerUpdate() {
        if (updateState.updating) return;
        setUpdateState((s) => ({ ...s, updating: true, error: '', notice: '' }));
        try {
          const res = await fetch('/api/dsh-context-lens/update', {
            method: 'POST',
            headers: { 'x-dsh-plugin-update': '1', 'x-dsh-context-lens-update': '1' }
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.ok === false || data.error) {
            throw new Error(data.error || ('HTTP ' + res.status));
          }
          const newVer = data.updatedVersion || updateState.latestVersion || updateState.currentVersion;
          setUpdateState((s) => ({
            ...s,
            updating: false,
            updateAvailable: false,
            currentVersion: newVer,
            notice: tt('update.done', { version: newVer }),
          }));
        } catch (e) {
          setUpdateState((s) => ({
            ...s,
            updating: false,
            error: tt('update.failed', { error: e && e.message || String(e) }),
          }));
        }
      }

      React.useEffect(() => {
        if (!expanded) return;
        fetch('/dsh-context-lens/status').then((r) => r.ok ? r.json() : null).then((j) => {
          if (j && j.stats) {
            setStats(j.stats);
            setBudgetWarn(!!(j.stats.lowBudget && draft.autoCollapse !== false));
          }
        }).catch(() => {});
      }, [expanded, draft.autoCollapse]);

      const L = React.useMemo(() => getActiveLocale(_ctx), [_ctx]);
      const tt = React.useMemo(() => (t ? t : makeT(L, en)), [t, L]);

      let ChevronIcon = null;
      try {
        const prim = require('@deepseek-ai/dsh-client-ui-primitives');
        ChevronIcon = prim && prim.IconChevronDownOutline14;
      } catch (e) { ChevronIcon = null; }

      const Chevron = ChevronIcon ? function ChevronNode(p) {
        return React.createElement(ChevronIcon, { className: 'cl-chev' + (p.open ? ' cl-chev-open' : ''), style: { marginLeft: 'auto', color: 'var(--dsw-alias-label-tertiary)', transition: 'transform .16s ease', transform: p.open ? 'rotate(180deg)' : 'none' } });
      } : function Fallback(p) {
        return React.createElement('svg', {
          className: 'cl-chev' + (p.open ? ' cl-chev-open' : ''),
          viewBox: '0 0 14 14',
          width: 14,
          height: 14,
          style: {
            marginLeft: 'auto',
            color: 'var(--dsw-alias-label-tertiary)',
            transform: p.open ? 'rotate(180deg)' : 'none',
            transition: 'transform .16s ease',
            display: 'inline-block',
            flexShrink: 0
          }
        }, React.createElement('path', {
          d: 'M3.5 5.25L7 8.75L10.5 5.25',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }));
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

      return React.createElement(page ? 'div' : 'li', { className: page ? 'cl-page' : 'cl-section-card' },
        React.createElement('button', {
          type: 'button',
          className: 'cl-section-header',
          style: page ? { display: 'none' } : undefined,
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
          React.createElement('div', {
            style: {
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', marginBottom: 10, borderRadius: 8,
              background: 'var(--dsw-alias-bg-layer-2)', border: '1px solid var(--dsw-alias-border-l2)', fontSize: 12
            }
          },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement('span', { style: { fontWeight: 500, color: 'var(--dsw-alias-label-primary)' } },
                'v' + (updateState.currentVersion || '0.1.18')
              ),
              updateState.checking
                ? React.createElement('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11 } }, tt('update.checking'))
                : updateState.updateAvailable
                  ? React.createElement('span', { className: 'cl-badge cl-badge-warn' },
                      tt('update.available', { latestVersion: updateState.latestVersion, currentVersion: updateState.currentVersion })
                    )
                  : React.createElement('span', { className: 'cl-badge cl-badge-ok' },
                      '✓ ' + tt('update.up_to_date')
                    )
            ),
            updateState.updateAvailable
              ? React.createElement('button', {
                  type: 'button',
                  className: 'cl-btn cl-btn-primary',
                  disabled: updateState.updating,
                  onClick: handleTriggerUpdate,
                  style: { padding: '3px 8px', fontSize: 11 }
                }, updateState.updating ? tt('update.updating') : tt('update.btn'))
              : null
          ),
          updateState.notice ? React.createElement('div', { className: 'cl-banner-ok', style: { marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--dsw-alias-state-success-primary, #10b981) 8%, transparent)', border: '1px solid var(--dsw-alias-state-success-primary, #10b981)', color: 'var(--dsw-alias-state-success-primary, #10b981)', fontSize: 12 } }, '✓ ' + updateState.notice) : null,
          updateState.error ? React.createElement('div', { className: 'cl-banner-warn', style: { marginBottom: 10 } }, updateState.error) : null,
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
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('budgetAlertPercent')),
              React.createElement('input', {
                className: 'cl-input', type: 'number', min: 50, max: 99, step: 1,
                value: draft.budgetAlertPercent,
                onChange: (e) => setDraft((d) => ({ ...d, budgetAlertPercent: parseInt(e.target.value, 10) || 90 }))
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
      // Row seat (plugins.row.config): one-liner for the summary, the form without
      // our header/card chrome for the page (the host page draws those itself).
      if (props && props.view === 'summary') {
        return React.createElement('span', { className: 'cl-sub' },
          'Context lens: token savings, compaction and budget insights.');
      }
      const page = !!(props && props.view === 'page');
      return React.createElement(ErrorBoundary, null,
        React.createElement(PluginCardInner, Object.assign({}, props, { page }))
      );
    }

    module.exports.inject = ['slots', 'locale', 'configForms'];
    module.exports.apply = function apply(ctx) {
      let hasEffect = false;
      try {
        hasEffect = typeof ctx.effect === 'function';
      } catch (_) {
        hasEffect = false;
      }
      if (hasEffect) {
        ctx.effect(() => {
          try {
            const dispose = ctx.locale?.register ? ctx.locale.register(NS, { en, zh }) : undefined;
            return () => {
              if (typeof dispose === 'function') dispose();
            };
          } catch (e) {
            console.warn('[dsh-context-lens] locale register failed', e && e.message || e);
          }
        }, 'dsh-context-lens: locale');
      } else {
        try { ctx.locale.register(NS, { en, zh }); } catch (e) { console.warn('[dsh-context-lens] locale register failed', e && e.message || e); }
      }
      if (!ctx.slots) return;
      let registered = false;
      // Primary seat for the current core (0.1.6-alpha.2): the plugin-list seat
      // 'plugins.item', which is the one the Plugins page renders as the plugin's own
      // page with its configuration (the host draws the title, icon, crumb and
      // padding and asks for view 'summary' or view 'page'). The row seat and the
      // legacy settings.plugin.item seat below stay as fallbacks.
      if (typeof ctx.slots.inject === 'function') {
        try {
          ctx.slots.inject('plugins.item', () => ctx.slots.register({
            name: 'plugins.item',
            id: ROW_ID,
            order: 60,
            label: () => 'Context Lens',
            locale: NS,
            inject: () => ({ ctx })
          }, PluginCard));
          ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
            name: 'plugins.row.config',
            key: ROW_CONFIG_KEY,
            locale: NS,
            inject: () => ({ ctx })
          }, PluginCard));
        } catch (e) {
          console.error('[dsh-context-lens] plugins.item / plugins.row.config inject failed', e && e.stack || e);
        }
      }
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
                    console.warn("[dsh-context-lens] sidebar.right.pane.tab inject failed, falling back to direct register", e && e.message || e);
                    try {
                      registerPaneTab();
                    } catch (e2) {
                      console.warn("[dsh-context-lens] registerPaneTab direct register fallback failed", e2 && e2.message || e2);
                    }
                  }
                } else {
                  try {
                    registerPaneTab();
                  } catch (err) {
                    console.warn("[dsh-context-lens] registerPaneTab direct register failed", err && err.message || err);
                  }
                }
              }
            } catch (e) {
              console.warn("[dsh-context-lens] native sidebar registration failed", e && e.message || e);
            }
          });
        } catch (err) {
          console.warn("[dsh-context-lens] native sidebar inject failed", err && err.message || err);
        }
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
        } catch (err) {
          console.warn('[dsh-context-lens] betterSidebar inject failed', err && err.message || err);
        }
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
            console.warn('[dsh-context-lens] utilities inject failed, falling back to direct register', e && e.message || e);
            try {
              headerChipRegister();
            } catch (e2) {
              console.warn('[dsh-context-lens] headerChipRegister fallback failed', e2 && e2.message || e2);
            }
          }
        } else {
          try {
            headerChipRegister();
          } catch (err) {
            console.warn('[dsh-context-lens] headerChipRegister direct register failed', err && err.message || err);
          }
        }
      }
    };
    return module.exports;
  }
});
