// Initialize skills chart safely after DOM parse
// --- Skills (MLOps-centric) ---
(function initSkillsChart() {
  const canvas = document.getElementById('skillsChart');
  if (!canvas || typeof window.Chart === 'undefined') {
    // Chart target or library missing; skip initialization gracefully
    return;
  }
  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Python', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'MLflow/Airflow', 'Linux', 'Oracle DBA'],
      datasets: [{
        label: 'Proficiency (%)',
        data: [90, 85, 70, 80, 75, 65, 70, 85, 70],
        backgroundColor: ['#38bdf8', '#0ea5e9', '#3b82f6', '#22c55e', '#10b981', '#f59e0b', '#a78bfa', '#94a3b8', '#f87171'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#cbd5e1' },
          grid: { color: 'rgba(203,213,225,0.2)' }
        },
        x: {
          ticks: { color: '#cbd5e1' },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { labels: { color: '#e2e8f0' } }
      }
    }
  });
})();

const GITHUB_USERNAME = 'jadeleke';

// --- GitHub Repo Fetching Utility ---
async function getGithubRepos() {
  // Try cache first
  try {
    const cached = await fetch('data/repos-cache.json', { cache: 'no-cache' });
    if (cached.ok) {
      const data = await cached.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Ignore cache errors and fall back to API
  }

  // Fallback to API
  const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`, {
    headers: { 'Accept': 'application/vnd.github+json' }
  });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return await res.json();
}

// --- Projects: Fetch from GitHub ---
(async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  try {
    const data = await getGithubRepos();
    const repos = data
      .filter(r => !r.fork && !r.archived)
      .sort((a, b) => b.stargazers_count - a.stargazers_count);

    if (!repos.length) {
      grid.innerHTML = '<p>No repositories found.</p>';
      return;
    }

    grid.innerHTML = '';
    repos.forEach(repo => {
      const card = document.createElement('div');
      card.className = 'project-card';

      const info = document.createElement('div');
      info.className = 'project-info';
      const h3 = document.createElement('h3');
      h3.textContent = repo.name;
      const p = document.createElement('p');
      p.textContent = repo.description || 'No description provided.';

      const meta = document.createElement('div');
      meta.className = 'repo-meta';
      const left = document.createElement('span');
      left.textContent = repo.language || '—';
      const right = document.createElement('span');
      const stars = `★ ${repo.stargazers_count}`;
      const updated = new Date(repo.updated_at).toLocaleDateString();
      right.textContent = `${stars} • Updated ${updated}`;
      meta.append(left, right);

      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const gh = document.createElement('a');
      gh.href = repo.html_url;
      gh.target = '_blank';
      gh.rel = 'noopener noreferrer';
      gh.className = 'btn secondary';
      gh.textContent = 'GitHub';

      actions.appendChild(gh);

      if (repo.homepage && /^https?:\/\//i.test(repo.homepage)) {
        const demo = document.createElement('a');
        demo.href = repo.homepage;
        demo.target = '_blank';
        demo.rel = 'noopener noreferrer';
        demo.className = 'btn';
        demo.textContent = 'Demo';
        actions.appendChild(demo);
      }

      info.append(h3, p, meta, actions);
      card.appendChild(info);
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p>Could not load projects. <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer">Visit GitHub</a>.</p>`;
    // console.error(err); // Optionally log error
  }
})();

// --- Featured: Load curated list, fallback to top repos ---
(async function loadFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  try {
    const res = await fetch('data/featured.json', { cache: 'no-cache' });
    let featured = [];
    if (res.ok) {
      featured = await res.json();
    }

    if (!featured || !featured.length) {
      // Fallback to top 3 by stars
      const repos = await getGithubRepos();
      const topRepos = repos
        .filter(r => !r.fork && !r.archived)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 3);
      featured = topRepos.map(r => ({
        title: r.name,
        description: r.description || '',
        image: 'assets/project-default.svg',
        repo: r.html_url,
        demo: r.homepage || '',
        tags: [r.language || 'repo'],
        pin: false
      }));
    }

    // Sort pinned first, then by order, then by title
    featured.sort((a, b) => {
      const pa = a.pin ? 1 : 0; const pb = b.pin ? 1 : 0;
      return (pb - pa) || ((a.order ?? 9999) - (b.order ?? 9999)) || (a.title || '').localeCompare(b.title || '');
    });

    function preloadImage(url) {
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      } catch {}
    }
    async function extractRepo(owner, repo) {
      // Try README image first
      try {
        // Get default branch
        const rep = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: { 'Accept': 'application/vnd.github+json' }});
        const repJson = rep.ok ? await rep.json() : null;
        const branch = repJson?.default_branch || 'main';
        const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: { 'Accept': 'application/vnd.github+json' }});
        if (r.ok) {
          const readme = await r.json();
          const rawUrl = readme.download_url; // raw README content URL
          if (rawUrl) {
            const txt = await fetch(rawUrl).then(x => x.ok ? x.text() : '');
            const match = txt.match(/!\[[^\]]*\]\(([^)]+)\)/);
            if (match && match[1]) {
              let url = match[1].trim();
              if (/^https?:\/\//i.test(url)) return url;
              // Relative path -> convert to raw URL
              url = url.replace(/^\.\//, '');
              return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${url}`;
            }
          }
        }
      } catch {}
      // Fallback to GitHub OpenGraph preview image
      return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
    }

    grid.innerHTML = '';
    for (const item of featured) {
      const card = document.createElement('article');
      card.className = 'featured-card';
      if (item.image) {
        const img = document.createElement('img');
        let src = item.image;
        if (src === 'auto' && item.repo) {
          try {
            const url = new URL(item.repo);
            const [owner, repo] = url.pathname.replace(/^\//, '').split('/');
            src = await extractRepo(owner, repo);
          } catch {
            src = 'assets/project-default.svg';
          }
        }
        src = src || 'assets/project-default.svg';
        preloadImage(src);
        img.src = src;
        img.alt = `${item.title} cover`;
        img.className = 'featured-thumb';
        img.loading = 'lazy';
        card.appendChild(img);
      }
      const info = document.createElement('div');
      info.className = 'project-info';
      const h3 = document.createElement('h3');
      h3.textContent = item.title;
      const p = document.createElement('p');
      p.textContent = item.description || '';
      const tags = document.createElement('div');
      tags.className = 'tags';
      (item.tags || []).forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = t;
        tags.appendChild(span);
      });
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      if (item.repo) {
        const a = document.createElement('a');
        a.href = item.repo;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'btn secondary';
        a.textContent = 'GitHub';
        actions.appendChild(a);
      }
      if (item.demo) {
        const d = document.createElement('a');
        d.href = item.demo;
        d.target = '_blank';
        d.rel = 'noopener noreferrer';
        d.className = 'btn';
        d.textContent = 'Demo';
        actions.appendChild(d);
      }
      info.append(h3, p, tags, actions);
      card.appendChild(info);
      grid.appendChild(card);
    }
  } catch (e) {
    grid.innerHTML = '<p>Could not load featured projects.</p>';
  }
})();

// --- Blog: Load latest posts on homepage ---
(async function loadLatestPosts() {
  const list = document.getElementById('blog-list');
  if (!list) return;
  try {
    const res = await fetch('blog/posts.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load posts index');
    const posts = await res.json();
    const latest = posts.slice(0, 3);
    if (!latest.length) {
      list.innerHTML = '<p>No posts yet. Check back soon.</p>';
      return;
    }
    list.innerHTML = '';
    latest.forEach(post => {
      const article = document.createElement('article');
      article.className = 'blog-card';
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = `blog/post.html?slug=${encodeURIComponent(post.slug)}`;
      a.textContent = post.title;
      h3.appendChild(a);
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = new Date(post.date).toLocaleDateString();
      const p = document.createElement('p');
      p.textContent = post.excerpt || '';
      article.append(h3, meta, p);
      list.appendChild(article);
    });
  } catch (e) {
    list.innerHTML = '<p>Could not load blog posts.</p>';
  }
})();
