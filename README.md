# jadeleke.github.io

Personal website of Joseph Adeleke.

- Live site: https://jadeleke.github.io/
- Tech: plain HTML/CSS/JS + Chart.js (CDN)
  - Auto projects from GitHub API (with cache via CI)
  - Featured projects (curated, with README image auto-detect)
  - Blog with Markdown + per-post SEO and JSON-LD
  - RSS feed and sitemap built in CI

## Local Development

No build step required. Open `index.html` in a browser or serve the folder:

- Python: `python -m http.server 8000`
- Node: `npx http-server . -p 8000`

## Deploy

This repo is a user site (`<username>.github.io`). Push to `main` to update the site.

## Blog

Posts are indexed in `blog/posts.json` and stored as Markdown in `blog/posts/`.

- Fields: `slug`, `title`, `date` (YYYY-MM-DD), `tags` (array), `excerpt`, `mdPath` (path to `.md`)
- List page: `blog/index.html` renders all posts
- Post page: `blog/post.html?slug=<slug>` renders a single post
  - Per-post SEO tags and JSON-LD are injected at runtime.

To add a post:
- Add your Markdown file under `blog/posts/<slug>.md`
- Append an entry to `blog/posts.json` with `mdPath: "posts/<slug>.md"`

## Projects

The homepage auto-fetches public, non-fork repos from `https://github.com/jadeleke` and renders them by stars. Add a `homepage` URL in a repo to show a Demo button.

### Featured projects
- Curated list in `data/featured.json`
- Fields: `title`, `description`, `image` (`auto` to pull from README or a path), `repo` (URL), `demo` (URL, optional), `tags` (array)
- If the file is empty/missing, it falls back to the top 3 repos by stars.

### Local assets
- Avatar: `assets/avatar.png` (fetched from GitHub avatar)
- Default project image: `assets/project-default.svg`

## CI

GitHub Actions workflow `.github/workflows/site-ci.yml`:
- Validates `blog/posts.json` and referenced Markdown
- Caches GitHub repositories to `data/repos-cache.json` using `GITHUB_TOKEN`
- Commits cache changes back to `main`
- Generates `feed.xml` (RSS) and `sitemap.xml` from `blog/posts.json`

## Analytics

Plausible analytics is enabled for `jadeleke.github.io` via a lightweight script tag on all pages.

## Extras

- Manifest: `manifest.webmanifest` and `assets/favicon.svg`
- Accessibility: skip-link, focus styles, reduced-motion support
- Sections: Capabilities and Education on the homepage


## Resume

Place your PDF at ssets/resume.pdf to enable the Download Resume button on the homepage.
## Contact form (optional)
- A basic form is included on the homepage. By default it falls back to mailto:.
- To enable a provider like Formspark, set the data-contact-endpoint attribute on the #contact-form in index.html to your endpoint URL (e.g. https://submit-form.com/your-id).

## Project filter
- A search box filters projects by name, description, or language on the client side.
