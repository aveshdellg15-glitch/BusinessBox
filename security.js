'use strict';
// CSP-safe event dispatch: a fixed function allowlist, no eval or Function().
window.BizStacksActions = Object.create(null);
for (const type of ['click', 'change', 'input', 'submit']) {
  document.addEventListener(type, event => {
    const element = event.target.closest('[data-on' + type + ']');
    if (!element || element.disabled) return;
    if (type === 'submit') event.preventDefault();
    const source = element.getAttribute('data-on' + type);
    const match = /^([A-Za-z][A-Za-z0-9]*)\((.*)\)$/.exec(source);
    if (!match || !Object.hasOwn(window.BizStacksActions, match[1])) return;
    const args = match[2] === '' ? [] : match[2].split(',').map(token => {
      token = token.trim();
      if (/^'[^'<>]*'$/.test(token)) return token.slice(1, -1);
      if (/^-?\d+$/.test(token)) return Number(token);
      if (token === 'null') return null;
      if (token === 'this.value') return element.value;
      if (token === 'this.checked') return element.checked;
      throw new Error('Invalid action argument');
    });
    Promise.resolve(window.BizStacksActions[match[1]](...args)).catch(() => {
      const message = document.getElementById('pageMessage') || document.getElementById('message');
      if (message) message.textContent = 'That action could not finish. Please try again.';
    });
  });
}

// Optional Turnstile: the public site key goes in site-settings.js.
// Supabase must ALSO verify the secret server-side; the widget alone is not protection.
window.BizStacksCaptcha = (() => {
  let widget = null, token = '', generation = 0, ready;
  function library() {
    if (window.turnstile) return Promise.resolve();
    if (!ready) ready = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.onload = resolve; script.onerror = () => { ready = null; script.remove(); reject(Error('Security check unavailable.')); };
      document.head.append(script);
    });
    return ready;
  }
  return {
    async mount(containerId) {
      const current = ++generation;
      token = '';
      if (widget !== null && window.turnstile) window.turnstile.remove(widget);
      widget = null;
      const key = window.BIZSTACKS_SITE?.turnstileSiteKey;
      if (!key) return;
      const container = document.getElementById(containerId);
      if (!container) return;
      try {
        await library();
        if (generation !== current || !container.isConnected) return;
        widget = window.turnstile.render(container, {
          sitekey: key, theme: 'dark',
          callback: value => { token = value; },
          'expired-callback': () => { token = ''; },
          'error-callback': () => { token = ''; }
        });
      } catch { container.textContent = 'Security check unavailable. Refresh and try again.'; }
    },
    getToken() {
      if (window.BIZSTACKS_SITE?.turnstileSiteKey && !token) throw Error('Complete the security check first.');
      return token || undefined;
    },
    reset() { token = ''; if (widget !== null && window.turnstile) window.turnstile.reset(widget); }
  };
})();
