window.__ModuleLoader__.load({
  id: '@goodandready/dsh-context-lens',
  factory: (require) => {
    var module = { exports: {} };
    const React = require('react');
    // The settings namespace is the profile entry id from cordis.patch.yml, not
    // the package name. DSH keys a served form by entry id, so a package-name
    // namespace resolves to nothing. Must stay in step with NS in lib/index.js.
    const NS = 'dsh-context-lens';
    const PKG = '@goodandready/dsh-context-lens';
    const ROW_ID = 'dsh-context-lens';
    const ROW_CONFIG_KEY = PKG + '#' + ROW_ID;

    const en = {
      title: 'Context Lens',
      sub: 'AST code skeletons and test log compression',
      mode: 'Compression mode',
      depth: 'AST max depth',
      threshold: 'Auto-compress threshold (chars)',
      preview: 'Log preview',
      compress: 'Compress',
      placeholder: 'Paste test or build log here…',
      saving: 'Saving…',
      ready: 'Ready',
      previewApprox: 'Local preview'
    };

    const zh = {
      title: '上下文透镜',
      sub: 'AST 代码骨架生成与测试日志压缩',
      mode: '压缩模式',
      depth: 'AST 最大深度',
      threshold: '自动压缩阈值 (字符)',
      preview: '日志预览',
      compress: '压缩',
      placeholder: '在此粘贴测试或构建日志…',
      saving: '保存中…',
      ready: '就绪',
      previewApprox: '本地预览'
    };

    function getActiveLocale(ctx) {
      try {
        if (ctx && ctx.locale && typeof ctx.locale.getSnapshot === 'function') {
          const snap = ctx.locale.getSnapshot();
          if (snap && snap.active && snap.active.startsWith('zh')) return 'zh';
        }
      } catch (err) {
        console.warn('[dsh-context-lens] getActiveLocale failed', err && err.message || err);
      }
      return 'en';
    }

    function makeT(locale, fallbackDict) {
      const dict = locale === 'zh' ? zh : fallbackDict;
      return (key, params) => {
        let str = dict[key] || fallbackDict[key] || key;
        if (params && typeof params === 'object') {
          for (const k of Object.keys(params)) {
            str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k]));
          }
        }
        return str;
      };
    }

    const ANSI_RE = /\u001b\[[0-9;]*[a-zA-Z]/g;
    const KEEP_RE = /(FAIL|FAILED|Error|AssertionError|Exception|Traceback|panic|npm ERR!|ERR!|Expected|Received|missing|×|●|✕|FAIL:|--- FAIL|not ok|at\s+.*:\d+:\d+|stack|Caused by|test result:\s*FAILED|running \d+ test|test .* \.\.\. FAILED|BUILD FAILED|Tests run:|FAILURE:|cargo:.*error|error\[E\d+\]|thread '.*' panicked)/i;
    const PASS_RE = /^(PASS|\s*✓|\s*✔|\s*ok\s|…+\s*$|\s*\.\s*$|test result:\s*ok|running \d+ test.*ok)/i;
    const NOISE_RE = /^\s*(npm (notice|warn|info)|Browserslist|cached|Downloading|Done in|Compiling\s|cargo:.*Finished)/i;
    const STACK_RE = /^\s*(at\s+|File ".*", line \d+|#\d+\s+0x|goroutine \d+ \[|thread '.*' panicked|note: run with)/;
    const SUMMARY_RE = /(tests?\s+(passed|failed|run)|test result:|suites?\s+\d+|\d+\s+passed|BUILD (SUCCESS|FAILED)|===.*passed.*===|passed in \d+|built in|modules transformed|Finished.*release|Finished.*dev)/i;

    function cleanAnsi(str) {
      if (!str || !str.includes('\u001b')) return str || '';
      return str.replace(ANSI_RE, '');
    }

    function compressLogClient(text, { mode = 'balanced', maxLines = 200 } = {}) {
      if (!text || typeof text !== 'string') return '';
      const lines = text.split(/\r?\n/);
      if (mode === 'raw') {
        const filtered = lines.filter((l) => {
          const clean = cleanAnsi(l);
          if (KEEP_RE.test(clean) || STACK_RE.test(clean)) return true;
          if (NOISE_RE.test(clean)) return false;
          return true;
        });
        const truncated = filtered.length > maxLines
          ? [...filtered.slice(0, maxLines - 1), `… truncated ${filtered.length - maxLines + 1} lines`]
          : filtered;
        return truncated.join('\n');
      }

      const keep = new Array(lines.length).fill(false);
      const cleanLines = new Array(lines.length);
      const context = mode === 'aggressive' ? 1 : 2;
      let hasFailure = false;

      for (let i = 0; i < lines.length; i++) {
        const clean = cleanAnsi(lines[i]);
        cleanLines[i] = clean;
        if (KEEP_RE.test(clean) || STACK_RE.test(clean)) {
          hasFailure = true;
          const s = Math.max(0, i - context);
          const e = Math.min(lines.length - 1, i + context);
          for (let j = s; j <= e; j++) keep[j] = true;
        }
      }

      if (!hasFailure) {
        const head = Math.min(3, lines.length);
        for (let i = 0; i < head; i++) keep[i] = true;
        for (let i = head; i < lines.length; i++) {
          if (SUMMARY_RE.test(cleanLines[i])) keep[i] = true;
        }
        if (lines.length > 0) keep[lines.length - 1] = true;
      }

      let out = [];
      for (let i = 0; i < lines.length; i++) {
        if (keep[i]) {
          const l = lines[i];
          const clean = cleanLines[i];
          if (mode === 'aggressive' && (PASS_RE.test(clean) || NOISE_RE.test(clean)) && !KEEP_RE.test(clean) && !SUMMARY_RE.test(clean)) {
            continue;
          }
          out.push(l);
        }
      }

      if (out.length > maxLines) {
        const half = Math.floor((maxLines - 1) / 2);
        out = [
          ...out.slice(0, half),
          `… truncated ${out.length - maxLines + 1} lines …`,
          ...out.slice(out.length - half)
        ];
      }

      return out.join('\n');
    }

    function ensureCss() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('dsh-context-lens-css')) return;
      const el = document.createElement('style');
      el.id = 'dsh-context-lens-css';
      el.dataset.dshPlugin = NS;
      el.textContent = `
        .cl-card {
          font-family: inherit;
          color: var(--dsw-alias-label-primary, inherit);
        }
        .cl-section-card {
          margin-bottom: 12px;
          border: 1px solid var(--dsw-alias-border-l1, var(--dsw-alias-border-primary, var(--dsw-alias-border-l2)));
          border-radius: 12px;
          background: var(--dsw-alias-bg-layer-1, var(--dsw-alias-bg-layer-3));
          overflow: hidden;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .cl-page {
          border: none;
          background: transparent;
        }
        .cl-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          cursor: pointer;
          user-select: none;
        }
        .cl-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--dsw-alias-label-primary, inherit);
        }
        .cl-sub {
          font-size: 12px;
          color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-tertiary));
          margin-top: 2px;
        }
        .cl-body {
          padding: 0 16px 16px;
        }
        .cl-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px 0;
        }
        .cl-input {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--dsw-alias-border-l2);
          background: var(--dsw-alias-bg-layer-2);
          color: var(--dsw-alias-label-primary, inherit);
          font-size: 13px;
        }
        .cl-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background .15s ease;
        }
        .cl-btn-primary {
          background: var(--dsw-alias-btn-primary-bg, var(--dsw-alias-accent-primary));
          color: var(--dsw-alias-btn-primary-color, var(--dsw-alias-text-contrast));
        }
        .cl-btn-primary:hover {
          filter: brightness(0.95);
        }
        .cl-btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cl-error-box {
          padding: 12px;
          border-radius: 8px;
          background: var(--dsw-alias-state-error-bg);
          color: var(--dsw-alias-state-error-primary);
        }
        .cl-chev {
          transition: transform .16s ease;
        }
        .cl-chev-open {
          transform: rotate(180deg);
        }
      `;
      document.head.appendChild(el);
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

    function PluginCardInner({ ctx: _ctx, t, page }) {
      ensureCss();
      const [expanded, setExpanded] = React.useState(!!page);
      const [draft, setDraft] = React.useState({
        compressionMode: 'balanced',
        astSkeletonMaxDepth: 3,
        autoCompressThreshold: 4000
      });
      const [status, setStatus] = React.useState('loading');
      const [saving, setSaving] = React.useState(false);
      const [saveErr, setSaveErr] = React.useState('');
      const [previewIn, setPreviewIn] = React.useState(
        'FAIL  src/app.test.js\n  ● should handle\n    Expected 1 got 2\n    at Object.<anonymous> (src/app.test.js:10:5)\nPASS  src/ok.test.js\n'
      );
      const [previewOut, setPreviewOut] = React.useState('');

      const scopeRef = React.useRef(null);
      if (!scopeRef.current && _ctx) {
        try {
          const s = _ctx.configForms || (_ctx.get && _ctx.get('configForms'));
          if (s && typeof s.get === 'function') {
            scopeRef.current = s.get(NS);
          }
        } catch (e) {
          console.warn('[dsh-context-lens] configForms get failed', e && e.message || e);
          scopeRef.current = null;
        }
      }
      const scope = scopeRef.current;

      React.useEffect(() => {
        if (!scope) {
          setStatus('unavailable');
          return;
        }
        let cancelled = false;

        const loadSnap = async () => {
          try {
            // ConfigForm is getSnapshot() in both 0.1.7-rc.2 and 0.2.0. The old
            // scope.get() fallback never matched anything, so it was a dead branch
            // that made an unavailable form look like a pending one.
            const snap = typeof scope.getSnapshot === 'function' ? scope.getSnapshot() : null;
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
            console.warn('[dsh-context-lens] loadSnap failed', e && e.message || e);
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

      const L = React.useMemo(() => getActiveLocale(_ctx), [_ctx]);
      const tt = React.useMemo(() => (t ? t : makeT(L, en)), [t, L]);

      let ChevronIcon = null;
      try {
        const prim = require('@deepseek-ai/dsh-client-ui-primitives');
        ChevronIcon = prim && prim.IconChevronDownOutline14;
      } catch (e) {
        ChevronIcon = null;
      }

      const Chevron = ChevronIcon ? function ChevronNode(p) {
        return React.createElement(ChevronIcon, {
          className: 'cl-chev' + (p.open ? ' cl-chev-open' : ''),
          style: {
            marginLeft: 'auto',
            color: 'var(--dsw-alias-label-tertiary)',
            transition: 'transform .16s ease',
            transform: p.open ? 'rotate(180deg)' : 'none'
          }
        });
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
        },
          React.createElement('path', {
            d: 'M3.5 5.25L7 8.75L10.5 5.25',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          })
        );
      };

      const handlePreview = () => {
        const out = compressLogClient(previewIn, { mode: draft.compressionMode || 'balanced' });
        setPreviewOut(out);
      };

      const handleSave = async () => {
        if (saving || !scope) return;
        setSaving(true);
        setSaveErr('');
        try {
          if (typeof scope.update === 'function') {
            await scope.update(draft);
          } else if (typeof scope.set === 'function') {
            await scope.set(NS, draft);
          }
        } catch (e) {
          console.error('[dsh-context-lens] save failed', e);
          setSaveErr(e && e.message ? e.message : String(e));
        } finally {
          setSaving(false);
        }
      };

      return React.createElement(
        page ? 'div' : 'li',
        { className: page ? 'cl-page' : 'cl-section-card' },
        React.createElement(
          'div',
          {
            className: 'cl-header',
            style: page ? { display: 'none' } : undefined,
            onClick: () => setExpanded((v) => !v)
          },
          React.createElement('div', null,
            React.createElement('div', { className: 'cl-title' }, tt('title')),
            React.createElement('div', { className: 'cl-sub' }, tt('sub'))
          ),
          React.createElement(Chevron, { open: expanded })
        ),
        (expanded || page) ? React.createElement(
          'div',
          { className: 'cl-body' },
          status === 'loading' ? React.createElement('div', { style: { padding: 12, color: 'var(--dsw-alias-label-secondary)' } }, 'Loading…') :
          status === 'unavailable' ? React.createElement('div', { style: { padding: 12, color: 'var(--dsw-alias-label-secondary)' } }, 'Settings unavailable — plugin not registered on host yet') :
          React.createElement(React.Fragment, null,
            React.createElement('div', { className: 'cl-field' },
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
            React.createElement('div', { className: 'cl-field' },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('depth')),
              React.createElement('input', {
                className: 'cl-input',
                type: 'number',
                min: 1,
                max: 10,
                value: draft.astSkeletonMaxDepth,
                onChange: (e) => setDraft((d) => ({ ...d, astSkeletonMaxDepth: parseInt(e.target.value, 10) || 3 }))
              })
            ),
            React.createElement('div', { className: 'cl-field' },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('threshold')),
              React.createElement('input', {
                className: 'cl-input',
                type: 'number',
                min: 0,
                step: 500,
                value: draft.autoCompressThreshold,
                onChange: (e) => setDraft((d) => ({ ...d, autoCompressThreshold: parseInt(e.target.value, 10) || 0 }))
              })
            ),
            React.createElement('div', { className: 'cl-field' },
              React.createElement('label', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, tt('preview') + ' (' + tt('previewApprox') + ')'),
              React.createElement('textarea', {
                value: previewIn,
                onChange: (e) => setPreviewIn(e.target.value),
                placeholder: tt('placeholder'),
                rows: 4,
                style: {
                  border: '1px solid var(--dsw-alias-border-l2)',
                  background: 'var(--dsw-alias-bg-layer-2)',
                  color: 'var(--dsw-alias-label-primary)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  fontFamily: 'monospace'
                }
              }),
              React.createElement('button', {
                type: 'button',
                className: 'cl-btn cl-btn-primary',
                onClick: handlePreview,
                style: { alignSelf: 'flex-start', marginTop: 4 }
              }, tt('compress')),
              previewOut ? React.createElement('pre', {
                style: {
                  whiteSpace: 'pre-wrap',
                  fontSize: 12,
                  background: 'var(--dsw-alias-bg-layer-2)',
                  padding: 10,
                  borderRadius: 8,
                  maxHeight: 180,
                  overflow: 'auto',
                  border: '1px solid var(--dsw-alias-border-l2)',
                  marginTop: 6
                }
              }, previewOut) : null
            ),
            saveErr ? React.createElement('div', {
              style: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 12, padding: '4px 0' }
            }, saveErr) : null,
            React.createElement('div', {
              style: {
                borderTop: '1px solid var(--dsw-alias-border-l2)',
                display: 'flex',
                justifyContent: 'flex-end',
                paddingTop: 12,
                marginTop: 8
              }
            },
              React.createElement('button', {
                type: 'button',
                className: 'cl-btn cl-btn-primary' + (saving ? ' cl-btn-disabled' : ''),
                onClick: handleSave,
                disabled: saving
              }, saving ? tt('saving') : tt('ready'))
            )
          )
        ) : null
      );
    }

    function PluginCard(props) {
      if (props && props.view === 'summary') {
        return React.createElement('span', { className: 'cl-sub' },
          'Context lens: AST code skeletons and test log compression.');
      }
      const page = !!(props && props.view === 'page');
      return React.createElement(ErrorBoundary, null,
        React.createElement(PluginCardInner, Object.assign({}, props, { page }))
      );
    }

    module.exports.inject = ['slots', 'locale', 'configForms'];

    module.exports.apply = function apply(ctx) {
      ensureCss();

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
        try {
          ctx.locale?.register?.(NS, { en, zh });
        } catch (e) {
          console.warn('[dsh-context-lens] locale register failed', e && e.message || e);
        }
      }

      if (!ctx.slots) return;

      // Only the two live seats. settings.plugin.item was retired before DSH
      // 0.1.7-rc.2 — one occurrence in the whole 0.1.7-rc.2 tree against 54 of
      // plugins.item — so the inject/doRegister/fallback dance it was wrapped in
      // only registered PluginCard a second time on a seat that no longer exists,
      // and its rethrow could take the whole client batch down with it.
      // Only the two live seats.
      // DSH 0.2.0-rc.2+: plugins.item is a list slot requiring options.id;
      // plugins.row.config is a keyed slot requiring options.key.
      // We pass both id and key for plugins.item to maintain dual compatibility.
      // doRegister traps any registration errors so deferred inject never throws unhandled.
      for (const seat of [
        { name: 'plugins.item', id: PKG, key: PKG },
        { name: 'plugins.row.config', key: ROW_CONFIG_KEY },
      ]) {
        const doRegister = () => {
          try {
            return ctx.slots.register({
              name: seat.name,
              ...(seat.id ? { id: seat.id } : {}),
              key: seat.key,
              title: () => en.title
            }, PluginCard);
          } catch (e) {
            // One seat failing must not stop the other from rendering the card.
            console.warn('[dsh-context-lens] ' + seat.name + ' registration failed', e && e.message || e);
          }
        };
        try {
          if (typeof ctx.slots.inject === 'function') {
            ctx.slots.inject(seat.name, () => {
              try {
                doRegister();
              } catch (e) {
                console.warn('[dsh-context-lens] ' + seat.name + ' inject callback failed', e && e.message || e);
              }
            });
          } else {
            doRegister();
          }
        } catch (e) {
          console.warn('[dsh-context-lens] ' + seat.name + ' registration failed', e && e.message || e);
        }
      }
    }

    return module.exports;
  }
});