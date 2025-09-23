// --- Skills (MLOps-centric) ---
(function initSkillsChart() {
  const canvas = document.getElementById('skillsChart');
  if (!canvas || typeof window.Chart === 'undefined') return;
  const styles = getComputedStyle(document.documentElement);
  const axisColor = styles.getPropertyValue('--muted').trim() || '#cbd5e1';
  const textColor = styles.getPropertyValue('--text').trim() || '#e2e8f0';
  const gridColor = 'rgba(203,213,225,0.2)';
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
        y: { beginAtZero: true, max: 100, ticks: { color: axisColor }, grid: { color: gridColor } },
        x: { ticks: { color: axisColor }, grid: { display: false } }
      },
      plugins: { legend: { labels: { color: textColor } } }
    }
  });
})();

// --- Projects: Fetch from GitHub ---
(async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  const username = 'jadeleke';
  const filterInput = document.getElementById('projects-filter');
  let allRepos = [];
  function render(list) {
    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = '<p>No repositories match your filter.</p>';
      return;
    }
    list.forEach(repo => {
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
      left.textContent = repo.language || 'N/A';
      const right = document.createElement('span');
      const stars = `Stars: ${repo.stargazers_count}`;
      const updated = new Date(repo.updated_at).toLocaleDateString();
      right.textContent = `${stars} - Updated ${updated}`;
      meta.append(left, right);
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const gh = document.createElement('a');
      gh.href = repo.html_url;
      gh.target = '_blank'; gh.rel = 'noopener noreferrer'; gh.className = 'btn secondary'; gh.textContent = 'GitHub';
      actions.appendChild(gh);
      if (repo.homepage && /^https?:\/\//i.test(repo.homepage)) {
        const demo = document.createElement('a');
        demo.href = repo.homepage; demo.target = '_blank'; demo.rel = 'noopener noreferrer'; demo.className = 'btn'; demo.textContent = 'Demo';
        actions.appendChild(demo);
      }
      info.append(h3, p, meta, actions);
      card.appendChild(info);
      grid.appendChild(card);
    });
  }
  try {
    // Try cache first
    let data = [];
    try {
      const cached = await fetch('data/repos-cache.json', { cache: 'no-cache' });
      if (cached.ok) data = await cached.json();
    } catch {}
    if (!Array.isArray(data) || data.length === 0) {
      const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: { 'Accept': 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
      data = await res.json();
    }
    let repos = data
      .filter(r => !r.fork && !r.archived)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 12);
    allRepos = repos;
    render(allRepos);
    if (filterInput) {
      filterInput.addEventListener('input', () => {
        const q = (filterInput.value || '').toLowerCase();
        if (!q) { render(allRepos); return; }
        const filtered = allRepos.filter(r =>
          (r.name || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.language || '').toLowerCase().includes(q)
        );
        render(filtered);
      });
    }
  } catch (err) {
    grid.innerHTML = `<p>Could not load projects. <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">Visit GitHub</a>.</p>`;
  }
})();

// --- Featured: Load curated list, fallback to top repos ---
(async function loadFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  try {
    const res = await fetch('data/featured.json', { cache: 'no-cache' });
    let featured = [];
    if (res.ok) featured = await res.json();

    if (!featured || !featured.length) {
      // Fallback to top 3 by stars
      const gh = await fetch('https://api.github.com/users/jadeleke/repos?per_page=100&sort=updated', { headers: { 'Accept': 'application/vnd.github+json' } });
      const repos = gh.ok ? (await gh.json()).filter(r => !r.fork && !r.archived).sort((a,b)=>b.stargazers_count-a.stargazers_count).slice(0,3) : [];
      featured = repos.map(r => ({ title: r.name, description: r.description || '', image: 'assets/project-default.svg', repo: r.html_url, demo: r.homepage || '', tags: [r.language || 'repo'], pin: false }));
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

// --- Theme toggle (light/dark/auto) ---
(function themeToggle() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    root.setAttribute('data-theme', saved);
  }
  function icon(mode){
    // moon, sun, auto (sun with dot)
    if (mode === 'dark') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    if (mode === 'light') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1zm0 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm8-5a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM6 12a1 1 0 0 1-1 1H4a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zm10.95 6.536a1 1 0 0 1-1.414 0l-.793-.793a1 1 0 1 1 1.414-1.414l.793.793a1 1 0 0 1 0 1.414zM7.05 7.05a1 1 0 0 1-1.414 0l-.793-.793A1 1 0 1 1 6.257 4.843l.793.793a1 1 0 0 1 0 1.414z"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm0 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm8-5a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1zM7 12a1 1 0 0 1-1 1H4a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1z"/></svg>';
  }
  if (btn) {
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'auto';
      const next = current === 'dark' ? 'light' : current === 'light' ? 'auto' : 'dark';
      if (next === 'auto') {
        root.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      } else {
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      }
      const mode = root.getAttribute('data-theme') || 'auto';
      btn.innerHTML = icon(mode);
      btn.setAttribute('aria-label', `Theme: ${mode}`);
      btn.setAttribute('title', `Theme: ${mode}`);
    });
    const mode = root.getAttribute('data-theme') || 'auto';
    btn.innerHTML = icon(mode);
    btn.setAttribute('aria-label', `Theme: ${mode}`);
    btn.setAttribute('title', `Theme: ${mode}`);
  }
})();

// --- Service Worker registration ---
(function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
})();

// --- Contact form handling (optional Formspark) ---
(function contactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  function getParam(name){ try { return new URL(window.location.href).searchParams.get(name) || ''; } catch { return ''; } }
  const endpoint = getParam('formspark') || getParam('endpoint') || form.getAttribute('data-contact-endpoint') || '';
  const status = document.getElementById('contact-status');
  const submit = document.getElementById('contact-submit');
  form.addEventListener('submit', async (e) => {
    if (!endpoint) {
      // Fallback to mailto if no endpoint configured
      e.preventDefault();
      const name = encodeURIComponent(form.name?.value || '');
      const msg = encodeURIComponent(form.message?.value || '');
      const subj = encodeURIComponent(`Website message from ${name}`);
      const body = msg;
      if (status) { status.textContent = 'Opening your email client...'; status.className = 'form-status'; }
      window.location.href = `mailto:akdeljoseph@outlook.com?subject=${subj}&body=${body}`;
      return;
    }
    e.preventDefault();
    try {
      const data = new FormData(form);
      if (status) { status.textContent = 'Sending...'; status.className = 'form-status'; }
      if (submit) submit.disabled = true;
      // Helpful defaults for Formspark/SubmitForm
      if (!data.has('_subject')) data.set('_subject', 'Website contact from jadeleke.github.io');
      if (!data.has('_replyto')) data.set('_replyto', form.querySelector('#cf-email')?.value || '');
      if (!data.has('_redirect')) data.set('_redirect', window.location.origin + '/#contact');
      const res = await fetch(endpoint, { method: 'POST', body: data, mode: 'cors', headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Submit failed');
      if (status) { status.textContent = 'Thanks! Your message was sent.'; status.className = 'form-status is-success'; }
      form.reset();
    } catch {
      if (status) { status.textContent = 'Sorry, there was a problem sending your message.'; status.className = 'form-status is-error'; }
    }
    finally { if (submit) submit.disabled = false; }
  });
})();
