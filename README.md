# Joseph Adeleke - Research & Engineering

A static personal website for Joseph Adeleke, PhD student in Computer Science, DevSecOps & MLOps engineer, and Database Administrator. Semantic HTML, CSS, and small browser scripts; hosted on GitHub Pages.

## Design

- Editorial paper/forest palette, light and dark themes.
- Research-led homepage with an interactive conceptual workflow diagram.
- Dedicated research, biography, experience, education, credentials, projects, skills, writing, contact, and resume pages.
- Progressive scroll reveals, reading progress, persistent motion pause control, and reduced-motion support.
- Responsive keyboard navigation and readable static content without JavaScript.
- Searchable credentials, complete repository filtering, curated offline fallbacks, and source-linked project briefs.
- A shared Explore menu for secondary pages, generated from a single navigation template.

## Local preview

Run `python -m http.server 8000` from the repository root and open http://localhost:8000. No build or package installation is required.

## Validate

```sh
python scripts/check_site.py
node --check js/main.js
node --check js/animation.js
node --check js/theme.js
node --check sw.js
node --check js/resume.js
node scripts/test-accessibility.cjs
node scripts/test-reliability.cjs
node scripts/test-layout.cjs
```

Browser scripts require Playwright and Microsoft Edge in your development environment. They start temporary local HTTP servers and use controlled external API responses. No dependency is required for publishing the static site.

Browser checks cover 320px mobile through 1440px desktop, both themes, keyboard navigation, reduced motion, no JavaScript, and blocked external APIs. Clear site data or unregister the service worker when testing cache changes locally.

## Source map

- `index.html`: homepage. The diagram illustrates research interests, not measured results.
- `research.html`: academic direction and research interests.
- `openmed.html`: an evidence-led educational project brief, with source and reproduction links.
- `css/main.css`: shared tokens, layouts, components, responsive styles, motion rules.
- `css/projects.css` and `blog/blog.css`: page-specific styles.
- `js/theme.js`: appearance applied before paint.
- `js/main.js`: navigation, projects, featured work, workflow controls, credentials, email copying.
- `js/animation.js`: progressive motion and preferences.
- `data/featured.json`: 16 source-verified curated selections. `data/repos-cache.json` and `data/repos-cache-meta.json` hold a dated public snapshot while the browser refreshes live metadata. The verified snapshot contains 44 non-fork, non-archived repositories. All matching repositories remain searchable; Show more reveals additional results.
- `scripts/refresh_repos.py`: refresh the public GitHub snapshot.
- `scripts/build_projects.py`: regenerate static project and featured selections after editing curated metadata. Static checks detect drift.
- `blog/`: permanent local articles and the existing connected publishing interface. Local articles remain available if remote posts cannot load.
- `assets/Joseph-Adeleke-current.pdf`: the linked, current two-page CV. Historical PDFs remain archived.
- `scripts/build_resume.py`: regenerate the current PDF from the verified web profile. Install `scripts/requirements-resume.txt` first. Update the build date when changing the document, then render and visually check both pages.
- `assets/social-card.png`: social sharing image.
- `sw.js`: public offline assets and network-first project metadata. When changing shared static assets, update `ASSET_VERSION` in `scripts/sync_shell.py`, increment the worker cache version, and run the shell sync; add new public offline routes to `ASSETS`.
- `templates/header.html` and `templates/footer.html`: the shared navigation source.
- `docs/site-review-2026-11-06.md`: review findings, fixes, and verification scope.

After changing either shared template, run `python scripts/sync_shell.py`. Each generated HTML page remains self-contained and works without JavaScript. `python scripts/check_site.py` also detects shell drift. Add new public pages to `sitemap.xml` and keep `robots.txt` pointing to it.
