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
  window.addEventListener('themechange', update);
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.themePreference = root.dataset.theme;
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

  function localBriefURL(value) {
    if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9/_-]*\.html$/i.test(value)) return '';
    const url = new URL(value, siteURL);
    return url.origin === siteURL.origin ? url.href : '';
  }

  function externalLink(url, label, className) {
    const link = element('a', className, label);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  const scriptURL = document.currentScript?.src || [...document.scripts]
    .map(script => script.src).find(src => {
      try { return new URL(src, location.href).pathname.endsWith('/js/main.js'); }
      catch (_) { return false; }
    });
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
    const header = document.querySelector('.site-header');
    if (!toggle || !menu || !header) return;
    const body = document.body;
    const isOpen = () => body.classList.contains('menu-open');
    const disclosures = [...menu.querySelectorAll('details')];
    function closeDisclosures() { disclosures.forEach(details => { details.open = false; }); }
    function closeMenu() {
      body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      closeDisclosures();
    }
    function visibleControls() {
      return [...header.querySelectorAll('a[href], button:not([disabled]), summary')].filter(node => {
        const closed = node.closest('details:not([open])');
        return (!closed || node === closed.querySelector('summary')) && node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
      });
    }
    toggle.addEventListener('click', () => {
      const open = !isOpen();
      body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) menu.querySelector('a[href]')?.focus({ preventScroll: true });
      else closeDisclosures();
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', event => {
      disclosures.forEach(details => { if (!details.contains(event.target)) details.open = false; });
      if (isOpen() && !header.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const expanded = disclosures.find(details => details.open);
        if (expanded) {
          expanded.open = false;
          expanded.querySelector('summary')?.focus();
          event.preventDefault();
        } else if (isOpen()) {
          closeMenu();
          toggle.focus();
          event.preventDefault();
        }
      } else if (event.key === 'Tab' && isOpen()) {
        // Follow the real header order. The toggle occurs after the menu in the DOM.
        const controls = visibleControls();
        if (!controls.length) return;
        const current = controls.indexOf(document.activeElement);
        const next = current < 0 ? (event.shiftKey ? controls.length - 1 : 0)
          : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
        event.preventDefault();
        controls[next].focus();
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
    document.documentElement.classList.add('nav-ready');
  })();

  // These verified selections mirror data/featured.json and provide a true offline fallback.
  const curatedSelections = [
  {
    "title": "OpenMed MLOps",
    "description": "An educational MLOps demonstration that trains a classifier on synthetic patient data with Kubeflow Pipelines and records experiments in MLflow on Kubernetes.",
    "repo": "https://github.com/jadeleke/openmed-mlops",
    "demo": "",
    "tags": [
      "Python",
      "Kubernetes",
      "Kubeflow",
      "MLflow"
    ],
    "category": "Cloud & MLOps",
    "source": "https://github.com/jadeleke/openmed-mlops/blob/main/README.md",
    "brief": "openmed.html"
  },
  {
    "title": "Local Platform Infrastructure",
    "description": "Terraform-managed local Docker environments with isolated application and PostgreSQL networks, MinIO remote state, and reviewed infrastructure delivery workflows.",
    "repo": "https://github.com/jadeleke/local-platform-infra",
    "demo": "",
    "tags": [
      "Terraform",
      "Docker",
      "PostgreSQL",
      "MinIO"
    ],
    "category": "Cloud & MLOps",
    "source": "https://github.com/jadeleke/local-platform-infra/blob/main/README.md"
  },
  {
    "title": "Recall MCP",
    "description": "Persistent, searchable memory for MCP-capable AI agents, with SQLite full-text search and tools for saving, retrieving, and managing memories across sessions.",
    "repo": "https://github.com/jadeleke/recall-mcp",
    "demo": "",
    "tags": [
      "TypeScript",
      "Node.js",
      "MCP",
      "SQLite"
    ],
    "category": "Apps & Tools",
    "source": "https://github.com/jadeleke/recall-mcp/blob/main/README.md"
  },
  {
    "title": "PAL Tech Learning Hub",
    "description": "An offline-first technology learning application with interactive labs, quizzes, coding games, local learner profiles, and facilitator tools.",
    "repo": "https://github.com/jadeleke/pal-tech",
    "demo": "",
    "tags": [
      "TypeScript",
      "React",
      "PWA",
      "Vite"
    ],
    "category": "Apps & Tools",
    "source": "https://github.com/jadeleke/pal-tech/blob/main/README.md"
  },
  {
    "title": "LocalTongue Audio Classifier",
    "description": "A Flask application that classifies uploaded audio as Akan, Dagbani, or Ikposo using mel-spectrogram features and a TensorFlow/Keras model.",
    "repo": "https://github.com/jadeleke/LocalTongue-Audio-Classifier",
    "demo": "",
    "tags": [
      "Python",
      "Flask",
      "TensorFlow",
      "librosa"
    ],
    "category": "AI & Data",
    "source": "https://github.com/jadeleke/LocalTongue-Audio-Classifier/blob/main/README.md"
  },
  {
    "title": "Loop Engineering Studio",
    "description": "A browser-based planning tool for repeatable AI agent loops, including verification gates, human review, retry policies, and JSON, YAML, or Markdown export.",
    "repo": "https://github.com/jadeleke/loop-engineering-studio",
    "demo": "",
    "tags": [
      "JavaScript",
      "Agent tooling",
      "Workflow design"
    ],
    "category": "Apps & Tools",
    "source": "https://github.com/jadeleke/loop-engineering-studio/blob/main/README.md"
  },
  {
    "title": "Health Sentinel",
    "description": "A personal wellness prototype that reads Android Health Connect summaries, stores them locally, and compares daily signals with a recent baseline.",
    "repo": "https://github.com/jadeleke/Health-Sentinel",
    "demo": "",
    "tags": [
      "Kotlin",
      "Jetpack Compose",
      "FastAPI",
      "SQLite"
    ],
    "category": "Apps & Tools",
    "source": "https://github.com/jadeleke/Health-Sentinel/blob/main/README.md"
  },
  {
    "title": "PAL Evaluation",
    "description": "A volunteer reporting and cohort evaluation pilot with role-based access, session reports, attendance summaries, dashboards, and CSV exports.",
    "repo": "https://github.com/jadeleke/pal-evaluation",
    "demo": "",
    "tags": [
      "JavaScript",
      "Supabase",
      "PostgreSQL",
      "RLS"
    ],
    "category": "Apps & Tools",
    "source": "https://github.com/jadeleke/pal-evaluation/blob/main/README.md"
  },
  {
    "title": "English Audio Transcription (Wav2Vec2)",
    "description": "An English speech transcription script using pretrained Wav2Vec2, audio resampling and normalisation, and optional GPU inference.",
    "repo": "https://github.com/jadeleke/English-Audio-Transcription-Wav2Vec2",
    "demo": "",
    "tags": [
      "Python",
      "PyTorch",
      "Hugging Face",
      "ASR"
    ],
    "category": "AI & Data",
    "source": "https://github.com/jadeleke/English-Audio-Transcription-Wav2Vec2/blob/main/english_transcribed.py"
  },
  {
    "title": "Melanoma-Classification-Pipeline",
    "description": "A PyTorch skin-lesion classification project with data preparation, EfficientNet-B3 training, validation reports, and experiment visualisations.",
    "repo": "https://github.com/jadeleke/Melanoma-Classification-Pipeline",
    "demo": "",
    "tags": [
      "Python",
      "PyTorch",
      "Computer vision",
      "Evaluation"
    ],
    "source": "https://github.com/jadeleke/Melanoma-Classification-Pipeline/blob/main/IMPLEMENTATION.md",
    "category": "AI & Data"
  },
  {
    "title": "Akan-Whisper-Transcription",
    "description": "An Asante Twi speech transcription script using a pretrained Akan Whisper model with audio resampling and optional GPU inference.",
    "repo": "https://github.com/jadeleke/Akan-Whisper-Transcription",
    "demo": "",
    "tags": [
      "Python",
      "PyTorch",
      "Whisper",
      "ASR"
    ],
    "source": "https://github.com/jadeleke/Akan-Whisper-Transcription/blob/main/README.md",
    "category": "AI & Data"
  },
  {
    "title": "Multi-Language-Classifier",
    "description": "A Streamlit audio classifier for Akan, Dagbani, and Ikposo, using mel-spectrogram preprocessing and a TensorFlow/Keras model.",
    "repo": "https://github.com/jadeleke/Multi-Language-Classifier",
    "demo": "",
    "tags": [
      "Python",
      "Streamlit",
      "TensorFlow",
      "Audio"
    ],
    "source": "https://github.com/jadeleke/Multi-Language-Classifier/blob/main/app.py",
    "category": "AI & Data"
  },
  {
    "title": "react-docksmith",
    "description": "A containerised React portfolio demonstrating multi-stage Docker builds and Nginx serving.",
    "repo": "https://github.com/jadeleke/react-docksmith",
    "demo": "",
    "tags": [
      "React",
      "Docker",
      "Nginx"
    ],
    "source": "https://github.com/jadeleke/react-docksmith/blob/main/README.md",
    "category": "Cloud & MLOps"
  },
  {
    "title": "terraform-docker-nginx-app",
    "description": "Infrastructure-as-code demo deploying an Nginx app with Terraform and Docker.",
    "repo": "https://github.com/jadeleke/terraform-docker-nginx-app",
    "demo": "",
    "tags": [
      "Terraform",
      "Docker",
      "Nginx"
    ],
    "source": "https://github.com/jadeleke/terraform-docker-nginx-app/blob/main/README.md",
    "category": "Cloud & MLOps"
  },
  {
    "title": "docker-swarm-vagrant-demo",
    "description": "Provisioning a Docker Swarm cluster on Windows using Vagrant and VirtualBox.",
    "repo": "https://github.com/jadeleke/docker-swarm-vagrant-demo",
    "demo": "",
    "tags": [
      "Docker Swarm",
      "Vagrant",
      "VirtualBox"
    ],
    "source": "https://github.com/jadeleke/docker-swarm-vagrant-demo/blob/main/README.md",
    "category": "Cloud & MLOps"
  },
  {
    "title": "pdf2audiobook",
    "description": "A local PDF-to-audiobook command-line tool with chapter audio, merged outputs, and Piper or Coqui text-to-speech backends.",
    "repo": "https://github.com/jadeleke/pdf2audiobook",
    "demo": "",
    "tags": [
      "Python",
      "Text-to-speech",
      "FFmpeg",
      "CLI"
    ],
    "source": "https://github.com/jadeleke/pdf2audiobook/blob/main/README.md",
    "category": "Apps & Tools"
  }
];

  function validSelections(data) {
    if (!Array.isArray(data) || !data.length) return [];
    const valid = data.filter(item => item && typeof item.title === 'string' && item.title.trim() && (safeURL(item.repo) || safeURL(item.demo))
      && (item.description === undefined || typeof item.description === 'string')
      && (item.tags === undefined || (Array.isArray(item.tags) && item.tags.every(tag => typeof tag === 'string'))));
    return valid.length === data.length ? valid : [];
  }

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
    const source = element('p', 'skill-note');
    source.id = 'projects-source';
    container.before(source);
    pills.forEach(pill => pill.setAttribute('aria-pressed', String(pill.dataset.lang === 'all')));
    const more = element('button', 'btn projects-more', 'Show more repositories');
    more.id = 'projects-more';
    more.type = 'button';
    more.hidden = true;
    more.setAttribute('aria-controls', 'projects-list');
    container.after(more);
    let currentFilter = 'all';
    let curated = true;
    let sourceMode = 'curated';
    let visibleLimit = 12;
    let filteredRepos = [];
    function toRepositories(items) {
      return items.map(item => ({ name: item.title, description: item.description, html_url: item.repo, homepage: item.demo, brief: item.brief, topics: Array.isArray(item.tags) ? item.tags : [] }));
    }
    let repos = toRepositories(curatedSelections);

    function render(list) {
      const fragment = document.createDocumentFragment();
      const shown = curated ? list.length : Math.min(visibleLimit, list.length);
      count.textContent = curated ? `${list.length} ${list.length === 1 ? 'project' : 'projects'} shown`
        : `${shown} of ${list.length} ${list.length === 1 ? 'repository' : 'repositories'}`;
      more.hidden = curated || shown >= list.length;
      if (!list.length) {
        const empty = element('article', 'card');
        empty.append(element('h3', '', 'No projects match these filters'), element('p', 'muted', 'Try another search or language filter.'));
        const reset = element('button', 'btn', 'Clear filters');
        reset.type = 'button';
        reset.addEventListener('click', () => {
          if (filterInput) filterInput.value = '';
          selectFilter('all');
          applyFilters();
          filterInput?.focus();
        });
        empty.append(reset);
        fragment.append(empty);
      }
      list.slice(0, shown).forEach(repo => {
        const card = element('article', 'card repo-card');
        const header = element('div', 'repo-card-header');
        const title = element('h3', 'repo-title');
        const repoURL = safeURL(repo.html_url);
        title.append(repoURL ? externalLink(repoURL, repo.name || 'Repository') : element('span', '', repo.name || 'Repository'));
        header.append(title);
        card.append(header, element('p', 'muted repo-desc', repo.description || 'Explore the source and project documentation on GitHub.'));
        if (curated) {
          const tags = element('div', 'tag-strip');
          repo.topics.forEach(tag => tags.append(element('span', 'tag-pill', tag)));
          card.append(tags);
        } else {
          const stats = element('div', 'repo-stats');
          if (repo.language) {
            const language = element('span', 'repo-lang');
            const dot = element('span', 'repo-lang-color');
            dot.dataset.lang = String(repo.language);
            language.append(dot, document.createTextNode(String(repo.language)));
            stats.append(language);
          }
          if (Number.isFinite(repo.stargazers_count) && repo.stargazers_count > 0) stats.append(element('span', 'repo-stat', `${repo.stargazers_count} stars`));
          if (Number.isFinite(repo.forks_count) && repo.forks_count > 0) stats.append(element('span', 'repo-stat', `${repo.forks_count} forks`));
          const updated = new Date(repo.updated_at);
          if (repo.updated_at && !Number.isNaN(updated.getTime())) stats.append(element('span', 'repo-stat', `Updated ${updated.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`));
          card.append(stats);
        }
        const demoURL = safeURL(repo.homepage);
        const briefURL = localBriefURL(repo.brief);
        if (demoURL || briefURL) {
          const actions = element('div', 'repo-actions');
          if (briefURL) {
            const brief = element('a', 'btn primary btn-sm', 'Read project brief');
            brief.href = briefURL;
            actions.append(brief);
          }
          if (demoURL) actions.append(externalLink(demoURL, 'View live demo', 'btn btn-sm'));
          card.append(actions);
        }
        fragment.append(card);
      });
      container.replaceChildren(fragment);
    }

    function selectFilter(value) {
      currentFilter = value;
      pills.forEach(item => {
        const active = item.dataset.lang === value;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
    }
    function applyFilters(reset = true) {
      if (reset) visibleLimit = 12;
      const q = filterInput?.value.trim().toLowerCase() || '';
      const matches = repos.filter(repo => {
        const name = String(repo.name || '').toLowerCase();
        const description = String(repo.description || '').toLowerCase();
        const language = String(repo.language || '').toLowerCase();
        const topics = Array.isArray(repo.topics) ? repo.topics.map(t => String(t).toLowerCase()) : [];
        const searchMatch = !q || [name, description, language, ...topics].some(value => value.includes(q));
        let languageMatch = currentFilter === 'all';
        // Curated entries expose their recorded technology tags, never guessed language metadata.
        if (currentFilter === 'python') languageMatch = ['python', 'jupyter notebook'].includes(language) || (curated && topics.includes('python'));
        if (currentFilter === 'javascript') languageMatch = ['javascript', 'typescript'].includes(language) || (curated && topics.some(t => ['javascript', 'typescript', 'react'].includes(t)));
        if (currentFilter === 'java') languageMatch = ['java', 'kotlin'].includes(language) || (curated && topics.some(t => ['java', 'kotlin'].includes(t)));
        if (currentFilter === 'csharp') languageMatch = language === 'c#' || (curated && topics.some(t => ['c#', 'csharp', 'dotnet'].includes(t)));
        if (currentFilter === 'hcl') languageMatch = language === 'hcl' || (curated && topics.some(t => ['terraform', 'hcl'].includes(t)));
        if (currentFilter === 'shell') languageMatch = language === 'shell' || (curated && topics.some(t => ['shell', 'bash'].includes(t)));
        if (currentFilter === 'testing') languageMatch = topics.some(t => ['test', 'testing', 'pytest', 'jest', 'e2e', 'qa', 'tdd'].includes(t)) || name.includes('test') || description.includes('test');
        return searchMatch && languageMatch;
      });
      filteredRepos = matches;
      render(matches);
    }
    more.addEventListener('click', () => {
      const previous = Math.min(visibleLimit, filteredRepos.length);
      visibleLimit += 12;
      render(filteredRepos);
      container.children[previous]?.querySelector('a[href]')?.focus({ preventScroll: true });
    });
    filterInput?.addEventListener('input', applyFilters);
    pills.forEach(pill => pill.addEventListener('click', () => { selectFilter(pill.dataset.lang || 'all'); applyFilters(); }));
    source.textContent = 'Curated project selections · Checking for current GitHub metadata.';
    applyFilters();

    // The saved snapshot can paint first, but it never prevents a fresh GitHub request.
    function ownedRepositories(data) {
      if (!Array.isArray(data)) return [];
      return data.filter(repo => repo && typeof repo.name === 'string' && safeURL(repo.html_url) && !repo.fork && !repo.archived)
        .sort((a, b) => (Number(b.stargazers_count) || 0) - (Number(a.stargazers_count) || 0)
          || (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0));
    }
    function snapshotLabel(meta) {
      const date = meta && typeof meta.checkedAt === 'string' ? new Date(meta.checkedAt) : null;
      return date && Number.isFinite(date.getTime())
        ? `Saved GitHub snapshot · Checked ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}.`
        : 'Saved GitHub repository snapshot.';
    }
    getJSON(new URL('data/featured.json', siteURL)).then(data => {
      const items = validSelections(data);
      if (items.length && sourceMode === 'curated') { repos = toRepositories(items); applyFilters(false); }
    }).catch(() => {});
    let savedLabel = '';
    let snapshotMeta = null;
    let refreshFailed = false;
    function describeSnapshot() {
      source.textContent = refreshFailed
        ? `${savedLabel} Live GitHub metadata is temporarily unavailable; filters search the complete saved collection.`
        : `${savedLabel} Checking for current metadata.`;
    }
    // Optional metadata must not hold up the usable repository snapshot.
    getJSON(new URL('data/repos-cache-meta.json', siteURL)).then(meta => {
      snapshotMeta = meta;
      if (sourceMode === 'snapshot') { savedLabel = snapshotLabel(meta); describeSnapshot(); }
    }).catch(() => {});
    const snapshotRequest = getJSON(new URL('data/repos-cache.json', siteURL)).then(data => {
      const valid = ownedRepositories(data);
      if (!valid.length || sourceMode === 'live') return;
      savedLabel = snapshotLabel(snapshotMeta);
      sourceMode = 'snapshot';
      curated = false;
      repos = valid;
      describeSnapshot();
      applyFilters(false);
    }).catch(() => {});
    async function currentRepositories() {
      let next = 'https://api.github.com/users/jadeleke/repos?per_page=100&sort=updated';
      const data = [];
      const visited = new Set();
      for (let page = 0; next && page < 5; page++) {
        const url = new URL(next);
        if (url.origin !== 'https://api.github.com' || url.pathname !== '/users/jadeleke/repos' || visited.has(url.href)) throw new Error('Invalid repository pagination');
        visited.add(url.href);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(url, { cache: 'no-cache', signal: controller.signal, headers: { Accept: 'application/vnd.github+json' } });
          if (!response.ok) throw new Error('Repository metadata unavailable');
          const rows = await response.json();
          if (!Array.isArray(rows)) throw new Error('Invalid repository response');
          data.push(...rows);
          const match = (response.headers.get('Link') || '').match(/<([^>]+)>;\s*rel="next"/);
          next = match ? match[1] : '';
        } finally { clearTimeout(timeout); }
      }
      if (next) throw new Error('Repository pagination exceeds the bounded refresh');
      return ownedRepositories(data);
    }
    try {
      const valid = await currentRepositories();
      if (!valid.length) throw new Error('No repository metadata available');
      sourceMode = 'live';
      curated = false;
      repos = valid;
      source.textContent = 'Public GitHub repositories · Live metadata loaded for this visit.';
      applyFilters(false);
    } catch (_) {
      refreshFailed = true;
      await snapshotRequest;
      if (sourceMode === 'snapshot') describeSnapshot();
      else source.textContent = 'Curated project selections · Live GitHub metadata is temporarily unavailable. Filters still work with the recorded technology tags.';
    }
  })();

  (async function loadFeatured() {
    const container = document.getElementById('featured-list');
    if (!container) return;
    function render(items) {
      const fragment = document.createDocumentFragment();
      items.forEach(item => {
        const card = element('article', 'card repo-card');
        const title = element('h3', 'repo-title');
        const repoURL = safeURL(item.repo);
        const demoURL = safeURL(item.demo);
        title.append(repoURL ? externalLink(repoURL, item.title) : element('span', '', item.title));
        card.append(title, element('p', 'muted repo-desc', typeof item.description === 'string' ? item.description : 'Explore the project and source code.'));
        if (Array.isArray(item.tags)) {
          const tags = element('div', 'tag-strip');
          item.tags.filter(tag => typeof tag === 'string').forEach(tag => tags.append(element('span', 'tag-pill', tag)));
          card.append(tags);
        }
        const actions = element('div', 'repo-actions');
        const briefURL = localBriefURL(item.brief);
        if (briefURL) {
          const brief = element('a', 'btn primary', 'Read project brief');
          brief.href = briefURL;
          actions.append(brief);
        }
        if (repoURL) actions.append(externalLink(repoURL, 'Explore the source ↗', 'btn'));
        if (demoURL) actions.append(externalLink(demoURL, 'Live demo', 'btn primary'));
        card.append(actions);
        fragment.append(card);
      });
      container.replaceChildren(fragment);
    }
    function alreadyRendered(items) {
      const cards = [...container.querySelectorAll('.repo-card')];
      return cards.length === items.length && items.every((item, index) => {
        const card = cards[index];
        const title = card.querySelector('h3');
        const source = title?.querySelector('a[href]');
        const tags = [...card.querySelectorAll('.tag-pill')].map(tag => tag.textContent.trim());
        const expectedTags = Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [];
        return title?.textContent.trim() === item.title.trim()
          && (source?.href || '') === safeURL(item.repo)
          && card.querySelector('.repo-desc')?.textContent.trim() === (item.description || '').trim()
          && JSON.stringify(tags) === JSON.stringify(expectedTags)
          && (!localBriefURL(item.brief) || [...card.querySelectorAll('a[href]')].some(link => link.href === localBriefURL(item.brief)));
      });
    }
    // The complete static collection remains readable during failures and avoids needless layout churn.
    if (!container.querySelector('.repo-card')) render(curatedSelections);
    try {
      const items = validSelections(await getJSON(new URL('data/featured.json', siteURL)));
      if (items.length && !alreadyRendered(items)) render(items);
    } catch (_) { /* Keep the existing, complete static collection. */ }
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
