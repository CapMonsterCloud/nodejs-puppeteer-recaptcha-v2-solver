'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { sitekeyFromUrl, resolveApiKey, solveRecaptchaV2, injectToken, tokenPreview } = require('../src/recaptcha');

const ANCHOR = 'https://www.google.com/recaptcha/api2/anchor?ar=1&k=6Lcg7CMUAAAAANphynKgn9YAgA4tQ2KI_iqRyTwd&co=x&hl=en';

test('extracts sitekey from anchor and reload requests only', () => {
  assert.equal(sitekeyFromUrl(ANCHOR), '6Lcg7CMUAAAAANphynKgn9YAgA4tQ2KI_iqRyTwd');
  assert.equal(sitekeyFromUrl('https://www.google.com/recaptcha/api2/reload?k=abc'), 'abc');
  assert.equal(sitekeyFromUrl('https://www.gstatic.com/recaptcha/releases/x/recaptcha__en.js'), null);
  assert.equal(sitekeyFromUrl('not a url'), null);
});

test('requires CAPMONSTER_API_KEY', () => {
  assert.throws(() => resolveApiKey({}), /CAPMONSTER_API_KEY/);
  assert.equal(resolveApiKey({ CAPMONSTER_API_KEY: ' key ' }), 'key');
});

test('returns the token from the SDK result', async () => {
  const calls = [];
  const client = { Solve: async (task) => { calls.push(task); return { solution: { gRecaptchaResponse: 'TOKEN' } }; } };
  const token = await solveRecaptchaV2(client, { websiteURL: 'https://a.test', websiteKey: 'k', userAgent: 'UA' });
  assert.equal(token, 'TOKEN');
  assert.equal(calls[0].websiteKey, 'k');
  assert.equal(calls[0].websiteURL, 'https://a.test');
});

test('turns SDK error codes into exceptions', async () => {
  const client = { Solve: async () => ({ error: 'ZERO_BALANCE' }) };
  await assert.rejects(solveRecaptchaV2(client, { websiteURL: 'https://a.test', websiteKey: 'k' }), /ZERO_BALANCE/);
});

test('injectToken fills textarea and fires callback from ___grecaptcha_cfg', () => {
  const textarea = { value: '', innerHTML: '' };
  let received = null;
  const sandbox = {
    document: { querySelectorAll: () => [textarea] },
    window: {},
  };
  sandbox.window.___grecaptcha_cfg = { clients: { 0: { aa: { bb: { sitekey: 'k', callback: (t) => { received = t; } } } } } };
  vm.createContext(sandbox);
  const result = vm.runInContext(`(${injectToken.toString()})('TOKEN123')`, sandbox);
  assert.deepEqual({ ...result }, { textareas: 1, callbackFired: true });
  assert.equal(textarea.value, 'TOKEN123');
  assert.equal(received, 'TOKEN123');
});

test('injectToken resolves callback given as a global function name', () => {
  let received = null;
  const sandbox = { document: { querySelectorAll: () => [] }, window: {} };
  sandbox.window.onSolved = (t) => { received = t; };
  sandbox.window.___grecaptcha_cfg = { clients: { 0: { x: { callback: 'onSolved' } } } };
  vm.createContext(sandbox);
  vm.runInContext(`(${injectToken.toString()})('T')`, sandbox);
  assert.equal(received, 'T');
});

test('token preview hides long tokens', () => {
  assert.equal(tokenPreview('abc'), 'abc');
  assert.match(tokenPreview('x'.repeat(400)), /\(400 chars\)$/);
});

test('SDK rejects non-http page URLs before any API call', async () => {
  let called = false;
  const client = { Solve: async () => { called = true; return {}; } };
  await assert.rejects(solveRecaptchaV2(client, { websiteURL: 'about:blank', websiteKey: 'k' }), /valid http/);
  assert.equal(called, false);
});
