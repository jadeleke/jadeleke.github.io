// Shared blog loader for list and post pages

async function fetchPosts() {
  const res = await fetch('posts.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Failed to load posts.json');
  return res.json();
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function renderList() {
  const list = document.getElementById('blog-list');
  if (!list) return;
  try {
    const posts = await fetchPosts();
    if (!posts.length) {
      list.innerHTML = '<p>No posts yet.</p>';
      return;
    }
    list.innerHTML = '';
    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'blog-card';
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = `post.html?slug=${encodeURIComponent(post.slug)}`;
      a.textContent = post.title;
      h3.appendChild(a);
      const meta = document.createElement('div');
      meta.className = 'meta';
      const date = new Date(post.date).toLocaleDateString();
      meta.textContent = `${date}${post.tags && post.tags.length ? ' • ' + post.tags.join(', ') : ''}`;
      const p = document.createElement('p');
      p.textContent = post.excerpt || '';
      article.append(h3, meta, p);
      list.appendChild(article);
    });
  } catch (e) {
    list.innerHTML = '<p>Could not load posts.</p>';
  }
}

async function renderPost() {
  const container = document.getElementById('post-container');
  if (!container) return;
  const titleEl = document.getElementById('post-title');
  const metaEl = document.getElementById('post-meta');
  const contentEl = document.getElementById('post-content');
  const slug = getQueryParam('slug');
  if (!slug) {
    titleEl.textContent = 'Post not found';
    contentEl.textContent = 'No slug provided.';
    return;
  }
  try {
    const posts = await fetchPosts();
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      titleEl.textContent = 'Post not found';
      contentEl.textContent = 'The requested post does not exist.';
      return;
    }
    document.title = `${post.title} | Joseph Adeleke`;
    titleEl.textContent = post.title;
    metaEl.textContent = new Date(post.date).toLocaleDateString();

    // Update SEO tags
    const desc = post.excerpt || '';
    const canonicalUrl = `https://jadeleke.github.io/blog/post.html?slug=${encodeURIComponent(post.slug)}`;
    const set = (sel, attr, val) => { const el = document.getElementById(sel); if (el) el.setAttribute(attr, val); };
    set('meta-description', 'content', desc);
    set('og-title', 'content', `${post.title} | Joseph Adeleke`);
    set('og-description', 'content', desc);
    set('og-url', 'content', canonicalUrl);
    set('twitter-title', 'content', `${post.title} | Joseph Adeleke`);
    set('twitter-description', 'content', desc);
    const canon = document.getElementById('canonical'); if (canon) canon.setAttribute('href', canonicalUrl);

    // Load content (Markdown preferred)
    let ogImgResolved = null;
    if (post.md || post.mdPath) {
      const mdPath = post.mdPath || post.md;
      const r = await fetch(mdPath, { cache: 'no-cache' });
      if (!r.ok) throw new Error('Failed to load markdown');
      const md = await r.text();
      // Remove leading H1 from Markdown to avoid duplicate title on page
      function stripLeadingH1(text) {
        const lines = text.split(/\r?\n/);
        let i = 0;
        while (i < lines.length && lines[i].trim() === '') i++;
        if (i < lines.length) {
          const l = lines[i].trim();
          if (l.startsWith('# ')) {
            lines.splice(i, 1);
            while (i < lines.length && lines[i].trim() === '') lines.splice(i, 1);
            return lines.join('\n');
          }
          if (i + 1 < lines.length && /^=+$/.test(lines[i + 1].trim())) {
            lines.splice(i, 2);
            while (i < lines.length && lines[i].trim() === '') lines.splice(i, 1);
            return lines.join('\n');
          }
        }
        return text;
      }
      const mdNoH1 = stripLeadingH1(md);
      // Try to extract first image from Markdown for OG image
      let ogImg = null;
      const m = mdNoH1.match(/!\[[^\]]*\]\(([^)]+)\)/);
      if (m && m[1]) {
        ogImg = m[1];
        if (!/^https?:\/\//i.test(ogImg)) {
          ogImg = mdPath.replace(/\/[^/]*$/, '/') + ogImg.replace(/^\.\//, '');
        }
      }
      if (ogImg) {
        set('og-image', 'content', ogImg);
        set('twitter-image', 'content', ogImg);
        ogImgResolved = ogImg;
      }
      if (window.marked) {
        contentEl.innerHTML = marked.parse(mdNoH1);
      } else {
        contentEl.textContent = mdNoH1;
      }
    } else if (post.content) {
      contentEl.innerHTML = post.content;
    } else {
      contentEl.textContent = 'No content available.';
    }

    // Inject JSON-LD for BlogPosting
    try {
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: desc,
        datePublished: post.date,
        author: {
          '@type': 'Person',
          name: 'Joseph Adeleke',
          url: 'https://jadeleke.github.io/'
        },
        image: ogImgResolved || 'https://jadeleke.github.io/assets/project-default.svg',
        url: canonicalUrl
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    } catch {}
  } catch (e) {
    titleEl.textContent = 'Error loading post';
    contentEl.textContent = 'Please try again later.';
  }
}

renderList();
renderPost();
