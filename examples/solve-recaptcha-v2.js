'use strict';
// Usage:
//   export CAPMONSTER_API_KEY=your_key
//   node examples/solve-recaptcha-v2.js [pageUrl] [submitSelector]

const puppeteer = require('puppeteer');
const { CapMonsterCloudClientFactory, ClientOptions } = require('@zennolab_com/capmonstercloud-client');
const {
  DEMO_URL, sitekeyFromUrl, resolveApiKey, solveRecaptchaV2, injectToken, tokenPreview,
} = require('../src/recaptcha');

async function main() {
  const [url = DEMO_URL, submitSelector] = process.argv.slice(2);
  const client = CapMonsterCloudClientFactory.Create(new ClientOptions({ clientKey: resolveApiKey() }));

  const browser = await puppeteer.launch({ headless: process.env.HEADLESS !== 'false' });
  try {
    const page = await browser.newPage();

    // The widget always loads an "anchor" frame whose URL carries the sitekey.
    let sitekey = null;
    page.on('request', (req) => { sitekey = sitekey || sitekeyFromUrl(req.url()); });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
    if (!sitekey) {
      sitekey = await page.$eval('[data-sitekey]', (el) => el.getAttribute('data-sitekey')).catch(() => null);
    }
    if (!sitekey) throw new Error('reCAPTCHA sitekey not found on the page');
    console.log(`sitekey: ${sitekey}`);

    const started = Date.now();
    const token = await solveRecaptchaV2(client, {
      websiteURL: page.url(),
      websiteKey: sitekey,
      userAgent: await browser.userAgent(),
    });
    console.log(`solved in ${((Date.now() - started) / 1000).toFixed(1)}s: ${tokenPreview(token)}`);

    const result = await page.evaluate(injectToken, token);
    console.log(`injected into ${result.textareas} textarea(s), callback fired: ${result.callbackFired}`);

    if (submitSelector) {
      await Promise.all([page.waitForNavigation({ timeout: 30_000 }).catch(() => null), page.click(submitSelector)]);
      console.log(`submitted, now at ${page.url()}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
