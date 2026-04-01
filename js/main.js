(function themeToggle() {
  const root = document.documentElement;
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  function icon(mode) {
    if (mode === "dark") return "\u{1F319}";
    if (mode === "light") return "\u2600\uFE0F";
    return "\u25D0";
  }

  function describe(mode) {
    if (mode === "dark") return "dark";
    if (mode === "light") return "light";
    return "auto";
  }

  function update(mode) {
    button.textContent = icon(mode);
    button.setAttribute("aria-label", `Toggle theme (current ${describe(mode)})`);
    button.setAttribute("title", `Theme: ${describe(mode)}`);
  }

  const current = root.getAttribute("data-theme") || "auto";
  update(current);

  button.addEventListener("click", () => {
    const active = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const next = active === "dark" ? "light" : "dark";
    
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    update(next);
  });
})();

(function primaryNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("primary-menu");
  const body = document.body;
  if (!toggle || !menu) return;

  function closeMenu() {
    body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const open = body.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && body.classList.contains("menu-open")) {
      closeMenu();
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && body.classList.contains("menu-open")) {
      closeMenu();
    }
  });
})();

(async function loadProjects() {
  const container = document.getElementById("projects-list");
  if (!container) return;
  const filterInput = document.getElementById("projects-filter");
  const username = "jadeleke";
  let repos = [];

  function render(list) {
    container.innerHTML = "";
    if (!list.length) {
      const empty = document.createElement("article");
      empty.className = "card";
      empty.innerHTML = "<h3>No repositories found</h3><p class=\"muted\">Try a different filter or browse GitHub directly.</p>";
      container.appendChild(empty);
      return;
    }

    list.forEach(repo => {
      const card = document.createElement("article");
      card.className = "card";
      card.className = "card repo-card";

      card.innerHTML = `
        <div class="repo-card-header">
          <svg class="repo-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2.5 1.75v11.5c0 .138.112.25.25.25h3.17a.75.75 0 0 1 0 1.5H2.75A1.75 1.75 0 0 1 1 13.25V1.75C1 .784 1.784 0 2.75 0h8.5C12.216 0 13 .784 13 1.75v7.736a.75.75 0 0 1-1.5 0V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13.274 9.537l-1.04-2.08a.75.75 0 0 0-1.343 0l-1.04 2.08-2.295.334a.75.75 0 0 0-.416 1.28l1.66 1.618-.391 2.285a.75.75 0 0 0 1.088.791l2.053-1.08 2.053 1.08a.75.75 0 0 0 1.088-.79l-.392-2.286 1.66-1.618a.75.75 0 0 0-.416-1.28l-2.294-.334Z"></path></svg>
          <h3 class="repo-title">
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a>
          </h3>
        </div>
        ${repo.description ? `<p class="muted repo-desc">${repo.description}</p>` : '<p class="muted repo-desc"></p>'}
        <div class="repo-stats">
          ${repo.language ? `<span class="repo-lang"><span class="repo-lang-color" data-lang="${repo.language}"></span>${repo.language}</span>` : ''}
          ${repo.stargazers_count ? `
          <a class="repo-stat" href="${repo.html_url}/stargazers" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
            ${repo.stargazers_count}
          </a>` : ''}
          ${repo.forks_count ? `<span class="repo-stat"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.5a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>${repo.forks_count}</span>` : ''}
          <span class="repo-stat">Updated ${new Date(repo.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        ${repo.homepage && /^https?:\/\//i.test(repo.homepage) ? `
          <div class="repo-actions">
            <a class="btn primary btn-sm" href="${repo.homepage}" target="_blank" rel="noopener noreferrer">View Live Demo</a>
          </div>` : ''}
      `;
      container.appendChild(card);
    });
  }

  try {
    let data = [];
    try {
      const cached = await fetch("data/repos-cache.json", { cache: "no-cache" });
      if (cached.ok) data = await cached.json();
    } catch (_) {}

    if (!Array.isArray(data) || !data.length) {
      const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
        headers: { Accept: "application/vnd.github+json" }
      });
      if (!res.ok) throw new Error("GitHub API error");
      data = await res.json();
    }

    repos = data
      .filter(repo => !repo.fork && !repo.archived)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 12);

    render(repos);

    let currentFilter = 'all';

    function applyFilters() {
      const q = filterInput ? filterInput.value.trim().toLowerCase() : '';
      const filtered = repos.filter(repo => {
        const matchesSearch = !q || (
          (repo.name || "").toLowerCase().includes(q) ||
          (repo.description || "").toLowerCase().includes(q) ||
          (repo.language || "").toLowerCase().includes(q)
        );
        let matchesLang = true;
        if (currentFilter !== 'all') {
          const l = (repo.language || "").toLowerCase();
          if (currentFilter === 'python') matchesLang = l === 'python' || l === 'jupyter notebook';
          else if (currentFilter === 'javascript') matchesLang = l === 'javascript' || l === 'typescript';
          else if (currentFilter === 'hcl') matchesLang = l === 'hcl';
          else if (currentFilter === 'shell') matchesLang = l === 'shell';
        }
        return matchesSearch && matchesLang;
      });
      render(filtered);
    }

    if (filterInput) {
      filterInput.addEventListener("input", applyFilters);
    }

    const pills = document.querySelectorAll(".filter-pill");
    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        currentFilter = pill.getAttribute("data-lang") || 'all';
        applyFilters();
      });
    });
  } catch (err) {
    container.innerHTML = `<article class="card"><h3>GitHub unavailable</h3><p class="muted">Could not load repositories. <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">View my GitHub profile</a>.</p></article>`;
  }
})();

(async function loadFeatured() {
  const container = document.getElementById("featured-list");
  if (!container) return;

  try {
    let featured = [];
    const response = await fetch("data/featured.json", { cache: "no-cache" });
    if (response.ok) featured = await response.json();

    if (!featured.length) {
      const fallback = await fetch("https://api.github.com/users/jadeleke/repos?per_page=100&sort=updated", {
        headers: { Accept: "application/vnd.github+json" }
      });
      if (fallback.ok) {
        const repos = (await fallback.json())
          .filter(repo => !repo.fork && !repo.archived)
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 3);
        featured = repos.map(repo => ({
          title: repo.name,
          description: repo.description || "",
          tags: [repo.language || "project"],
          repo: repo.html_url,
          demo: repo.homepage || ""
        }));
      }
    }

    container.innerHTML = "";

    featured.forEach(item => {
      const card = document.createElement("article");
      card.className = "card repo-card";

      const tagsHtml = (Array.isArray(item.tags) && item.tags.length) 
        ? `<div class="tag-strip" style="margin-bottom: 16px;">
            ${item.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}
           </div>`
        : '';
        
      const actionsHtml = (item.repo || item.demo) 
        ? `<div class="repo-actions" style="display: flex; gap: 12px; border-top: none; padding-top: 0;">
            ${item.repo ? `<a class="btn" href="${item.repo}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
            ${item.demo ? `<a class="btn primary" href="${item.demo}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
           </div>`
        : '';

      card.innerHTML = `
        <div class="repo-card-header">
          <h3 class="repo-title">
            ${item.repo ? `<a href="${item.repo}" target="_blank" rel="noopener noreferrer">${item.title}</a>` : item.title}
          </h3>
        </div>
        ${item.description ? `<p class="muted repo-desc">${item.description}</p>` : '<p class="muted repo-desc"></p>'}
        ${tagsHtml}
        ${actionsHtml}
      `;

      container.appendChild(card);
    });
  } catch (_) {
    container.innerHTML = "<article class=\"card\"><h3>Could not load featured projects</h3><p class=\"muted\">Please retry later.</p></article>";
  }
})();

(function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
})();