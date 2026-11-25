# Puppeteer reCAPTCHA v2 Solver for Node.js (CapMonster Cloud)

[![tests](https://github.com/CapMonsterCloud/nodejs-puppeteer-recaptcha-v2-solver/actions/workflows/test.yml/badge.svg)](https://github.com/CapMonsterCloud/nodejs-puppeteer-recaptcha-v2-solver/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-supported-40B5A4?logo=puppeteer&logoColor=white)](https://pptr.dev/)

A small, runnable **Puppeteer reCAPTCHA v2 solver for Node.js**. It solves Google reCAPTCHA v2 inside a Puppeteer session with the official CapMonster Cloud SDK (`@zennolab_com/capmonstercloud-client`) and the [CapMonster Cloud reCAPTCHA v2 solver](https://capmonster.cloud/en/recaptcha-v2/?utm_source=github&utm_medium=repo-example&utm_campaign=nodejs-puppeteer-recaptcha-v2&utm_content=intro). Use it when your Node.js Puppeteer scripts meet reCAPTCHA on forms you test or automate.

## What this example does

1. Launches Chrome with Puppeteer and opens a page that has a reCAPTCHA v2 widget.
2. Captures the sitekey from the widget's network traffic, so you do not have to look it up in DevTools.
3. Requests a token from CapMonster Cloud with `RecaptchaV2Request`, using the browser's own User-Agent.
4. Writes the token into the page, calls the widget callback and can click your submit button.

Without arguments it uses the public demo page `lessons.zennolab.com`.

## Requirements

- Node.js 22.12 or newer (required by current Puppeteer)
- A CapMonster Cloud API key (see [Get an API key](#get-an-api-key))
- About 200 MB of disk space for the Chrome build that Puppeteer downloads on install

## Quick start

```bash
git clone https://github.com/CapMonsterCloud/nodejs-puppeteer-recaptcha-v2-solver.git
cd nodejs-puppeteer-recaptcha-v2-solver
npm install

export CAPMONSTER_API_KEY=your_key            # Windows PowerShell: $env:CAPMONSTER_API_KEY="your_key"
npm start                                     # demo page, headless
HEADLESS=false node examples/solve-recaptcha-v2.js https://your-site.example/form "button[type=submit]"
```

Run the tests (no browser, network or API key needed):

```bash
npm test
```

## How it works

- **Sitekey from the network, not the DOM.** `page.on('request')` watches for the `recaptcha/api2/anchor` request that every v2 widget makes and reads its `k` parameter (`sitekeyFromUrl`). This works for widgets created later by JavaScript and for widgets without a `data-sitekey` attribute. The DOM attribute is used only as a fallback.
- **Errors are values in the Node SDK.** `client.Solve()` resolves with `{ error }` for API errors such as a zero balance instead of throwing. `solveRecaptchaV2` turns that into a normal exception so your scraper fails loudly.
- **Callback discovery through `___grecaptcha_cfg`.** Sites that call `grecaptcha.render(el, { callback })` have no `data-callback` attribute. `injectToken` walks Google's internal client config, finds the registered callback (a function or a global function name) and calls it with the token. That is what actually unlocks most forms.
- **Testable page code.** `injectToken` is a plain function: Puppeteer serializes it into the page, and the tests run the same function in a Node `vm` sandbox.

## reCAPTCHA v2 token basics

- The token is a `g-recaptcha-response` string. Write it into the hidden textarea or pass it to the widget callback.
- reCAPTCHA v2 tokens are single-use and short-lived. Request a new token for every submission and submit right away.
- Pass the same page URL and sitekey that the browser used, otherwise the token can be rejected on validation.

## Common errors

| Symptom | Cause and fix |
|---|---|
| `Could not find Chrome (ver. ...)` | Chrome was not downloaded, for example after `PUPPETEER_SKIP_DOWNLOAD=1`. Run `npx puppeteer browsers install chrome`. |
| `npm warn EBADENGINE` or syntax errors on start | Node.js is too old. Install Node 22.12+. |
| `websiteURL must be a valid http or https URL` | The SDK validates the URL before calling the API. You passed `about:blank` or a page that redirected to a `chrome-error://` page. Check that navigation succeeded. |
| `CapMonster Cloud error: KEY_DOES_NOT_EXIST` / `ZERO_BALANCE` | Wrong API key or empty balance. |
| `reCAPTCHA sitekey not found on the page` | The widget appears only after an action, or the page uses reCAPTCHA v3/Enterprise. Trigger the widget first or use the matching request class. |
| Site responds `invalid-input-response` | The token expired (about 2 minutes) or was used twice. Submit immediately after injection. |

## Get an API key

This example needs a CapMonster Cloud account and API key. Register and get the key on the [reCAPTCHA v2 solver page](https://capmonster.cloud/en/recaptcha-v2/?utm_source=github&utm_medium=repo-example&utm_campaign=nodejs-puppeteer-recaptcha-v2&utm_content=cta). There you will also find pricing and the API description.

## Responsible use

Run this example only against websites you own or are permitted to automate, such as QA of your own forms. Respect each website's terms of service and the law. Do not commit your API key.

## Links

- Node.js SDK: [CapMonster Cloud Node.js SDK](https://github.com/CapMonsterCloud/capmonster-nodejs-captcha-solver)
- reCAPTCHA v2 solving with CapMonster Cloud: [capmonster.cloud/en/recaptcha-v2](https://capmonster.cloud/en/recaptcha-v2/?utm_source=github&utm_medium=repo-example&utm_campaign=nodejs-puppeteer-recaptcha-v2&utm_content=links)

reCAPTCHA is a trademark of Google LLC. CapMonster Cloud is not affiliated with or endorsed by Google.
