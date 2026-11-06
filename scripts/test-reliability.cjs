/* Run with a locally available Playwright installation and Edge:
 * node scripts/test-reliability.cjs
 * No external API, account, or publishing operation is used.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const selections = JSON.parse(fs.readFileSync(path.join(root, 'data/featured.json'), 'utf8'));
const overrides = new Map();
const assetVersion = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').match(/const ASSET_VERSION = '([^']+)'/)[1];
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf' };
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const fixture = overrides.get(pathname);
  if (fixture) {
    const send = () => {
      response.writeHead(fixture.status || 200, { 'Content-Type': fixture.type || 'application/json' });
      response.end(typeof fixture.body === 'string' ? fixture.body : JSON.stringify(fixture.body));
    };
    if (fixture.delay) setTimeout(send, fixture.delay);
    else send();
    return;
  }
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403); response.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  response.end(fs.readFileSync(file));
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    let live = false;
    let paginate = false;
    let liveDelay = 0;
    const liveRepositories = Array.from({ length: 14 }, (_, index) => ({
      name: `repository-${index}`, description: `Test repository ${index}`, html_url: `https://github.com/example/repository-${index}`,
      language: 'Python', stargazers_count: 14 - index, topics: ['testing'], updated_at: '2026-01-01T00:00:00Z'
    }));
    const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce', viewport: { width: 390, height: 900 } });
    await context.route('https://**/*', route => {
      if (live && new URL(route.request().url()).hostname === 'api.github.com') {
        const respond = () => {
          if (!paginate) return route.fulfill({ json: liveRepositories });
          const pageNumber = Number(new URL(route.request().url()).searchParams.get('page') || 1);
          const rows = Array.from({ length: pageNumber === 1 ? 100 : 3 }, (_, index) => ({ name: `many-${(pageNumber - 1) * 100 + index}`, html_url: `https://github.com/example/many-${(pageNumber - 1) * 100 + index}`, language: 'Python' }));
          return route.fulfill({ json: rows, headers: pageNumber === 1 ? { Link: '<https://api.github.com/users/jadeleke/repos?per_page=100&page=2>; rel="next"', 'Access-Control-Expose-Headers': 'Link' } : {} });
        };
        if (liveDelay) return new Promise(resolve => setTimeout(resolve, liveDelay)).then(respond);
        return respond();
      }
      return route.abort();
    });
    overrides.set('/data/repos-cache.json', { body: [] });
    overrides.set('/data/repos-cache-meta.json', { body: { checkedAt: '2026-11-06T00:00:00Z' } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    overrides.set('/data/featured.json', { status: 500, body: [] });
    await page.goto(`${origin}/featured.html`);
    await page.waitForLoadState('networkidle');
    check(await page.locator('#featured-list .repo-card').count() === selections.length, 'A failed fetch must retain every static featured project.');
    overrides.set('/data/featured.json', { body: [{}] });
    await page.reload();
    await page.waitForLoadState('networkidle');
    check(await page.locator('#featured-list .repo-card').count() === selections.length, 'Malformed featured data must not replace valid static cards.');

    overrides.set('/data/featured.json', { body: selections, delay: 250 });
    await page.goto(`${origin}/featured.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.initialFeaturedCard = document.querySelector('#featured-list .repo-card'); });
    await page.waitForLoadState('networkidle');
    check(await page.evaluate(() => window.initialFeaturedCard === document.querySelector('#featured-list .repo-card')), 'Matching JSON must not rebuild the existing static cards or discard their extra links.');
    overrides.set('/data/featured.json', { status: 500, body: [] });
    await page.goto(`${origin}/projects.html`);
    await page.waitForFunction(() => document.querySelector('#projects-source')?.textContent.includes('temporarily unavailable'));
    check(await page.locator('#projects-list .repo-card').count() === selections.length, 'Curated projects remain available when GitHub is unavailable.');
    check(await page.locator('#projects-list .repo-stat').count() === 0, 'Curated fallbacks must not invent counts or update dates.');
    await page.locator('#projects-filter').fill('kubeflow');
    check(await page.locator('#projects-list .repo-card').count() === selections.filter(item => [item.title, item.description, ...(item.tags || [])].join(' ').toLowerCase().includes('kubeflow')).length, 'Offline topic search must work.');
    await page.locator('#projects-filter').fill('');
    await page.locator('[data-lang="hcl"]').click();
    check(await page.locator('#projects-list .repo-card').count() === selections.filter(item => (item.tags || []).some(tag => ['terraform', 'hcl'].includes(tag.toLowerCase()))).length, 'Offline technology filtering must work.');
    await page.locator('#projects-filter').fill('no-such-project');
    check(await page.locator('#projects-count').textContent() === '0 projects shown', 'Empty filtering has an announced result.');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    check(await page.locator('#projects-list .repo-card').count() === selections.length, 'Clear filters restores the complete fallback.');

    live = true;
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#projects-source')?.textContent.includes('Live metadata loaded'));
    check(await page.locator('#projects-list .repo-card').count() === 12, 'The live listing initially renders twelve cards without truncating its dataset.');
    check(await page.locator('#projects-count').textContent() === '12 of 14 repositories', 'The total repository count remains visible.');
    await page.locator('#projects-more').click();
    check(await page.locator('#projects-list .repo-card').count() === 14, 'Show more exposes the remaining repositories.');
    check(await page.locator('#projects-more').isHidden(), 'Show more hides after the complete matching list is rendered.');
    await page.locator('#projects-filter').fill('repository-13');
    check(await page.locator('#projects-list .repo-card').count() === 1, 'Search includes repositories beyond the first twelve.');
    await page.locator('#projects-filter').fill('');
    check(await page.locator('#projects-list .repo-card').count() === 12, 'Changing the search resets the display limit.');

    const savedRepositories = [
      ...Array.from({ length: 16 }, (_, index) => ({ name: `saved-${index}`, description: 'Saved fixture', html_url: `https://github.com/example/saved-${index}`, language: 'Python', topics: [] })),
      { name: 'java-fixture', html_url: 'https://github.com/example/java', language: 'Java' },
      { name: 'kotlin-fixture', html_url: 'https://github.com/example/kotlin', language: 'Kotlin' },
      { name: 'csharp-fixture', html_url: 'https://github.com/example/csharp', language: 'C#' },
      { name: 'fork-excluded', html_url: 'https://github.com/example/fork', fork: true },
      { name: 'archive-excluded', html_url: 'https://github.com/example/archive', archived: true }
    ];
    live = false;
    overrides.set('/data/repos-cache.json', { body: savedRepositories });
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#projects-source')?.textContent.includes('complete saved collection'));
    check(await page.locator('#projects-count').textContent() === '12 of 19 repositories', 'A failed live refresh keeps all valid snapshot repositories with progressive display.');
    await page.waitForFunction(() => document.querySelector('#projects-source')?.textContent.includes('6 Nov 2026'));
    check((await page.locator('#projects-source').textContent()).includes('6 Nov 2026'), 'The saved source is labelled with its checked date.');
    await page.locator('#projects-filter').fill('saved-15');
    check(await page.locator('#projects-list .repo-card').count() === 1, 'Snapshot search also includes undisplayed entries.');
    await page.locator('#projects-filter').fill('');
    if (await page.locator('[data-lang="java"]').count()) {
      await page.locator('[data-lang="java"]').click();
      check(await page.locator('#projects-list .repo-card').count() === 2, 'Java filter includes actual Java and Kotlin language records.');
    }
    if (await page.locator('[data-lang="csharp"]').count()) {
      await page.locator('[data-lang="csharp"]').click();
      check(await page.locator('#projects-list .repo-card').count() === 1, 'C# filter includes actual C# language records.');
    }
    live = true;
    liveDelay = 300;
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#projects-source')?.textContent.includes('Checking for current metadata') && document.querySelector('#projects-count')?.textContent === '12 of 19 repositories');
    check(await page.locator('#projects-count').textContent() === '12 of 19 repositories', 'The snapshot is usable while the live request is still pending.');
    await page.waitForFunction(() => document.querySelector('#projects-source')?.textContent.includes('Live metadata loaded'));
    check(await page.locator('#projects-count').textContent() === '12 of 14 repositories', 'A saved snapshot never prevents the fresh live collection from loading.');
    liveDelay = 0;
    paginate = true;
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#projects-count')?.textContent === '12 of 103 repositories');
    check(await page.locator('#projects-count').textContent() === '12 of 103 repositories', 'GitHub Link pagination retains repositories beyond the first API page.');
    await page.locator('#projects-filter').fill('many-102');
    check(await page.locator('#projects-list .repo-card').count() === 1, 'Search spans all fetched API pages.');
    paginate = false;
    live = false;
    const actualSnapshot = JSON.parse(fs.readFileSync(path.join(root, 'data/repos-cache.json'), 'utf8'));
    const activeSnapshot = actualSnapshot.filter(repo => repo && !repo.fork && !repo.archived);
    const actualMeta = JSON.parse(fs.readFileSync(path.join(root, 'data/repos-cache-meta.json'), 'utf8'));
    overrides.set('/data/repos-cache.json', { body: actualSnapshot });
    overrides.set('/data/repos-cache-meta.json', { body: actualMeta });
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#projects-source')?.textContent.includes('complete saved collection'));
    check(await page.locator('#projects-count').textContent() === `12 of ${activeSnapshot.length} repositories`, 'The committed public snapshot renders its true active owned repository count.');
    while (await page.locator('#projects-more').isVisible()) await page.locator('#projects-more').click();
    check(await page.locator('#projects-list .repo-card').count() === activeSnapshot.length, 'Show more reaches every active repository in the committed snapshot.');
    if (activeSnapshot.some(repo => ['Java', 'Kotlin'].includes(repo.language))) {
      await page.locator('[data-lang="java"]').click();
      check(await page.locator('#projects-count').textContent() === `${Math.min(12, activeSnapshot.filter(repo => ['Java', 'Kotlin'].includes(repo.language)).length)} of ${activeSnapshot.filter(repo => ['Java', 'Kotlin'].includes(repo.language)).length} repositories`, 'Java/Kotlin filtering matches actual recorded snapshot languages.');
    }
    if (activeSnapshot.some(repo => repo.language === 'C#')) {
      await page.locator('[data-lang="csharp"]').click();
      const expected = activeSnapshot.filter(repo => repo.language === 'C#').length;
      check(await page.locator('#projects-count').textContent() === `${Math.min(12, expected)} of ${expected} ${expected === 1 ? 'repository' : 'repositories'}`, 'C# filtering matches actual recorded snapshot languages.');
    }
    overrides.set('/data/repos-cache.json', { body: [] });

    await page.goto(`${origin}/index.html`);
    await page.locator('.menu-toggle').click();
    check(await page.evaluate(() => document.activeElement === document.querySelector('#primary-menu a')), 'Opening the menu moves focus into navigation.');
    for (let index = 0; index < 20; index++) {
      await page.keyboard.press('Tab');
      check(await page.evaluate(() => document.querySelector('.site-header').contains(document.activeElement)), 'Open menu keyboard focus stays within visible header controls.');
    }
    const disclosure = page.locator('.nav-explore');
    if (await disclosure.count()) {
      await disclosure.locator('summary').click();
      await page.keyboard.press('Tab');
      check(await disclosure.evaluate(node => node.contains(document.activeElement) && document.activeElement.tagName === 'A'), 'Expanded Explore links participate in the real navigation focus order.');
      await page.keyboard.press('Escape');
      check(!await disclosure.evaluate(node => node.open) && await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'true', 'Escape closes Explore first while keeping the mobile menu available.');
    }
    await page.keyboard.press('Escape');
    check(await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'false', 'Escape closes mobile navigation.');
    await context.close();

    // A real worker verifies cache ownership, freshness, and offline behavior.
    overrides.set('/data/featured.json', { body: selections });
    const workerContext = await browser.newContext({ reducedMotion: 'reduce' });
    await workerContext.route('https://**/*', route => route.abort());
    const workerPage = await workerContext.newPage();
    workerPage.on('pageerror', error => errors.push(error.message));
    overrides.set('/test-bootstrap.html', { type: 'text/html', body: '<!doctype html><title>Cache test bootstrap</title>' });
    await workerPage.goto(`${origin}/test-bootstrap.html`);
    await workerPage.evaluate(async () => {
      await caches.open('foreign-application-cache');
      await caches.open('site-cache-v24');
      await caches.open('jadeleke-site-v0');
    });
    await workerPage.goto(`${origin}/index.html`);
    await workerPage.evaluate(() => navigator.serviceWorker.ready);
    await workerPage.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const names = await workerPage.evaluate(() => caches.keys());
    check(names.includes('foreign-application-cache'), 'Worker activation preserves caches belonging to other applications.');
    check(!names.includes('site-cache-v24') && !names.includes('jadeleke-site-v0'), 'Worker activation removes its own known old versions.');

    const updated = selections.map((item, index) => index ? item : { ...item, description: 'Updated cache freshness fixture' });
    overrides.set('/data/featured.json', { body: updated });
    let data = await workerPage.evaluate(() => fetch('/data/featured.json').then(response => response.json()));
    check(data[0].description === updated[0].description, 'JSON requests refresh from the network without a cache-version change.');
    overrides.set('/data/featured.json', { type: 'text/html', body: '<html>Unexpected upstream response</html>' });
    data = await workerPage.evaluate(() => fetch('/data/featured.json').then(response => response.json()));
    check(data[0].description === updated[0].description, 'Malformed JSON does not overwrite valid cached data.');

    overrides.set('/test-api.json', { body: { example: true } });
    await workerPage.evaluate(() => Promise.all([fetch('/test-api.json'), fetch('/blog/admin.html'), fetch('/blog/post.html?slug=test')]));
    const requests = await workerPage.evaluate(async () => {
      const names = await caches.keys();
      const own = names.find(name => name.startsWith('jadeleke-site-'));
      return (await (await caches.open(own)).keys()).map(request => new URL(request.url).pathname);
    });
    check(!requests.includes('/test-api.json'), 'Unrecognised API responses are not cached.');
    check(!requests.includes('/blog/admin.html') && !requests.includes('/blog/post.html'), 'Publishing and per-post query pages are not cached.');
    overrides.set('/css/main.css', { type: 'text/css', body: '/* Future version fixture one */ body { color: green; }' });
    let asset = await workerPage.evaluate(() => fetch('/css/main.css?v=future-fixture').then(response => response.text()));
    check(asset.includes('Future version fixture one'), 'A different asset version loads from the network instead of the current release base cache.');
    overrides.set('/css/main.css', { type: 'text/css', body: '/* Future version fixture two */ body { color: green; }' });
    asset = await workerPage.evaluate(() => fetch('/css/main.css?v=future-fixture').then(response => response.text()));
    check(asset.includes('Future version fixture two'), 'Different version URLs revalidate even if an exact earlier response was cached.');
    await workerContext.setOffline(true);
    asset = await workerPage.evaluate(version => fetch('/css/main.css?v=' + version).then(response => response.text()), assetVersion);
    check(asset.includes('--bg:') && !asset.includes('Future version fixture'), 'Current version CSS can use its base precache offline.');
    asset = await workerPage.evaluate(version => fetch('/js/theme.js?v=' + version).then(response => response.text()), assetVersion);
    check(asset.includes('theme'), 'Current version theme script is available offline before an exact query was visited.');
    asset = await workerPage.evaluate(() => fetch('/css/main.css?v=future-fixture').then(response => response.text()));
    check(asset.includes('Future version fixture two'), 'A different version has an exact-query offline fallback after being fetched.');
    const absentVersion = await workerPage.evaluate(() => fetch('/css/main.css?v=never-fetched-version').then(async response => ({ status: response.status, body: await response.text() })));
    check(absentVersion.status === 503 && !absentVersion.body.includes('--bg:'), 'An unseen different version never receives the wrong release base CSS offline.');
    data = await workerPage.evaluate(() => fetch('/data/featured.json').then(response => response.json()));
    check(data[0].description === updated[0].description, 'Last valid project data remains available offline.');
    const research = await workerPage.goto(`${origin}/research.html`);
    check(research.status() === 200 && (await workerPage.locator('h1').textContent()).includes('Cloud Computing'), 'Public research navigation works offline.');
    const resume = await workerPage.goto(`${origin}/resume.html`);
    check(resume.status() === 200 && await workerPage.locator('#print-resume').count() > 0, 'An unvisited resume route loads its precached page and controls offline.');
    check(await workerPage.evaluate(() => document.documentElement.classList.contains('nav-ready')), 'Shared versioned scripts initialise on the unvisited offline resume route.');
    const cv = await workerPage.evaluate(() => fetch('/assets/Joseph-Adeleke-current.pdf').then(async response => ({ status: response.status, contentType: response.headers.get('Content-Type'), header: new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5)) })));
    check(cv.status === 200 && cv.header === '%PDF-', 'The current downloadable CV is available offline.');
    const missing = await workerPage.goto(`${origin}/missing-page`);
    check(missing.status() === 404 && (await workerPage.locator('h1').textContent()).includes('404'), 'Offline missing pages retain a real 404 status.');
    check(errors.length === 0, `No browser exceptions: ${errors.join(', ')}`);
    await workerContext.close();
    console.log(`PASS: ${checks} reliability assertions covering API failures, filtering, full featured content, menu focus, cache ownership, JSON freshness, and offline navigation.`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
