// Validate blog/posts.json entries and referenced files
const { readFile } = require('node:fs/promises');

function isISODate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

async function main() {
  try {
    const raw = await readFile('blog/posts.json', 'utf-8');
    const posts = JSON.parse(raw);
    if (!Array.isArray(posts)) throw new Error('posts.json must be an array');

    const slugs = new Set();
    for (const p of posts) {
      if (!p.slug) throw new Error('Missing slug');
      if (slugs.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`);
      slugs.add(p.slug);
      if (!p.title) throw new Error(`Missing title for ${p.slug}`);
      if (!p.date || !isISODate(p.date)) throw new Error(`Invalid date for ${p.slug}. Use YYYY-MM-DD`);
      if (!p.mdPath && !p.content) throw new Error(`Missing mdPath/content for ${p.slug}`);
      if (p.mdPath) {
        try {
          await readFile(`blog/${p.mdPath}`, 'utf-8');
        } catch {
          throw new Error(`Missing markdown file blog/${p.mdPath} for ${p.slug}`);
        }
      }
    }
    console.log(`Validated ${posts.length} posts.`);
  } catch (e) {
    console.error('Post validation failed:', e.message);
    process.exit(1);
  }
}

main();
