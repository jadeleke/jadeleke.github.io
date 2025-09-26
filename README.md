# joseph-adeleke.github.io

Static personal website rebuilt in the spirit of the [Hugo Coder](https://github.com/luizdepra/hugo-coder) theme.

## Structure

- `index.html` - hero-only landing page.
- `about.html`, `experience.html`, `education.html`, `featured.html`, `projects.html`, `skills.html`, `contact.html` - dedicated sections previously on the homepage.
- `blog/` - blog index plus individual posts under `blog/posts/`.
- `resume.html` - web resume with summary and downloadable PDF.
- `css/` and `js/` - theme styling and light client-side enhancements (theme toggle, project fetching).
- `sw.js` and `manifest.webmanifest` - optional PWA assets.

## GitHub API usage

Project and featured pages read from `data/repos-cache.json` if present, otherwise the client fetches directly from the public GitHub API.

## Assets

Add your resume at `assets/resume.pdf` and adjust colours or branding in `css/main.css` as desired.
