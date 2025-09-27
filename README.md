# joseph-adeleke.github.io

Static personal website rebuilt in the spirit of the [Hugo Coder](https://github.com/luizdepra/hugo-coder) theme.

## Highlights

- Hero-first landing page with responsive navigation, theme toggle, and CTA-focused layout.
- Dedicated pages for about, experience, education, featured projects, projects, skills, contact, and resume content.
- Skill matrix, contact panel, and resume timeline tuned for mobile and desktop.
- Client-side GitHub integration powers projects and featured lists with graceful fallbacks.
- PWA scaffolding (`sw.js`, `manifest.webmanifest`) and theme colours for installable experiences.

## Structure

- `index.html` – hero landing page.
- `about.html`, `experience.html`, `education.html`, `featured.html`, `projects.html`, `skills.html`, `contact.html` – deep dives per topic.
- `resume.html` – web resume with download links and timeline.
- `blog/` – blog index and posts.
- `css/` and `js/` – design system and light interactivity.
- `data/` – optional cached GitHub responses and featured metadata.
- `assets/resume.pdf` – downloadable resume (replace with your latest copy).

## GitHub API usage

`projects.html` and `featured.html` prefer cached data in `data/repos-cache.json`, falling back to the public GitHub API when needed. The code limits listings and handles offline/API outage scenarios.

## Customising

Update colours, badges, or layout tokens in `css/main.css`. The navigation links are duplicated across pages; search for `primary-menu` if you add new sections. Replace `assets/resume.pdf` with an updated CV to keep download links accurate.
