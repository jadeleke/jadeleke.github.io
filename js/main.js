(function themeToggle() {
  const root = document.documentElement;
  const button = document.getElementById("theme-toggle");
  if (!button) return;

  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  }

  function label(mode) {
    if (mode === "dark") return "Dark";
    if (mode === "light") return "Light";
    return "Auto";
  }

  function icon(mode) {
    if (mode === "dark") return "D";
    if (mode === "light") return "L";
    return "A";
  }

  function setState(mode) {
    button.textContent = icon(mode);
    button.setAttribute("aria-label", `Toggle theme (current ${mode})`);
    button.setAttribute("title", `Theme: ${mode}`);
  }

  const current = root.getAttribute("data-theme") || "auto";
  setState(current);

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
    setState(root.getAttribute("data-theme") || "auto");
  });
})();

(function loadSkillsChart() {
  const canvas = document.getElementById("skills-chart");
  if (!canvas || typeof Chart === "undefined") return;
  const styles = getComputedStyle(document.documentElement);
  const axisColor = styles.getPropertyValue("--muted") || "#94a3b8";
  const accent = styles.getPropertyValue("--accent") || "#38bdf8";
  const accentStrong = styles.getPropertyValue("--accent-strong") || "#0ea5e9";

  new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Python", "Docker", "Kubernetes", "CI/CD", "Terraform", "MLflow/Airflow", "AWS", "Linux", "Oracle DBA"],
      datasets: [
        {
          label: "Proficiency",
          data: [90, 88, 78, 82, 74, 80, 76, 88, 72],
          backgroundColor: [accent, accentStrong, accent, accentStrong, accent, accentStrong, accent, accentStrong, accent]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: axisColor.trim() || "#94a3b8" },
          grid: { color: "rgba(148, 163, 184, 0.18)" }
        },
        x: {
          ticks: { color: axisColor.trim() || "#94a3b8" },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          labels: { color: styles.getPropertyValue("--text") || "#e2e8f0" }
        }
      }
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
      container.innerHTML = "<p>No repositories match the filter.</p>";
      return;
    }
    list.forEach(repo => {
      const card = document.createElement("article");
      card.className = "card";
      const title = document.createElement("h3");
      title.textContent = repo.name;
      const summary = document.createElement("p");
      summary.className = "muted";
      summary.textContent = repo.description || "No description provided.";
      const meta = document.createElement("p");
      meta.className = "repo-meta";
      const lang = repo.language || "Unknown";
      const stars = repo.stargazers_count || 0;
      const updated = new Date(repo.updated_at).toLocaleDateString();
      meta.textContent = `${lang} - Stars ${stars} - Updated ${updated}`;
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
      card.append(title, summary, meta, actions);
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
      const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers: { Accept: "application/vnd.github+json" } });
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
    container.innerHTML = `<p>Could not load repositories. <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">View GitHub</a>.</p>`;
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
      const fallback = await fetch("https://api.github.com/users/jadeleke/repos?per_page=100&sort=updated", { headers: { Accept: "application/vnd.github+json" } });
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
      card.appendChild(actions);
      container.appendChild(card);
    });
  } catch (_) {
    container.innerHTML = "<p>Could not load featured projects.</p>";
  }
})();

(function contactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = document.getElementById("contact-status");
  const submit = document.getElementById("contact-submit");

  const query = new URLSearchParams(window.location.search);
  const endpoint = query.get("formspark") || query.get("endpoint") || form.getAttribute("data-contact-endpoint") || "";

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!endpoint) {
      const name = encodeURIComponent(form.name?.value || "");
      const message = encodeURIComponent(form.message?.value || "");
      const subject = encodeURIComponent(`Website message from ${name}`);
      window.location.href = `mailto:akdeljoseph@outlook.com?subject=${subject}&body=${message}`;
      if (status) {
        status.textContent = "Opening your email client...";
        status.className = "form-status";
      }
      return;
    }

    try {
      const data = new FormData(form);
      data.set("_subject", "Website contact from jadeleke.github.io");
      data.set("_replyto", form.querySelector("#cf-email")?.value || "");
      data.set("_redirect", window.location.origin + "/#contact");

      if (status) {
        status.textContent = "Sending...";
        status.className = "form-status";
      }
      if (submit) submit.disabled = true;

      const res = await fetch(endpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });

      if (!res.ok) throw new Error("Submit failed");

      if (status) {
        status.textContent = "Thanks. Your message was sent.";
        status.className = "form-status is-success";
      }
      form.reset();
    } catch (err) {
      if (status) {
        status.textContent = "Sorry, there was a problem sending your message.";
        status.className = "form-status is-error";
      }
    } finally {
      if (submit) submit.disabled = false;
    }
  });
})();

(function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
})();
