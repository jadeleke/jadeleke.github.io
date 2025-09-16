// Build a simple RSS feed from blog/posts.json
const { readFile, writeFile } = require('node:fs/promises');

const SITE = 'https://jadeleke.github.io';

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  const raw = await readFile('blog/posts.json', 'utf-8');
  const posts = JSON.parse(raw);
  const items = posts.map(p => {
    const link = `${SITE}/blog/post.html?slug=${encodeURIComponent(p.slug)}`;
    const title = esc(p.title);
    const desc = esc(p.excerpt || '');
    const pubDate = new Date(p.date).toUTCString();
    return `\n    <item>\n      <title>${title}</title>\n      <link>${link}</link>\n      <guid>${link}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${desc}</description>\n    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Joseph Adeleke — Blog</title>\n    <link>${SITE}/blog/</link>\n    <description>MLOps, DevOps, Oracle DBA, Linux SysAdmin</description>${items}\n  </channel>\n</rss>\n`;
  await writeFile('feed.xml', rss);
  console.log('Wrote feed.xml');
}

main().catch(e => { console.error(e); process.exit(1); });

