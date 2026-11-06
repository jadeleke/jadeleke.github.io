// Complete static-site layout regression. Requires Playwright and Microsoft Edge.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
const pages = fs.readdirSync(root).filter(file => file.endsWith('.html'))
  .concat(['blog/index.html', 'blog/post.html', 'blog/admin.html'],
    fs.readdirSync(path.join(root, 'blog/posts')).filter(file => file.endsWith('.html')).map(file => 'blog/posts/' + file));
const server = http.createServer((request, response) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname)); }
  catch (_) { response.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  response.end(fs.readFileSync(file));
});

(async () => {
  let browser, checks = 0;
  const errors = [];
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce' });
    await context.route('https://**/*', route => route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme });
      for (const width of scheme === 'light' ? [320, 390, 768, 1440] : [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const file of pages) {
          await page.goto(`${base}/${file}`);
          await page.locator('main:visible').first().waitFor();
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${file}: horizontal overflow at ${width}px/${scheme}`);
          checks++;
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 1000 });
    for (const file of pages) {
      await page.goto(`${base}/${file}`);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${file}: enlarged text overflows at390px`);
      checks++;
    }
    assert.deepEqual(errors, [], 'Unexpected page exceptions');
    console.log(`PASS: ${checks} responsive, theme, and enlarged-text layouts across ${pages.length} pages; zero JavaScript page exceptions. External APIs blocked.`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
