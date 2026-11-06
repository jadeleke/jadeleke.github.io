(function themeToggle() {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  if (!button) return;
  const icons = {
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>'
  };
  function update() {
    const mode = root.dataset.theme || 'light';
    button.innerHTML = icons[mode];
    button.setAttribute('aria-label', 'Switch to ' + (mode === 'light' ? 'dark' : 'light') + ' theme');
    button.title = button.getAttribute('aria-label');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'light' ? '#f5f3ed' : '#111c19');
  }
  update();
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (_) {}
    update();
  });
})();

(function siteInteractions() {
  'use strict';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function safeURL(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function externalLink(url, label, className) {
    const link = element('a', className, label);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  const scriptURL = document.querySelector('script[src$="js/main.js"]')?.src;
  const siteURL = scriptURL ? new URL('../', scriptURL) : new URL('./', location.href);

  async function getJSON(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { cache: 'no-cache', signal: controller.signal });
      if (!response.ok) throw new Error('Request unavailable');
      return await response.json();
    } finally { clearTimeout(timeout); }
  }

  (function primaryNavigation() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.getElementById('primary-menu');
    if (!toggle || !menu) return;
    const body = document.body;
    const isOpen = () => body.classList.contains('menu-open');
    function closeMenu() {
      body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', () => {
      const open = !isOpen();
      body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', event => {
      if (isOpen() && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (!isOpen()) return;
      if (event.key === 'Escape') {
        closeMenu();
        toggle.focus();
      } else if (event.key === 'Tab') {
        const focusable = [toggle, ...menu.querySelectorAll('a[href], button, summary')]
          .filter(node => node.getClientRects().length && !node.disabled);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
    window.addEventListener('resize', () => { if (innerWidth > 900 && isOpen()) closeMenu(); });
    const normalizePath = value => value.replace(/index\.html$/, '').replace(/\/$/, '');
    const currentPath = normalizePath(location.pathname);
    const writingPath = normalizePath(new URL('blog/', siteURL).pathname);
    menu.querySelectorAll('a[href]').forEach(link => {
      const path = normalizePath(new URL(link.href).pathname);
      if (path === currentPath || (path === writingPath && currentPath.startsWith(writingPath + '/'))) {
        link.setAttribute('aria-current', 'page');
      }
    });
  })();

  (async function loadProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;
    const filterInput = document.getElementById('projects-filter');
    const pills = [...document.querySelectorAll('.filter-pill')];
    let count = document.getElementById('projects-count');
    if (!count) {
      count = element('p', 'skill-note');
      count.id = 'projects-count';
      count.setAttribute('role', 'status');
      count.setAttribute('aria-live', 'polite');
      container.before(count);
    }
    pills.forEach(pill => pill.setAttribute('aria-pressed', String(pill.dataset.lang === 'all')));
    let repos = [];
    let currentFilter = 'all';

    function render(list) {
      const fragment = document.createDocumentFragment();
      count.textContent = `${list.length} ${list.length === 1 ? 'repository' : 'repositories'} shown`;
      if (!list.length) {
        const empty = element('article', 'card');
        empty.append(element('h3', '', 'No repositories found'), element('p', 'muted', 'Try another search or language filter.'));
        fragment.append(empty);
      }
      list.forEach(repo => {
        const card = element('article', 'card repo-card');
        const header = element('div', 'repo-card-header');
        const title = element('h3', 'repo-title');
        const repoURL = safeURL(repo.html_url);
        title.append(repoURL ? externalLink(repoURL, repo.name || 'Repository') : element('span', '', repo.name || 'Repository'));
        header.append(title);
        card.append(header);
        card.append(element('p', 'muted repo-desc', repo.description || 'Explore the source and project documentation on GitHub.'));
        const stats = element('div', 'repo-stats');
        if (repo.language) {
          const language = element('span', 'repo-lang');
          const dot = element('span', 'repo-lang-color');
          dot.dataset.lang = String(repo.language);
          language.append(dot, document.createTextNode(String(repo.language)));
          stats.append(language);
        }
        if (Number.isFinite(repo.stargazers_count) && repo.stargazers_count > 0) {
          stats.append(element('span', 'repo-stat', `${repo.stargazers_count} stars`));
        }
        if (Number.isFinite(repo.forks_count) && repo.forks_count > 0) {
          stats.append(element('span', 'repo-stat', `${repo.forks_count} forks`));
        }
        const updated = new Date(repo.updated_at);
        if (!Number.isNaN(updated.getTime())) {
          stats.append(element('span', 'repo-stat', `Updated ${updated.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`));
        }
        card.append(stats);
        const demoURL = safeURL(repo.homepage);
        if (demoURL) {
          const actions = element('div', 'repo-actions');
          actions.append(externalLink(demoURL, 'View live demo', 'btn primary btn-sm'));
          card.append(actions);
        }
        fragment.append(card);
      });
      container.replaceChildren(fragment);
    }

    function applyFilters() {
      const q = filterInput?.value.trim().toLowerCase() || '';
      const matches = repos.filter(repo => {
        const name = String(repo.name || '').toLowerCase();
        const description = String(repo.description || '').toLowerCase();
        const language = String(repo.language || '').toLowerCase();
        const topics = Array.isArray(repo.topics) ? repo.topics.map(t => String(t).toLowerCase()) : [];
        const searchMatch = !q || [name, description, language, ...topics].some(value => value.includes(q));
        let languageMatch = currentFilter === 'all';
        if (currentFilter === 'python') languageMatch = ['python', 'jupyter notebook'].includes(language);
        if (currentFilter === 'javascript') languageMatch = ['javascript', 'typescript'].includes(language);
        if (currentFilter === 'hcl') languageMatch = language === 'hcl';
        if (currentFilter === 'shell') languageMatch = language === 'shell';
        if (currentFilter === 'testing') languageMatch = topics.some(t => ['test', 'testing', 'pytest', 'jest', 'e2e', 'qa', 'tdd'].includes(t)) || name.includes('test') || description.includes('test');
        return searchMatch && languageMatch;
      });
      render(matches);
    }

    filterInput?.addEventListener('input', applyFilters);
    pills.forEach(pill => pill.addEventListener('click', () => {
      currentFilter = pill.dataset.lang || 'all';
      pills.forEach(item => {
        const active = item === pill;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applyFilters();
    }));

    try {
      let data = [];
      try { data = await getJSON(new URL('data/repos-cache.json', siteURL)); } catch (_) {}
      if (!Array.isArray(data) || !data.length) data = await getJSON('https://api.github.com/users/jadeleke/repos?per_page=100&sort=updated');
      if (!Array.isArray(data)) throw new Error('Repository list unavailable');
      repos = data.filter(repo => repo && typeof repo === 'object' && !repo.fork && !repo.archived)
        .sort((a, b) => (Number(b.stargazers_count) || 0) - (Number(a.stargazers_count) || 0)).slice(0, 12);
      applyFilters();
    } catch (_) {
      count.textContent = 'Live repository listing is temporarily unavailable.';
      const card = element('article', 'card');
      card.append(element('h3', '', 'Explore the repositories on GitHub'), element('p', 'muted', 'The live listing could not be loaded. The selected projects above are still available.'));
      card.append(externalLink('https://github.com/jadeleke', 'View GitHub profile', 'btn'));
      container.replaceChildren(card);
    }
  })();

  (async function loadFeatured() {
    const container = document.getElementById('featured-list');
    if (!container) return;
    // Verified selections from data/featured.json remain useful when the network is unavailable.
    const selections = [
      { title: 'GhanaVoice', description: 'Speech classification for Ghanaian languages using CNN models.', repo: 'https://github.com/jadeleke/GhanaVoice', tags: ['ML', 'Python', 'Speech'] },
      { title: 'Melanoma-Classification-Pipeline', description: 'End-to-end ML pipeline for melanoma classification with model training, evaluation, and deployment.', repo: 'https://github.com/jadeleke/Melanoma-Classification-Pipeline', tags: ['ML', 'Python', 'Pipeline'] },
      { title: 'terraform-docker-nginx-app', description: 'Infrastructure-as-code demo deploying an Nginx app with Terraform and Docker.', repo: 'https://github.com/jadeleke/terraform-docker-nginx-app', tags: ['DevOps', 'Terraform', 'Docker'] }
    ];
    function render(items) {
      const fragment = document.createDocumentFragment();
      items.filter(item => item && typeof item === 'object').forEach(item => {
        const card = element('article', 'card repo-card');
        const header = element('div', 'repo-card-header');
        const title = element('h3', 'repo-title');
        const repoURL = safeURL(item.repo);
        const demoURL = safeURL(item.demo);
        title.append(repoURL ? externalLink(repoURL, item.title || 'Project') : element('span', '', item.title || 'Project'));
        header.append(title);
        card.append(header, element('p', 'muted repo-desc', item.description || 'Explore the project and source code.'));
        if (Array.isArray(item.tags) && item.tags.length) {
          const tags = element('div', 'tag-strip');
          item.tags.forEach(tag => tags.append(element('span', 'tag-pill', tag)));
          card.append(tags);
        }
        if (repoURL || demoURL) {
          const actions = element('div', 'repo-actions');
          if (repoURL) actions.append(externalLink(repoURL, 'GitHub', 'btn'));
          if (demoURL) actions.append(externalLink(demoURL, 'Live demo', 'btn primary'));
          card.append(actions);
        }
        fragment.append(card);
      });
      container.replaceChildren(fragment);
    }
    render(selections);
    try {
      const data = await getJSON(new URL('data/featured.json', siteURL));
      if (Array.isArray(data) && data.some(item => item && typeof item === 'object')) render(data);
    } catch (_) { /* Keep the verified static selections. */ }
  })();

  (function workflowExplorer() {
    const explorer = document.getElementById('workflow-explorer');
    if (!explorer) return;
    const title = document.getElementById('workflow-title');
    const description = document.getElementById('workflow-description');
    const buttons = [...explorer.querySelectorAll('button[data-workflow-mode]')];
    const modes = {
      schedule: { title: 'Map the dependencies', description: 'Scientific workflows form a directed acyclic graph: each task must respect the outputs and ordering of the tasks before it.' },
      risk: { title: 'Plan for uncertainty', description: 'My research interests explore runtime uncertainty and statistical risk control to support more dependable deadline-constrained scheduling.' },
      resources: { title: 'Balance cost and capacity', description: 'Cloud resource allocation is a trade-off between cost, performance, and reliability. My research direction investigates how scheduling decisions can balance these goals.' }
    };
    if (description) description.setAttribute('aria-live', 'polite');
    buttons.forEach(button => button.addEventListener('click', () => {
      const mode = button.dataset.workflowMode;
      if (!modes[mode]) return;
      explorer.dataset.mode = mode;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      if (title) title.textContent = modes[mode].title;
      if (description) description.textContent = modes[mode].description;
    }));
  })();

  (function copyEmail() {
    const button = document.getElementById('copy-email');
    const status = document.getElementById('copy-status');
    if (!button || !status) return;
    button.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText('akdeljoseph@outlook.com');
        status.textContent = 'Email address copied.';
      } catch (_) {
        status.textContent = 'Copy this address: akdeljoseph@outlook.com. You can select the address directly or use the email link.';
      }
    });
  })();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', siteURL)).catch(() => {});
    });
  }
})();

(function filterCredentials() {
  const input = document.getElementById('credentials-filter');
  const list = document.getElementById('credentials-list');
  const count = document.getElementById('credentials-count');
  if (!input || !list || !count) return;
  const cards = [...list.children];
  function filter() {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      card.hidden = !card.textContent.toLocaleLowerCase().includes(query);
      if (!card.hidden) { visible++; card.classList.add('is-visible'); }
    });
    count.textContent = visible + ' of ' + cards.length + ' credentials' + (visible ? '' : '. Try another search.');
  }
  input.addEventListener('input', filter);
  filter();
})();
