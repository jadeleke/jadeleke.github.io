# Joseph Adeleke - Research & Engineering

A static personal website for Joseph Adeleke, PhD student in Computer Science, DevSecOps & MLOps engineer, and Database Administrator. Semantic HTML, CSS, and small browser scripts; hosted on GitHub Pages.

## Design

- Editorial paper/forest palette, light and dark themes.
- Research-led homepage with an interactive conceptual workflow diagram.
- Dedicated research, biography, experience, education, credentials, projects, skills, writing, contact, and resume pages.
- Progressive scroll reveals, reading progress, persistent motion pause control, and reduced-motion support.
- Responsive keyboard navigation and readable static content without JavaScript.
- Searchable credentials, accessible project filters, and offline content.

## Local preview

Run `python -m http.server 8000` from the repository root and open http://localhost:8000. No build or package installation is required.

## Validate

```sh
python scripts/check_site.py
node --check js/main.js
node --check js/animation.js
node --check js/theme.js
node --check sw.js
```

Browser checks should cover 320px mobile through 1440px desktop, both themes, keyboard navigation, reduced motion, no JavaScript, and blocked external APIs. Clear site data or unregister the service worker when testing cache changes locally.

## Source map

- `index.html`: homepage. The diagram illustrates research interests, not measured results.
- `research.html`: academic direction and research interests.
- `css/main.css`: shared tokens, layouts, components, responsive styles, motion rules.
- `css/projects.css` and `blog/blog.css`: page-specific styles.
- `js/theme.js`: appearance applied before paint.
- `js/main.js`: navigation, projects, featured work, workflow controls, credentials, email copying.
- `js/animation.js`: progressive motion and preferences.
- `data/featured.json`: curated selections. `data/repos-cache.json` optionally caches the GitHub response; an empty cache falls back to the public GitHub API.
- `blog/`: permanent local articles and the existing connected publishing interface. Local articles remain available if remote posts cannot load.
- `assets/Joseph-Adeleke.pdf`: linked downloadable CV; replace when updating the PDF.
- `assets/social-card.png`: social sharing image.
- `sw.js`: offline assets. Increment `CACHE_NAME` when shared assets change.

The header and footer are present in each HTML page. Keep their links consistent when adding a page, and update `sitemap.xml`.
