✅ CapMonster.Cloud — Fast, Reliable CAPTCHA Solving for Automation & Scraping

[![CapMonster Cloud](https://help.zennolab.com/upload/u/02/020538b7c128.png)](https://capmonster.cloud/en/?utm_source=github-dw&utm_campaign=nodejs-puppeteer-recaptcha-v2)

If you are tired of wasting time solving endless CAPTCHAs during scraping, automation, or testing — we’ve got a solution for you.  
Meet CapMonster.Cloud — the AI-powered CAPTCHA solving service trusted by thousands of users worldwide. 🚀

--

🔥 **Why users love CapMonster.Cloud**
  
💡 Very high success rates (up to 99%)  
⚡ Super fast solving times  
💲 Affordable transparent pricing (pay per 1,000 CAPTCHAs)  
🔌 Easy integration via API + browser extensions  
⭐ Excellent reviews on TrustPilot, SourceForge, SaaSHub, AlternativeTo

--

🔗 **Useful Links**

💲 [Pricing & Supported CAPTCHA Types (25+ types supported)](https://capmonster.cloud/en?utm_source=github-dw&utm_campaign=nodejs-puppeteer-recaptcha-v2#new-plans)  
📘 [API Documentation](https://docs.capmonster.cloud/?utm_source=github-dw&utm_campaign=nodejs-puppeteer-recaptcha-v2)  
💡 Main Website → [capmonster.cloud](https://capmonster.cloud/en/?utm_source=github-dw&utm_campaign=nodejs-puppeteer-recaptcha-v2)  
⭐ Reviews → [TrustPilot](https://www.trustpilot.com/review/capmonster.cloud)

---

# Puppeteer reCAPTCHA Solver for Node.js (reCAPTCHA v2) with CapMonster Cloud

A small, runnable **Puppeteer reCAPTCHA solver** for **Node.js**: it solves Google reCAPTCHA v2 inside a Puppeteer session with the official CapMonster Cloud SDK (`@zennolab_com/capmonstercloud-client`). Use it when your Node.js Puppeteer scripts meet reCAPTCHA on forms you test or automate.

## What this example does

1. Launches Chrome with Puppeteer and opens a page that has a reCAPTCHA v2 widget.
2. Captures the sitekey from the widget's network traffic, so you do not have to look it up in DevTools.
3. Requests a token from CapMonster Cloud with `RecaptchaV2Request`, using the browser's own User-Agent.
4. Writes the token into the page, calls the widget callback and can click your submit button.

Without arguments it uses the public demo page `lessons.zennolab.com`.

## Requirements

- Node.js 22.12 or newer (required by current Puppeteer)
- A CapMonster Cloud API key
- About 200 MB of disk space for the Chrome build that Puppeteer downloads on install

## Quick start

```bash
git clone https://github.com/CapMonsterCloud/nodejs-puppeteer-recaptcha-v2-capmonster.git
cd nodejs-puppeteer-recaptcha-v2-capmonster
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

## Common errors

| Symptom | Cause and fix |
|---|---|
| `Could not find Chrome (ver. ...)` | Chrome was not downloaded, for example after `PUPPETEER_SKIP_DOWNLOAD=1`. Run `npx puppeteer browsers install chrome`. |
| `npm warn EBADENGINE` or syntax errors on start | Node.js is too old. Install Node 22.12+. |
| `websiteURL must be a valid http or https URL` | The SDK validates the URL before calling the API. You passed `about:blank` or a page that redirected to a `chrome-error://` page. Check that navigation succeeded. |
| `CapMonster Cloud error: KEY_DOES_NOT_EXIST` / `ZERO_BALANCE` | Wrong API key or empty balance. |
| `reCAPTCHA sitekey not found on the page` | The widget appears only after an action, or the page uses reCAPTCHA v3/Enterprise. Trigger the widget first or use the matching request class. |
| Site responds `invalid-input-response` | The token expired (about 2 minutes) or was used twice. Submit immediately after injection. |

## Responsible use

Run this example only against websites you own or are permitted to automate, such as QA of your own forms. Respect each website's terms of service and the law. Do not commit your API key.

## Links

- Node.js SDK: [CapMonster Cloud Node.js SDK](https://github.com/CapMonsterCloud/capmonster-nodejs-captcha-solver)
- reCAPTCHA v2 solving with CapMonster Cloud: [capmonster.cloud/en/recaptcha-v2](https://capmonster.cloud/en/recaptcha-v2/?utm_source=github&utm_medium=repo-example&utm_campaign=nodejs-puppeteer-recaptcha-v2)
