(function themeToggle() {
  const root = document.documentElement;
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  function icon(mode) {
    if (mode === "dark") return "D";
    if (mode === "light") return "L";
    return "A";
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
    const active = root.getAttribute("data-theme") || "auto";
    const next = active === "dark" ? "light" : active === "light" ? "auto" : "dark";
    if (next === "auto") {
      root.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    }
    update(root.getAttribute("data-theme") || "auto");
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

      const title = document.createElement("h3");
      title.textContent = repo.name;
      card.appendChild(title);

      if (repo.description) {
        const summary = document.createElement("p");
        summary.className = "muted";
        summary.textContent = repo.description;
        card.appendChild(summary);
      }

      const meta = document.createElement("p");
      meta.className = "repo-meta";
      const lang = repo.language || "Unknown";
      const stars = repo.stargazers_count || 0;
      const updated = new Date(repo.updated_at).toLocaleDateString();
      meta.textContent = `${lang} • ? ${stars} • Updated ${updated}`;
      card.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "hero-actions";

      const githubLink = document.createElement("a");
      githubLink.className = "btn";
      githubLink.href = repo.html_url;
      githubLink.target = "_blank";
      githubLink.rel = "noopener noreferrer";
      githubLink.textContent = "GitHub";
      actions.appendChild(githubLink);

      if (repo.homepage && /^https?:\/\//i.test(repo.homepage)) {
        const live = document.createElement("a");
        live.className = "btn primary";
        live.href = repo.homepage;
        live.target = "_blank";
        live.rel = "noopener noreferrer";
        live.textContent = "Live";
        actions.appendChild(live);
      }

      card.appendChild(actions);
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

    if (filterInput) {
      filterInput.addEventListener("input", () => {
        const q = filterInput.value.trim().toLowerCase();
        if (!q) {
          render(repos);
          return;
        }
        const filtered = repos.filter(repo =>
          (repo.name || "").toLowerCase().includes(q) ||
          (repo.description || "").toLowerCase().includes(q) ||
          (repo.language || "").toLowerCase().includes(q)
        );
        render(filtered);
      });
    }
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
      card.className = "card";

      const title = document.createElement("h3");
      title.textContent = item.title;
      card.appendChild(title);

      if (item.description) {
        const summary = document.createElement("p");
        summary.className = "muted";
        summary.textContent = item.description;
        card.appendChild(summary);
      }

      if (Array.isArray(item.tags) && item.tags.length) {
        const strip = document.createElement("div");
        strip.className = "tag-strip";
        item.tags.forEach(tag => {
          const pill = document.createElement("span");
          pill.className = "tag-pill";
          pill.textContent = tag;
          strip.appendChild(pill);
        });
        card.appendChild(strip);
      }

      const actions = document.createElement("div");
      actions.className = "hero-actions";

      if (item.repo) {
        const repoLink = document.createElement("a");
        repoLink.className = "btn";
        repoLink.href = item.repo;
        repoLink.target = "_blank";
        repoLink.rel = "noopener noreferrer";
        repoLink.textContent = "GitHub";
        actions.appendChild(repoLink);
      }

      if (item.demo) {
        const demoLink = document.createElement("a");
        demoLink.className = "btn primary";
        demoLink.href = item.demo;
        demoLink.target = "_blank";
        demoLink.rel = "noopener noreferrer";
        demoLink.textContent = "Live";
        actions.appendChild(demoLink);
      }

      if (actions.children.length) {
        card.appendChild(actions);
      }

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
