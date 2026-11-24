'use strict';

const { RecaptchaV2Request } = require('@zennolab_com/capmonstercloud-client');

const DEMO_URL = 'https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high';

/** Returns the sitekey (`k` parameter) if the URL is a reCAPTCHA anchor/reload request. */
function sitekeyFromUrl(url) {
  try {
    const u = new URL(url);
    if (!/\/recaptcha\/(api2|enterprise)\/(anchor|reload)/.test(u.pathname)) return null;
    return u.searchParams.get('k');
  } catch {
    return null;
  }
}

/** Reads CAPMONSTER_API_KEY or throws a readable error. */
function resolveApiKey(env = process.env) {
  const key = (env.CAPMONSTER_API_KEY || '').trim();
  if (!key) {
    throw new Error('CAPMONSTER_API_KEY is not set. Export it first: export CAPMONSTER_API_KEY=your_key');
  }
  return key;
}

/** Asks CapMonster Cloud for a token. The SDK reports API errors in `result.error` instead of throwing. */
async function solveRecaptchaV2(client, { websiteURL, websiteKey, userAgent }) {
  const result = await client.Solve(new RecaptchaV2Request({ websiteURL, websiteKey, userAgent }));
  if (result.error) {
    throw new Error(`CapMonster Cloud error: ${result.error}`);
  }
  const token = result.solution && result.solution.gRecaptchaResponse;
  if (!token) throw new Error('Empty solution returned');
  return token;
}

/**
 * Executed in the page via page.evaluate(injectToken, token).
 * Fills the response textarea(s) and calls the widget callback found in
 * window.___grecaptcha_cfg, which also covers widgets created with grecaptcha.render().
 */
function injectToken(token) {
  const areas = document.querySelectorAll('textarea[name="g-recaptcha-response"]');
  areas.forEach((el) => {
    el.value = token;
    el.innerHTML = token;
  });

  let callbackFired = false;
  const cfg = window.___grecaptcha_cfg;
  const seen = new Set();
  const stack = cfg && cfg.clients ? Object.values(cfg.clients).map((c) => [c, 0]) : [];
  while (stack.length && !callbackFired) {
    const [obj, depth] = stack.pop();
    if (!obj || typeof obj !== 'object' || seen.has(obj) || obj.nodeType || depth > 6) continue;
    seen.add(obj);
    const entries = Object.entries(obj);
    for (let i = 0; i < entries.length && !callbackFired; i += 1) {
      const [key, value] = entries[i];
      const fn = key === 'callback' && (typeof value === 'function' ? value : window[value]);
      if (typeof fn === 'function') {
        fn(token);
        callbackFired = true;
      } else if (key !== 'callback' && value && typeof value === 'object') {
        stack.push([value, depth + 1]);
      }
    }
  }
  return { textareas: areas.length, callbackFired };
}

function tokenPreview(token, size = 32) {
  return token.length <= size ? token : `${token.slice(0, size)}... (${token.length} chars)`;
}

module.exports = { DEMO_URL, sitekeyFromUrl, resolveApiKey, solveRecaptchaV2, injectToken, tokenPreview };
