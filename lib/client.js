window.__ModuleLoader__.load({
  id: '@goodandready-private/dsh-context-lens',
  factory: (require) => {
    var module = { exports: {} };
    const React = require('react');

    const NS = '@goodandready-private/dsh-context-lens';

    function PluginCard({ ctx }) {
      const [expanded, setExpanded] = React.useState(false);
      return React.createElement('div', { className: 'context-lens-card' },
        React.createElement('button', {
          className: 'context-lens-head',
          onClick: () => setExpanded(!expanded)
        },
          React.createElement('span', { className: 'context-lens-title' }, 'Context Lens & Token Guard')
        )
      );
    }

    module.exports.inject = ['slots'];
    module.exports.apply = function apply(ctx) {
      if (ctx.slots) {
        ctx.slots.register({
          name: 'settings.plugin.item',
          key: NS,
          locale: NS,
          inject: () => ({ ctx })
        }, PluginCard);
      }
    };

    return module.exports;
  }
});
