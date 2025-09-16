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
    if (post.md || post.mdPath) {
      const mdPath = post.mdPath || post.md;
      const r = await fetch(mdPath, { cache: 'no-cache' });
      if (!r.ok) throw new Error('Failed to load markdown');
      const md = await r.text();
      if (window.marked) {
        contentEl.innerHTML = marked.parse(md);
      } else {
        contentEl.textContent = md;
      }
    } else if (post.content) {
      contentEl.innerHTML = post.content;
    } else {
      contentEl.textContent = 'No content available.';
    }
  } catch (e) {
    titleEl.textContent = 'Error loading post';
    contentEl.textContent = 'Please try again later.';
  }
}

renderList();
renderPost();
