// Build sitemap.xml including blog posts
const { readFile, writeFile } = require('node:fs/promises');

const SITE = 'https://jadeleke.github.io';

async function main() {
  const staticUrls = [`${SITE}/`, `${SITE}/blog/`];
  let posts = [];
  try {
    const raw = await readFile('blog/posts.json', 'utf-8');
    posts = JSON.parse(raw);
  } catch {}
  const postUrls = posts.map(p => `${SITE}/blog/post.html?slug=${encodeURIComponent(p.slug)}`);
  const urls = [...staticUrls, ...postUrls];
  const body = urls.map(u => `  <url>\n    <loc>${u}</loc>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  await writeFile('sitemap.xml', xml);
  console.log('Wrote sitemap.xml');
}

main().catch(e => { console.error(e); process.exit(1); });

