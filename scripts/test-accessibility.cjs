// Browser regression checks for navigation, user preferences, and text reflow.
// Requires Playwright and an installed Edge browser. Run: node scripts/test-accessibility.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

async function run() {
  const server = http.createServer((request, response) => {
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname)); }
    catch (_) { response.writeHead(400).end(); return; }
    if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  let checks = 0;
  const errors = [];
  function check(value, message) { assert.ok(value, message); checks++; }
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', colorScheme: 'light', reducedMotion: 'no-preference' });
    await context.route('https://**/*', route => route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/index.html');

    // A disclosure must be keyboard-operable in both directions, with no focus
    // escaping into the page while scrolling is locked by the open mobile menu.
    const toggle = page.locator('.menu-toggle');
    await toggle.focus();
    await page.keyboard.press('Enter');
    check(await toggle.getAttribute('aria-expanded') === 'true', 'Menu opens from the keyboard');
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press(key);
        check(await page.evaluate(() => {
          const active = document.activeElement;
          return document.querySelector('.site-header').contains(active);
        }), `Open menu contains focus after ${key} ${i + 1}`);
      }
    }
    await page.keyboard.press('Escape');
    check(await toggle.getAttribute('aria-expanded') === 'false', 'Escape closes the menu');
    check(await toggle.evaluate(node => node === document.activeElement), 'Escape restores focus to the toggle');

    // A system-derived choice tracks the OS live, while a deliberate choice
    // remains stable when the OS changes and across page reloads.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', undefined, { timeout: 5000 });
    check(await page.locator('html').getAttribute('data-theme') === 'dark', 'Theme follows the system before an explicit choice');
    check(await page.locator('#theme-toggle').getAttribute('aria-label') === 'Switch to light theme', 'Theme control describes the current automatic appearance');
    await page.locator('#theme-toggle').click();
    check(await page.locator('html').getAttribute('data-theme') === 'light', 'Theme can be explicitly selected');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.emulateMedia({ colorScheme: 'dark' });
    check(await page.locator('html').getAttribute('data-theme') === 'light', 'System changes preserve an explicit choice');
    await page.reload();
    check(await page.locator('html').getAttribute('data-theme') === 'light', 'Explicit theme survives reload');

    const second = await context.newPage();
    await second.goto(base + '/research.html');
    await page.locator('#theme-toggle').click();
    await second.waitForFunction(() => document.documentElement.dataset.theme === 'dark', undefined, { timeout: 5000 });
    check(await second.locator('#theme-toggle').getAttribute('aria-label') === 'Switch to light theme', 'Theme changes synchronise across open pages');
    await second.close();

    await page.locator('#motion-toggle').click();
    check(await page.locator('html').getAttribute('data-motion') === 'paused', 'Motion can be paused');
    await page.reload();
    check(await page.locator('html').getAttribute('data-motion') === 'paused', 'Motion preference survives reload');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.getElementById('motion-toggle').disabled, undefined, { timeout: 5000 });
    check(await page.locator('#motion-toggle').isDisabled(), 'System reduced motion cannot be overridden accidentally');
    check(await page.locator('html').getAttribute('data-motion') === 'paused', 'System reduced motion keeps animation paused');

    // Resizing text, rather than just shrinking the viewport, catches fixed
    // minimum headline widths and header collisions that normal checks miss.
    for (const file of ['index.html', 'research.html', 'contact.html']) {
      await page.goto(base + '/' + file);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${file}: 200% text reflows at 390px`);
    }

    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 }, serviceWorkers: 'block' });
    await noJS.route('https://**/*', route => route.abort());
    const plain = await noJS.newPage();
    for (const file of ['index.html', 'research.html', 'projects.html', 'blog/index.html']) {
      await plain.goto(base + '/' + file);
      check(await plain.locator('#primary-menu a').first().isVisible(), `${file}: navigation works without JavaScript`);
      check(await plain.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${file}: no-JS mobile layout fits`);
      check((await plain.locator('main').innerText()).trim().length > 100, `${file}: content is readable without JavaScript`);
    }
    // A successfully loaded theme script must not hide navigation if the main
    // interaction script fails to download or execute.
    const partial = await browser.newContext({ viewport: { width: 320, height: 844 }, serviceWorkers: 'block' });
    await partial.route('https://**/*', route => route.abort());
    await partial.route(/\/js\/main\.js(?:\?.*)?$/, route => route.abort());
    const fallback = await partial.newPage();
    await fallback.goto(base + '/index.html');
    check(await fallback.locator('#primary-menu a').first().isVisible(), 'Navigation survives a failed interaction-script download');
    check(await fallback.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Partial-script fallback fits at 320px');
    check(errors.length === 0, 'No JavaScript page errors: ' + errors.join('; '));
    console.log(`PASS: ${checks} accessibility/preference/reflow checks. External APIs blocked; local HTTP; Edge.`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
